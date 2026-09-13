import { DurableObject } from 'cloudflare:workers';
import type { RunState, TurnResult } from 'shared/game/types';
import type { CreateRunRequest, EncounterView, OpeningResponse, RunView } from 'shared/game/api-types';
export type { CreateRunRequest, OpeningResponse, RunView } from 'shared/game/api-types';
import { applyTurn, createRun, EngineError, recordActorOutput, rewindToTurn, seedFromRunId, stageTitle, startEncounter } from 'shared/game/engine';
import { getNode } from 'shared/game/content/graph';
import { readConfig } from '../env';
import { DemoProvider } from '../ai/demo';
import { WorkersAiProvider } from '../ai/workersAi';
import { ProviderError, type TextProvider } from '../ai/provider';
import { evaluateTurn } from '../evaluator';
import { performOpening, performTurn } from '../actor';

export function toView(run: RunState): RunView {
	const e = run.encounter;
	let encounter: EncounterView | null = null;
	if (e) {
		const node = getNode(e.nodeId);
		encounter = {
			characterId: e.characterId,
			nodeId: e.nodeId,
			nodeKind: node.kind,
			stage: node.stage,
			stageTitle: stageTitle(node.stage),
			meters: e.meters,
			strikes: e.strikes,
			closed: e.closed,
			ending: e.ending,
			history: e.history,
			checkpointTurns: e.checkpoints.map((c) => c.turn),
			authoredRejectionReason: e.closed ? (e.history.at(-1) ? getNode(e.history.at(-1)!.nextNodeId).hidden ?? null : null) : null,
			cues: run.mode === 'practice' ? node.cues : [],
			playerFacts: e.playerFacts,
		};
	}
	return {
		runId: run.runId,
		version: run.version,
		seed: run.seed,
		difficulty: run.difficulty,
		mode: run.mode,
		scenarioId: run.scenarioId,
		avatarId: run.avatarId,
		equipped: run.equipped,
		coachMuted: run.coachMuted,
		closedCharacters: run.closedCharacters,
		completed: run.completed,
		encounter,
	};
}

export class SessionError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly retryable = false,
	) {
		super(message);
	}
}

interface StoredResult {
	result: TurnResult;
}

/**
 * One Durable Object per run. Owns the authoritative run state, processes
 * turns exactly once, and caches results by turn id so retries are safe.
 */
export class EncounterSession extends DurableObject<Env> {
	private run: RunState | null = null;
	private masteryLevels: Record<string, number> = {};
	private inflight: Map<string, Promise<TurnResult>> = new Map();

	private provider(): TextProvider {
		const config = readConfig(this.env);
		if (config.provider === 'demo' || !this.env.AI) {
			return new DemoProvider();
		}
		return new WorkersAiProvider(this.env.AI, config.workersAiActorModel, config.workersAiEvaluatorModel);
	}

	private async load(): Promise<RunState> {
		if (this.run) {
			return this.run;
		}
		const stored = await this.ctx.storage.get<RunState>('run');
		if (!stored) {
			throw new SessionError(404, 'Run not found.');
		}
		this.masteryLevels = (await this.ctx.storage.get<Record<string, number>>('mastery')) ?? {};
		this.run = stored;
		return stored;
	}

	private async save(run: RunState): Promise<void> {
		this.run = run;
		await this.ctx.storage.put('run', run);
	}

	async create(request: CreateRunRequest): Promise<RunView> {
		const existing = await this.ctx.storage.get<RunState>('run');
		if (existing) {
			return toView(existing);
		}
		const run = createRun({
			runId: request.runId,
			seed: request.seed ?? seedFromRunId(request.runId),
			difficulty: request.difficulty,
			mode: request.mode,
			avatarId: request.avatarId,
			equipped: request.equipped,
			coachMuted: request.coachMuted,
		});
		this.masteryLevels = request.masteryLevels ?? {};
		await this.ctx.storage.put('mastery', this.masteryLevels);
		await this.save(run);
		return toView(run);
	}

	async get(): Promise<RunView> {
		return toView(await this.load());
	}

	async approach(characterId: string): Promise<OpeningResponse> {
		const run = await this.load();
		let started;
		try {
			started = startEncounter(run, characterId);
		} catch (error) {
			throw toSessionError(error);
		}
		const provider = this.provider();
		const delivery = await performOpening(started.run, started.opening, provider);
		await this.save(started.run);
		return {
			view: toView(started.run),
			npcLine: delivery.line,
			expression: delivery.expression,
			gesture: delivery.gesture,
			npcInitiates: started.opening.npcInitiates,
			provider: provider.live ? 'live' : 'demo',
		};
	}

	async turn(turnId: string, stateVersion: number, text: string): Promise<TurnResult> {
		const cached = await this.ctx.storage.get<StoredResult>(`result:${turnId}`);
		if (cached) {
			return { ...cached.result, replayed: true };
		}
		const pending = this.inflight.get(turnId);
		if (pending) {
			return pending;
		}
		const promise = this.processTurn(turnId, stateVersion, text).finally(() => this.inflight.delete(turnId));
		this.inflight.set(turnId, promise);
		return promise;
	}

	private async processTurn(turnId: string, stateVersion: number, text: string): Promise<TurnResult> {
		const run = await this.load();
		if (!run.encounter) {
			throw new SessionError(409, 'No encounter in progress.');
		}
		if (run.encounter.closed) {
			throw new SessionError(409, 'This conversation is over.');
		}
		if (stateVersion !== run.version) {
			throw new SessionError(409, `Stale state (expected version ${run.version}).`);
		}
		const provider = this.provider();
		let observation;
		try {
			observation = await evaluateTurn({ run, turnId, playerText: text, provider });
		} catch (error) {
			const retryable = error instanceof ProviderError ? error.retryable : true;
			throw new SessionError(503, 'The evaluator is unavailable. Your message was not scored; try again.', retryable);
		}
		let applied;
		try {
			applied = applyTurn(run, turnId, text, observation, this.masteryLevels);
		} catch (error) {
			throw toSessionError(error);
		}
		// Commit the authoritative result before the actor speaks so a delivery failure cannot double-apply.
		await this.save(applied.run);
		const delivery = await performTurn(applied.run, applied.committed, provider);
		const final = recordActorOutput(applied.run, turnId, delivery.line, delivery.expression, delivery.gesture, delivery.interjection);
		await this.save(final);
		const c = applied.committed;
		const result: TurnResult = {
			turnId,
			stateVersion: final.version,
			npcLine: delivery.line,
			interjection: delivery.interjection,
			expression: delivery.expression,
			gesture: delivery.gesture,
			reaction: c.reaction,
			feedback: c.feedback,
			nodeId: c.nextNode.id,
			stage: c.nextNode.stage,
			stageTitle: stageTitle(c.nextNode.stage),
			meters: c.metersAfter,
			closed: c.closed,
			ending: c.ending,
			transitioned: c.transitioned,
			replayed: false,
			provider: provider.live ? 'live' : 'demo',
		};
		await this.ctx.storage.put(`result:${turnId}`, { result } satisfies StoredResult);
		return result;
	}

	async rewind(turn: number): Promise<RunView> {
		const run = await this.load();
		try {
			const restored = rewindToTurn(run, turn);
			await this.save(restored);
			return toView(restored);
		} catch (error) {
			throw toSessionError(error);
		}
	}

	async setCoachMuted(muted: boolean): Promise<RunView> {
		const run = await this.load();
		const next = { ...run, coachMuted: muted };
		await this.save(next);
		return toView(next);
	}
}

function toSessionError(error: unknown): SessionError {
	if (error instanceof SessionError) {
		return error;
	}
	if (error instanceof EngineError) {
		const status = error.code === 'DUPLICATE_TURN' || error.code === 'VERSION_MISMATCH' || error.code === 'CLOSED' || error.code === 'CHARACTER_CLOSED' ? 409 : 400;
		return new SessionError(status, error.message);
	}
	return new SessionError(500, error instanceof Error ? error.message : 'Unknown error.');
}
