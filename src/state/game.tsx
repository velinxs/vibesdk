import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { EndingKind, Expression, Gesture, TurnFeedback, TurnResult } from 'shared/game/types';
import { getScenario } from 'shared/game/content/scenarios';
import { getCharacter } from 'shared/game/content/characters';
import type { RunView } from 'shared/game/api-types';
import { api, ApiError, newId } from '../game/api';
import { achievementFor, loadSave, masteryLevels, persistSave, recordRoutineExecution, type SaveData, type Settings } from '../game/save';

export type Phase = 'menu' | 'lounge' | 'conversation' | 'debrief';

export interface TranscriptLine {
	id: string;
	speaker: string;
	speakerId: string;
	kind: 'player' | 'npc' | 'interjection' | 'system';
	text: string;
	turn?: number;
}

export interface Notification {
	id: string;
	text: string;
	tone: 'coach' | 'routine' | 'system';
}

export interface GameState {
	save: SaveData;
	phase: Phase;
	provider: 'live' | 'demo' | null;
	model: string | null;
	run: RunView | null;
	characterId: string | null;
	transcript: TranscriptLine[];
	lastFeedback: TurnFeedback | null;
	notifications: Notification[];
	coachLines: string[];
	expression: Expression;
	gesture: Gesture;
	awaiting: boolean;
	pendingText: string;
	pendingTurnId: string | null;
	error: string | null;
	ending: EndingKind | null;
	panel: 'none' | 'coach' | 'routines' | 'codex' | 'settings' | 'pause';
	approachTarget: string | null;
	exitSequence: boolean;
}

interface GameApi extends GameState {
	updateSettings: (patch: Partial<Settings>) => void;
	startRun: () => Promise<void>;
	approach: (characterId: string) => Promise<void>;
	sendTurn: (text: string) => Promise<void>;
	retry: () => Promise<void>;
	setPendingText: (text: string) => void;
	rewind: (turn: number) => Promise<void>;
	finishEncounter: () => void;
	backToLounge: () => void;
	toMenu: () => void;
	openPanel: (panel: GameState['panel']) => void;
	toggleCoach: () => Promise<void>;
	dismissNotification: (id: string) => void;
	clearError: () => void;
}

const GameContext = createContext<GameApi | null>(null);

function initialState(): GameState {
	return {
		save: loadSave(),
		phase: 'menu',
		provider: null,
		model: null,
		run: null,
		characterId: null,
		transcript: [],
		lastFeedback: null,
		notifications: [],
		coachLines: [],
		expression: 'neutral',
		gesture: 'none',
		awaiting: false,
		pendingText: '',
		pendingTurnId: null,
		error: null,
		ending: null,
		panel: 'none',
		approachTarget: null,
		exitSequence: false,
	};
}

export function GameProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<GameState>(initialState);
	const stateRef = useRef(state);
	stateRef.current = state;

	useEffect(() => {
		persistSave(state.save);
	}, [state.save]);

	useEffect(() => {
		api.health()
			.then((h) => setState((s) => ({ ...s, provider: h.provider, model: h.model })))
			.catch(() => setState((s) => ({ ...s, provider: null })));
	}, []);

	const notify = useCallback((texts: string[], tone: Notification['tone']) => {
		if (texts.length === 0) return;
		const items = texts.map((text) => ({ id: newId(), text, tone }));
		setState((s) => ({ ...s, notifications: [...s.notifications, ...items].slice(-4) }));
		for (const item of items) {
			window.setTimeout(() => setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== item.id) })), 5200);
		}
	}, []);

	const updateSettings = useCallback((patch: Partial<Settings>) => {
		setState((s) => ({ ...s, save: { ...s.save, settings: { ...s.save.settings, ...patch } } }));
	}, []);

	const startRun = useCallback(async () => {
		const { save } = stateRef.current;
		const runId = newId();
		setState((s) => ({ ...s, awaiting: true, error: null }));
		try {
			const run = await api.createRun({
				runId,
				difficulty: save.settings.difficulty,
				mode: save.settings.mode,
				avatarId: save.settings.avatarId,
				equipped: save.settings.equipped,
				coachMuted: save.settings.coachMuted,
				masteryLevels: masteryLevels(save),
			});
			setState((s) => ({ ...s, run, phase: 'lounge', awaiting: false, transcript: [], lastFeedback: null, ending: null, characterId: null, coachLines: [], exitSequence: false }));
		} catch (error) {
			setState((s) => ({ ...s, awaiting: false, error: error instanceof Error ? error.message : 'Could not start the run.' }));
		}
	}, []);

	const approach = useCallback(async (characterId: string) => {
		const { run } = stateRef.current;
		if (!run) return;
		const character = getCharacter(characterId);
		setState((s) => ({ ...s, awaiting: true, error: null, approachTarget: characterId, characterId, transcript: [], lastFeedback: null, coachLines: [], ending: null, exitSequence: false }));
		try {
			const opening = await api.approach(run.runId, characterId);
			const transcript: TranscriptLine[] = opening.npcInitiates ? [{ id: newId(), speaker: character.name, speakerId: characterId, kind: 'npc', text: opening.npcLine }] : [];
			setState((s) => ({
				...s,
				run: opening.view,
				phase: 'conversation',
				awaiting: false,
				transcript,
				expression: opening.npcInitiates ? (opening.expression as Expression) : 'neutral',
				gesture: opening.npcInitiates ? (opening.gesture as Gesture) : 'none',
				provider: opening.provider,
			}));
		} catch (error) {
			setState((s) => ({ ...s, awaiting: false, approachTarget: null, characterId: null, error: error instanceof Error ? error.message : 'Could not approach.' }));
		}
	}, []);

	const applyResult = useCallback(
		(result: TurnResult, text: string) => {
			const { run, characterId, save } = stateRef.current;
			if (!run || !characterId) return;
			const character = getCharacter(characterId);
			const lines: TranscriptLine[] = [{ id: newId(), speaker: 'You', speakerId: 'player', kind: 'player', text }];
			if (result.interjection) {
				lines.push({ id: newId(), speaker: result.interjection.speakerName, speakerId: result.interjection.speakerId, kind: 'interjection', text: result.interjection.line });
			}
			lines.push({ id: newId(), speaker: character.name, speakerId: characterId, kind: 'npc', text: result.npcLine });
			let nextSave = save;
			if (result.feedback.routine?.routineId) {
				nextSave = recordRoutineExecution(save, result.feedback.routine.routineId, result.feedback.routine.kind === 'recognized_suitable');
			}
			const stageChanged = result.transitioned && result.stage !== run.encounter?.stage;
			setState((s) => ({
				...s,
				save: nextSave,
				awaiting: false,
				pendingText: '',
				pendingTurnId: null,
				transcript: [...s.transcript, ...lines],
				lastFeedback: result.feedback,
				coachLines: [...result.feedback.coachLines, ...s.coachLines].slice(0, 12),
				expression: result.expression,
				gesture: result.gesture,
				ending: result.ending,
				provider: result.provider,
				exitSequence: result.ending === 'leave_together',
				run: s.run
					? {
							...s.run,
							version: result.stateVersion,
							encounter: s.run.encounter
								? {
										...s.run.encounter,
										nodeId: result.nodeId,
										stage: result.stage,
										stageTitle: result.stageTitle,
										meters: result.meters,
										closed: result.closed,
										ending: result.ending,
										history: [
											...s.run.encounter.history,
											{
												turn: s.run.encounter.history.length + 1,
												turnId: result.turnId,
												nodeId: s.run.encounter.nodeId,
												nodeKind: s.run.encounter.nodeKind,
												stage: s.run.encounter.stage,
												playerText: text,
												evidence: result.feedback.evidence,
												explanation: result.feedback.explanation,
												scores: result.feedback.scores,
												total: result.feedback.total,
												band: result.feedback.band,
												intent: result.feedback.intent,
												routine: result.feedback.routine,
												reaction: result.reaction,
												npcLine: result.npcLine,
												interjection: result.interjection,
												expression: result.expression,
												gesture: result.gesture,
												metersAfter: result.meters,
												notifications: result.feedback.notifications,
												attribution: result.feedback.attribution,
												nextNodeId: result.nodeId,
												transitioned: result.transitioned,
											},
										],
										checkpointTurns: [...s.run.encounter.checkpointTurns, s.run.encounter.history.length + 1],
									}
								: null,
						}
					: null,
			}));
			const routineNote = result.feedback.routine && (result.feedback.routine.kind === 'recognized_suitable' || result.feedback.routine.kind === 'adaptation_bonus') ? [result.feedback.routine.label] : [];
			notify(routineNote, 'routine');
			notify(result.feedback.notifications, 'coach');
			if (stageChanged && !result.closed) {
				notify([`STAGE ${String(result.stage).padStart(2, '0')}: ${result.stageTitle}`], 'system');
			}
			if (result.closed && result.ending) {
				notify([`ACHIEVEMENT: ${achievementFor(result.ending).toUpperCase()}`], 'system');
			}
		},
		[notify],
	);

	const sendTurn = useCallback(
		async (text: string) => {
			const { run, awaiting } = stateRef.current;
			if (!run || !run.encounter || run.encounter.closed || awaiting) return;
			const trimmed = text.trim();
			if (!trimmed) return;
			const turnId = stateRef.current.pendingTurnId ?? newId();
			setState((s) => ({ ...s, awaiting: true, error: null, pendingText: trimmed, pendingTurnId: turnId }));
			try {
				const result = await api.turn(run.runId, turnId, run.version, trimmed);
				applyResult(result, trimmed);
			} catch (error) {
				if (error instanceof ApiError && error.status === 409) {
					// Stale version: refresh from the server and keep the text.
					try {
						const fresh = await api.getRun(run.runId);
						setState((s) => ({ ...s, run: fresh, awaiting: false, pendingTurnId: null, error: 'The conversation moved on. Your text is still here.' }));
					} catch {
						setState((s) => ({ ...s, awaiting: false, error: error.message }));
					}
					return;
				}
				setState((s) => ({ ...s, awaiting: false, error: error instanceof Error ? error.message : 'Something went wrong.' }));
			}
		},
		[applyResult],
	);

	const retry = useCallback(async () => {
		const { pendingText } = stateRef.current;
		if (pendingText) {
			await sendTurn(pendingText);
		}
	}, [sendTurn]);

	const setPendingText = useCallback((text: string) => {
		setState((s) => ({ ...s, pendingText: text, pendingTurnId: s.pendingText === text ? s.pendingTurnId : null }));
	}, []);

	const rewind = useCallback(async (turn: number) => {
		const { run, characterId } = stateRef.current;
		if (!run || !characterId) return;
		setState((s) => ({ ...s, awaiting: true, error: null }));
		try {
			const view = await api.rewind(run.runId, turn);
			const character = getCharacter(characterId);
			const transcript: TranscriptLine[] = [];
			for (const record of view.encounter?.history ?? []) {
				transcript.push({ id: newId(), speaker: 'You', speakerId: 'player', kind: 'player', text: record.playerText, turn: record.turn });
				if (record.interjection) transcript.push({ id: newId(), speaker: record.interjection.speakerName, speakerId: record.interjection.speakerId, kind: 'interjection', text: record.interjection.line });
				transcript.push({ id: newId(), speaker: character.name, speakerId: characterId, kind: 'npc', text: record.npcLine, turn: record.turn });
			}
			const last = view.encounter?.history.at(-1);
			setState((s) => ({
				...s,
				run: view,
				awaiting: false,
				phase: 'conversation',
				transcript,
				ending: null,
				exitSequence: false,
				expression: last?.expression ?? 'neutral',
				gesture: last?.gesture ?? 'none',
				lastFeedback: last ? { scores: last.scores, total: last.total, band: last.band, evidence: last.evidence, explanation: last.explanation, intent: last.intent, routine: last.routine, notifications: [], coachLines: [], attribution: last.attribution } : null,
			}));
			notify([`REPLAY FROM TURN ${turn}`], 'system');
		} catch (error) {
			setState((s) => ({ ...s, awaiting: false, error: error instanceof Error ? error.message : 'Could not rewind.' }));
		}
	}, [notify]);

	const finishEncounter = useCallback(() => {
		setState((s) => ({ ...s, phase: 'debrief', panel: 'none' }));
	}, []);

	const backToLounge = useCallback(() => {
		setState((s) => {
			const run = s.run;
			if (!run) return { ...s, phase: 'menu' };
			return { ...s, phase: 'lounge', characterId: null, approachTarget: null, transcript: [], lastFeedback: null, ending: null, exitSequence: false, panel: 'none' };
		});
	}, []);

	const toMenu = useCallback(() => {
		setState((s) => {
			const run = s.run;
			let save = s.save;
			if (run && run.completed.length > 0) {
				const scenario = getScenario(run.difficulty);
				save = {
					...save,
					runs: [
						...save.runs,
						{
							runId: run.runId,
							difficulty: run.difficulty,
							mode: run.mode,
							avatarId: run.avatarId,
							finishedAt: Date.now(),
							encounters: run.completed.map((c) => ({ characterId: c.characterId, ending: c.ending, turns: c.turns, biasedEvents: c.biasedEvents })),
							modifiers: scenario.modifiers,
						},
					].slice(-30),
					achievements: Array.from(new Set([...save.achievements, ...run.completed.map((c) => achievementFor(c.ending))])),
				};
			}
			return { ...initialState(), save, provider: s.provider, model: s.model };
		});
	}, []);

	const openPanel = useCallback((panel: GameState['panel']) => {
		setState((s) => ({ ...s, panel: s.panel === panel ? 'none' : panel }));
	}, []);

	const toggleCoach = useCallback(async () => {
		const { run, save } = stateRef.current;
		const muted = !save.settings.coachMuted;
		updateSettings({ coachMuted: muted });
		if (run) {
			try {
				const view = await api.setCoachMuted(run.runId, muted);
				setState((s) => ({ ...s, run: { ...view, encounter: s.run?.encounter ?? view.encounter } }));
			} catch {
				// The local setting still applies to future runs.
			}
		}
	}, [updateSettings]);

	const dismissNotification = useCallback((id: string) => {
		setState((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
	}, []);

	const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

	const value = useMemo<GameApi>(
		() => ({ ...state, updateSettings, startRun, approach, sendTurn, retry, setPendingText, rewind, finishEncounter, backToLounge, toMenu, openPanel, toggleCoach, dismissNotification, clearError }),
		[state, updateSettings, startRun, approach, sendTurn, retry, setPendingText, rewind, finishEncounter, backToLounge, toMenu, openPanel, toggleCoach, dismissNotification, clearError],
	);

	return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameApi {
	const ctx = useContext(GameContext);
	if (!ctx) {
		throw new Error('useGame must be used inside GameProvider');
	}
	return ctx;
}
