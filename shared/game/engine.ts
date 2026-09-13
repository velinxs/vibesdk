import type {
	Checkpoint,
	Difficulty,
	EncounterNode,
	EncounterState,
	EncounterSummary,
	EndingKind,
	IntentCategory,
	Interjection,
	Meters,
	Mode,
	ReactionTag,
	ResultBand,
	RoutineOutcome,
	RunState,
	ScoreDelta,
	TurnFeedback,
	TurnRecord,
	Character,
	ScenarioConfig,
	Expression,
	Gesture,
} from './types';
import type { EvaluatorObservation } from './evaluation';
import { CHARACTERS, getCharacter } from './content/characters';
import { BIAS_NODE_BY_CHARACTER, getNode, STAGE_TITLES } from './content/graph';
import { ROUTINES, DEFAULT_LOADOUT, MAX_EQUIPPED } from './content/routines';
import { AVATARS, getScenario } from './content/scenarios';
import { COACH_NOTIFICATIONS, COACH_COMMENTARY, type CoachEvent } from './content/coach';
import { hashSeed, rngNext, rngPick } from './rng';

export interface CreateRunParams {
	runId: string;
	seed: number;
	difficulty: Difficulty;
	mode: Mode;
	avatarId: string;
	equipped?: string[];
	coachMuted?: boolean;
	/** Mastery levels supplied by the client save. Bounded by the engine. */
	masteryLevels?: Record<string, number>;
	now?: number;
}

export interface CommittedEvent {
	turnId: string;
	characterId: string;
	nodeId: string;
	node: EncounterNode;
	reaction: ReactionTag;
	band: ResultBand;
	nextNode: EncounterNode;
	transitioned: boolean;
	ending: EndingKind | null;
	closed: boolean;
	feedback: TurnFeedback;
	metersAfter: Meters;
	/** Third party who speaks in the next node, if it is an NPC-initiated node with a supporting character. */
	interjectionSpeaker: string | null;
	fallbackLine: string;
	fallbackInterjection: Interjection | null;
	attribution: 'player' | 'npc_bias' | 'circumstance';
}

export interface OpeningEvent {
	characterId: string;
	nodeId: string;
	reaction: ReactionTag;
	fallbackLine: string;
	/** True when the NPC speaks first. */
	npcInitiates: boolean;
}

export interface ApplyTurnResult {
	run: RunState;
	committed: CommittedEvent;
}

export class EngineError extends Error {
	constructor(
		public readonly code: 'DUPLICATE_TURN' | 'VERSION_MISMATCH' | 'NO_ENCOUNTER' | 'CLOSED' | 'CHARACTER_CLOSED' | 'INVALID' | 'MODE',
		message: string,
	) {
		super(message);
	}
}

const LEAVE_TOGETHER = { interest: 78, comfort: 68, trust: 60 };
const DATE_PLAN = { interest: 58, trust: 42 };
const NUMBER_EXCHANGE = { interest: 50, trust: 32 };
const FRIENDLY_FLOOR = 36;
const HOLD_CONFIDENCE = 0.45;

function clampMeter(value: number): number {
	return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeUtterance(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((w) => w.length > 2)
		.sort()
		.join(' ');
}

function jaccard(a: string, b: string): number {
	const setA = new Set(a.split(' ').filter(Boolean));
	const setB = new Set(b.split(' ').filter(Boolean));
	if (setA.size === 0 || setB.size === 0) {
		return 0;
	}
	let inter = 0;
	for (const w of setA) {
		if (setB.has(w)) {
			inter += 1;
		}
	}
	return inter / (setA.size + setB.size - inter);
}

export function createRun(params: CreateRunParams): RunState {
	const scenario = getScenario(params.difficulty);
	if (!AVATARS[params.avatarId]) {
		throw new EngineError('INVALID', `Unknown avatar ${params.avatarId}`);
	}
	const equipped = (params.equipped ?? DEFAULT_LOADOUT).filter((id) => ROUTINES[id]).slice(0, MAX_EQUIPPED);
	const seed = params.seed >>> 0;
	return {
		runId: params.runId,
		version: 0,
		seed,
		rng: seed || 1,
		difficulty: scenario.difficulty,
		mode: params.mode,
		scenarioId: scenario.id,
		avatarId: params.avatarId,
		equipped,
		coachMuted: params.coachMuted ?? false,
		encounter: null,
		closedCharacters: [],
		completed: [],
		processedTurnIds: [],
		createdAt: params.now ?? Date.now(),
	};
}

function characterStartMeters(scenario: ScenarioConfig, character: Character, avatarId: string): Meters {
	const base = { ...scenario.startMeters };
	const avatar = AVATARS[avatarId];
	// Personality and context shape the opening, never ethnicity or background.
	if (character.traits.dislikesSpotlight) {
		base.comfort -= 4;
	}
	if (character.traits.initiates && scenario.npcInitiative > 0) {
		base.interest += 3;
	}
	if (character.id === 'sienna') {
		base.interest -= 6;
		base.trust -= 4;
	}
	if (avatar.background === 'newcomer' && scenario.newcomer) {
		// The fictional obstacle is a missing local network. It lowers trust, not competence.
		base.trust -= 4;
	}
	return {
		momentum: clampMeter(base.momentum),
		interest: clampMeter(base.interest),
		comfort: clampMeter(base.comfort),
		trust: clampMeter(base.trust),
	};
}

export function startEncounter(run: RunState, characterId: string): { run: RunState; opening: OpeningEvent } {
	const character = getCharacter(characterId);
	if (character.role !== 'principal') {
		throw new EngineError('INVALID', `${characterId} is not a principal character`);
	}
	if (run.closedCharacters.includes(characterId)) {
		throw new EngineError('CHARACTER_CLOSED', `${character.name} already ended her conversation with you tonight.`);
	}
	if (run.encounter && !run.encounter.closed) {
		throw new EngineError('INVALID', 'An encounter is already in progress.');
	}
	const scenario = getScenario(run.difficulty);
	let rng = run.rng;
	const entry = getNode(character.entryNode);

	// Authored immediate rejection, rolled once per encounter. The practice starter never rolls it.
	let authoredRejection: EncounterState['authoredRejection'] = null;
	const isPracticeStarter = run.mode === 'practice' && characterId === 'mara';
	const roll = rngNext(rng);
	rng = roll.next;
	if (!isPracticeStarter && roll.value < scenario.immediateRejectionChance) {
		const pick = rngPick(rng, character.rejectionNodes);
		rng = pick.next;
		authoredRejection = { nodeId: pick.item, reason: getNode(pick.item).hidden ?? 'She was not available tonight.' };
	}

	// NPC initiative on approach.
	const initiativeRoll = rngNext(rng);
	rng = initiativeRoll.next;
	const npcInitiates = character.traits.initiates && initiativeRoll.value < 0.3 * scenario.npcInitiative;

	const encounter: EncounterState = {
		characterId,
		nodeId: entry.id,
		turnsInNode: 0,
		nodeTotals: [],
		meters: characterStartMeters(scenario, character, run.avatarId),
		strikes: 0,
		closed: false,
		ending: null,
		playerFacts: [],
		revealedFacts: [],
		routinesUsed: [],
		utteranceKeys: [],
		authoredRejection,
		interruptionsFired: 0,
		pressureCount: 0,
		lastRoutineSuitable: false,
		routinesRecognized: 0,
		history: [],
		checkpoints: [],
	};
	const openingPick = rngPick(rng, entry.fallbackLines.initiating ?? ['...']);
	rng = openingPick.next;
	return {
		run: { ...run, rng, encounter, version: run.version + 1 },
		opening: {
			characterId,
			nodeId: entry.id,
			reaction: npcInitiates ? 'initiating' : 'engaged',
			fallbackLine: npcInitiates ? openingPick.item : '',
			npcInitiates,
		},
	};
}

function stageMinTurns(node: EncounterNode, scenario: ScenarioConfig): number {
	if (node.kind === 'conversation' || node.kind === 'tease') {
		return node.minTurns + scenario.stageTurnBonus;
	}
	return node.minTurns;
}

function styleFit(intent: IntentCategory, character: Character): number {
	const t = character.traits;
	switch (intent) {
		case 'tease':
		case 'agree_amplify':
		case 'reframe':
			return (t.wit - 1) * 0.4;
		case 'direct_interest':
		case 'invite':
			return (t.boldness - 1) * 0.4;
		case 'story':
		case 'question':
		case 'qualify':
			return (t.warmth - 1) * 0.3;
		case 'acknowledge':
			return (t.sincerity - 1) * 0.4;
		case 'scenario':
			return t.dislikesSpotlight ? -1 : 0.2;
		default:
			return 0;
	}
}

function bandFor(total: number, node: EncounterNode): ResultBand {
	const r = node.rubric;
	if (total >= r.strong) return 'strong';
	if (total >= r.good) return 'good';
	if (total >= 0) return 'neutral';
	if (total >= r.poor) return 'weak';
	return 'poor';
}

const REACTION_PRIORITY: Record<ResultBand, ReactionTag[]> = {
	strong: ['warming', 'accepting', 'sincere', 'relieved', 'amused', 'engaged', 'boundary'],
	good: ['engaged', 'amused', 'sincere', 'relieved', 'accepting', 'warming', 'boundary'],
	neutral: ['testing', 'clarifying', 'engaged', 'interrupted'],
	weak: ['unimpressed', 'testing', 'cooling', 'declining'],
	poor: ['cooling', 'declining', 'unimpressed', 'closing'],
	held: ['clarifying', 'testing', 'engaged'],
	closed: ['closing'],
};

function pickReaction(band: ResultBand, node: EncounterNode, override?: ReactionTag): ReactionTag {
	if (override && node.reactions.includes(override)) {
		return override;
	}
	for (const candidate of REACTION_PRIORITY[band]) {
		if (node.reactions.includes(candidate)) {
			return candidate;
		}
	}
	return node.reactions[0] ?? 'engaged';
}

interface RoutineResolution {
	outcome: RoutineOutcome | undefined;
	effect: Meters;
	totalAdjust: number;
	reactionOverride?: ReactionTag;
	events: CoachEvent[];
	suitable: boolean;
}

function resolveRoutine(
	obs: EvaluatorObservation,
	node: EncounterNode,
	character: Character,
	encounter: EncounterState,
	run: RunState,
	masteryLevels: Record<string, number>,
	band: ResultBand,
): RoutineResolution {
	const none: RoutineResolution = { outcome: undefined, effect: { momentum: 0, interest: 0, comfort: 0, trust: 0 }, totalAdjust: 0, events: [], suitable: false };
	const candidate = obs.routineCandidate;
	if (!candidate || candidate.confidence < 0.55) {
		if ((band === 'good' || band === 'strong') && obs.flags.relevantToCue && node.kind !== 'rejection' && node.kind !== 'ending') {
			return {
				...none,
				outcome: { routineId: null, kind: 'adaptation_bonus', label: 'Adaptation bonus. No routine, good fit.' },
				effect: { momentum: 2, interest: 0, comfort: 0, trust: 0 },
				events: ['adaptation'],
			};
		}
		return none;
	}
	const routine = ROUTINES[candidate.routineId];
	if (!routine) {
		return none;
	}
	const equipped = run.equipped.includes(routine.id);
	const level = Math.max(0, Math.min(3, Math.floor(masteryLevels[routine.id] ?? 0)));
	const scale = (equipped ? 1 : 0.5) * (1 + level * 0.1);
	const resists = routine.personaResists.some((trait) => Boolean(character.traits[trait as keyof Character['traits']]));
	const suitable = routine.suitableKinds.includes(node.kind) && node.stage >= routine.minStage && node.stage <= routine.maxStage;
	const repeated = encounter.routinesUsed.includes(routine.id);

	if (repeated) {
		return {
			...none,
			outcome: { routineId: routine.id, kind: 'recognized_by_both', label: 'ROUTINE RECOGNIZED. BY BOTH PARTIES.' },
			effect: { momentum: -2, interest: -2, comfort: 0, trust: 0 },
			totalAdjust: -1,
			reactionOverride: character.traits.recognizesRoutines ? 'recognized_routine' : undefined,
			events: ['recognized_by_both'],
			suitable: false,
		};
	}
	if (!suitable) {
		return {
			...none,
			outcome: { routineId: routine.id, kind: 'wrong_room', label: 'PERFECT EXECUTION. WRONG ROOM.' },
			totalAdjust: -1,
			events: ['wrong_room'],
			suitable: false,
		};
	}
	if (resists) {
		return {
			...none,
			outcome: { routineId: routine.id, kind: 'backfire', label: routine.backfire },
			effect: { momentum: -4, interest: -6, comfort: -4, trust: 0 },
			totalAdjust: -2.5,
			events: ['poor_turn'],
			suitable: false,
		};
	}
	if (character.traits.recognizesRoutines && obs.flags.stockPhrasing) {
		if (character.traits.enjoysPerformance) {
			return {
				...none,
				outcome: { routineId: routine.id, kind: 'recognized_suitable', label: `${routine.name}: recognized, and she enjoyed the performance.` },
				effect: {
					momentum: Math.round(routine.effect.momentum * 0.5 * scale),
					interest: Math.round(routine.effect.interest * 0.5 * scale),
					comfort: 0,
					trust: 0,
				},
				reactionOverride: 'enjoyed_performance',
				events: ['routine_recognized'],
				suitable: true,
			};
		}
		return {
			...none,
			outcome: { routineId: routine.id, kind: 'recognized_by_both', label: 'ROUTINE RECOGNIZED. BY BOTH PARTIES.' },
			effect: { momentum: -1, interest: -2, comfort: 0, trust: 0 },
			totalAdjust: -0.5,
			reactionOverride: 'recognized_routine',
			events: ['recognized_by_both'],
			suitable: false,
		};
	}
	const stack = encounter.lastRoutineSuitable ? 2 : 0;
	return {
		...none,
		outcome: { routineId: routine.id, kind: 'recognized_suitable', label: `${routine.name} recognized.${stack ? ' Stack bonus.' : ''}` },
		effect: {
			momentum: Math.round(routine.effect.momentum * scale) + stack,
			interest: Math.round(routine.effect.interest * scale),
			comfort: Math.round(routine.effect.comfort * scale),
			trust: Math.round(routine.effect.trust * scale),
		},
		totalAdjust: 0.5,
		events: ['routine_recognized'],
		suitable: true,
	};
}

function chooseRejection(character: Character, encounter: EncounterState, rng: number): { nodeId: string; rng: number } {
	const stock = character.rejectionNodes.filter((id) => /videos|dare|spotlight|network/.test(id));
	if (encounter.routinesRecognized >= 2 && stock.length > 0) {
		const pick = rngPick(rng, stock);
		return { nodeId: pick.item, rng: pick.next };
	}
	const pick = rngPick(rng, character.rejectionNodes);
	return { nodeId: pick.item, rng: pick.next };
}

function endingFor(kind: EndingKind): EncounterNode {
	return getNode(`ending.${kind}`);
}

function coachLines(events: CoachEvent[], rng: number, muted: boolean): { notifications: string[]; commentary: string[]; rng: number } {
	if (muted || events.length === 0) {
		return { notifications: [], commentary: [], rng };
	}
	const notifications: string[] = [];
	const commentary: string[] = [];
	let state = rng;
	for (const event of events.slice(0, 2)) {
		const n = rngPick(state, COACH_NOTIFICATIONS[event]);
		state = n.next;
		notifications.push(n.item);
		const c = rngPick(state, COACH_COMMENTARY[event]);
		state = c.next;
		commentary.push(c.item);
	}
	return { notifications, commentary, rng: state };
}

function supportingSpeaker(node: EncounterNode, characterId: string): string | null {
	if (!node.npcInitiates || node.kind !== 'interruption') {
		return null;
	}
	if (node.id.endsWith('interruption_early')) {
		return characterId === 'camille' ? 'theo' : characterId === 'elise' ? 'noor' : 'dev';
	}
	if (characterId === 'sienna') return 'brooke';
	if (characterId === 'mara') return 'priya';
	if (characterId === 'elise') return 'noor';
	if (characterId === 'camille') return 'marcus';
	return null;
}

const SUPPORTING_NAMES: Record<string, string> = { priya: 'Priya', noor: 'Noor', marcus: 'Marcus', brooke: 'Brooke', dev: 'Dev', theo: 'Theo', dani: 'Dani' };

export function speakerName(id: string): string {
	return CHARACTERS[id]?.name ?? SUPPORTING_NAMES[id] ?? id;
}

function fallbackFor(node: EncounterNode, reaction: ReactionTag, rng: number, avoid?: string): { line: string; rng: number } {
	const pool = node.fallbackLines[reaction] ?? Object.values(node.fallbackLines)[0] ?? ['...'];
	const candidates = pool.length > 1 && avoid ? pool.filter((line) => line !== avoid) : pool;
	const pick = rngPick(rng, candidates.length > 0 ? candidates : pool);
	return { line: pick.item, rng: pick.next };
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function snapshot(encounter: EncounterState, turn: number, rng: number): Checkpoint {
	const { checkpoints: _omit, ...rest } = encounter;
	void _omit;
	return { turn, state: clone(rest), rng };
}

/**
 * Applies one evaluated turn to the run. Pure: returns a new run. Throws
 * EngineError on duplicate turn ids, version mismatch, or a closed encounter.
 */
export function applyTurn(
	run: RunState,
	turnId: string,
	playerText: string,
	obs: EvaluatorObservation,
	masteryLevels: Record<string, number> = {},
): ApplyTurnResult {
	if (run.processedTurnIds.includes(turnId)) {
		throw new EngineError('DUPLICATE_TURN', 'This turn was already applied.');
	}
	if (obs.turnId !== turnId) {
		throw new EngineError('INVALID', 'Observation does not match the turn.');
	}
	if (obs.stateVersion !== run.version) {
		throw new EngineError('VERSION_MISMATCH', `Expected state version ${run.version}, got ${obs.stateVersion}.`);
	}
	const encounter = run.encounter;
	if (!encounter) {
		throw new EngineError('NO_ENCOUNTER', 'No encounter in progress.');
	}
	if (encounter.closed) {
		throw new EngineError('CLOSED', 'This conversation is over.');
	}
	const character = getCharacter(encounter.characterId);
	const scenario = getScenario(run.difficulty);
	const node = getNode(encounter.nodeId);
	const turnNumber = encounter.history.length + 1;
	let rng = run.rng;
	const events: CoachEvent[] = [];
	const checkpoints = [...encounter.checkpoints, snapshot(encounter, turnNumber, rng)];

	// Deterministic repetition detection, independent of the evaluator.
	const key = normalizeUtterance(playerText);
	const repeated = key.length > 0 && encounter.utteranceKeys.some((prev) => jaccard(prev, key) >= 0.75);

	let scores: ScoreDelta = { ...obs.scores };
	let band: ResultBand;
	const intent = obs.intent;
	let total = 0;
	let reactionOverride: ReactionTag | undefined;
	let attribution: TurnRecord['attribution'] = node.attribution ?? 'player';
	let routineResolution: RoutineResolution | undefined;

	if (obs.confidence < HOLD_CONFIDENCE || intent === 'unclear') {
		band = 'held';
		scores = { composure: 0, connection: 0, calibration: 0 };
		events.push('held');
	} else if (repeated || obs.flags.repeatsEarlier) {
		band = 'weak';
		scores = { composure: 0, connection: -1, calibration: -1 };
		total = -2;
		events.push('repeat');
	} else {
		const w = node.rubric.weights;
		total = scores.composure * w.composure + scores.connection * w.connection + scores.calibration * w.calibration;
		if (node.rubric.admissible.includes(intent)) {
			total += 1;
		} else if (node.rubric.misfit.includes(intent)) {
			total -= 1.5;
		}
		total += styleFit(intent, character);
		if (intent === 'manipulation') {
			total = Math.min(total, -3);
			scores = { composure: Math.min(scores.composure, -1), connection: Math.min(scores.connection, 0), calibration: -2 };
			events.push('manipulation');
		}
		if (obs.flags.contradictsKnownFact && node.kind !== 'consistency') {
			total = Math.min(total, -1);
			events.push('congruence');
		}
		const provisional = bandFor(total, node);
		routineResolution = resolveRoutine(obs, node, character, encounter, run, masteryLevels, provisional);
		total += routineResolution.totalAdjust;
		reactionOverride = routineResolution.reactionOverride;
		events.push(...routineResolution.events);
		band = bandFor(total, node);
	}

	// Meter deltas.
	const s = scenario.setbackScale;
	const neg = (v: number) => (v < 0 ? v * s : v);
	const meters: Meters = { ...encounter.meters };
	const farming = band === 'neutral' && encounter.turnsInNode >= 2;
	if (band !== 'held') {
		let dMomentum = neg(total * 3);
		let dInterest = neg((scores.connection + scores.calibration) * 2.5 + (band === 'strong' ? 3 : band === 'good' ? 1 : 0));
		let dComfort = neg((scores.composure + scores.calibration) * 2);
		let dTrust: number;
		if (node.kind === 'consistency' || node.kind === 'recovery' || node.kind === 'boundary') {
			dTrust = band === 'strong' || band === 'good' ? 5 : band === 'poor' ? -6 : 0;
		} else {
			dTrust = band === 'strong' ? 2 : band === 'poor' ? -3 : 0;
		}
		if (obs.flags.contradictsKnownFact) {
			dTrust -= 8;
		}
		if (farming) {
			dMomentum = Math.min(dMomentum, 0);
			dInterest = Math.min(dInterest, 0);
			dComfort = Math.min(dComfort, 0);
			dTrust = Math.min(dTrust, 0);
		}
		if (attribution === 'npc_bias') {
			// Someone else's prejudice cannot cost the player interest or trust.
			dInterest = Math.max(dInterest, 0);
			dTrust = Math.max(dTrust, 0);
			dMomentum = Math.max(dMomentum, 0);
			dComfort = Math.max(dComfort, 0);
		}
		meters.momentum = clampMeter(meters.momentum + dMomentum);
		meters.interest = clampMeter(meters.interest + dInterest);
		meters.comfort = clampMeter(meters.comfort + dComfort);
		meters.trust = clampMeter(meters.trust + dTrust);
		if (routineResolution?.effect) {
			const e = routineResolution.effect;
			meters.momentum = clampMeter(meters.momentum + e.momentum);
			meters.interest = clampMeter(meters.interest + e.interest);
			meters.comfort = clampMeter(meters.comfort + e.comfort);
			meters.trust = clampMeter(meters.trust + e.trust);
		}
	}

	// Strikes.
	let strikes = encounter.strikes;
	if (attribution !== 'npc_bias') {
		if (band === 'poor') {
			strikes += 1;
		} else if (band === 'weak' && meters.interest < 45) {
			strikes += 1;
		} else if (band === 'strong') {
			strikes = Math.max(0, strikes - 1);
		}
	}

	// Pressure tracking.
	let pressureCount = encounter.pressureCount;
	if (intent === 'pressure' || intent === 'manipulation' || obs.flags.continuesAfterRefusal) {
		pressureCount += 1;
	}

	// Coach events by intent and band.
	if (band === 'strong') events.push(run.difficulty === 'chad' && turnNumber <= 2 ? 'chad_help' : 'strong_turn');
	if (band === 'weak') events.push('weak_turn');
	if (band === 'poor') events.push('poor_turn');
	if (intent === 'defensive') events.push('defensive');
	if (intent === 'approval_seek') events.push('approval_seek');
	if (intent === 'story' && band !== 'held') events.push('story');
	if (intent === 'direct_interest' && band !== 'held') events.push('direct_interest');
	if (node.kind === 'interruption' && (band === 'good' || band === 'strong')) events.push('interruption_handled');
	if (attribution === 'npc_bias') events.push('bias_event');

	// Transition selection.
	const turnsInNode = encounter.turnsInNode + 1;
	const nodeTotals = [...encounter.nodeTotals, total];
	let nextNodeId = node.id;
	let ending: EndingKind | null = null;
	let closed = false;
	let interruptionsFired = encounter.interruptionsFired;
	let authoredRejection = encounter.authoredRejection;

	const minTurns = stageMinTurns(node, scenario);
	const advanceAllowed = turnsInNode >= minTurns;
	const average = nodeTotals.reduce((a, b) => a + b, 0) / nodeTotals.length;
	const forced = turnsInNode >= node.maxTurns;

	if (intent === 'exit' && band !== 'held') {
		ending = 'graceful_exit';
	} else if (authoredRejection && node.stage === 1) {
		nextNodeId = authoredRejection.nodeId;
		attribution = 'circumstance';
		authoredRejection = null;
	} else if (node.kind === 'boundary' && (intent === 'pressure' || intent === 'manipulation' || intent === 'invite' || intent === 'direct_interest' || band === 'poor')) {
		const choice = chooseRejection(character, encounter, rng);
		rng = choice.rng;
		nextNodeId = choice.nodeId;
	} else if (pressureCount >= 2 && node.kind !== 'boundary' && node.kind !== 'invitation' && node.kind !== 'logistics') {
		nextNodeId = `${character.id}.boundary`;
		pressureCount = 0;
		events.push('boundary');
	} else if (strikes >= scenario.strikeLimit) {
		const choice = chooseRejection(character, encounter, rng);
		rng = choice.rng;
		nextNodeId = choice.nodeId;
	} else if (band !== 'held' && obs.flags.contradictsKnownFact && node.kind !== 'consistency' && node.kind !== 'invitation' && node.kind !== 'logistics') {
		nextNodeId = `${character.id}.consistency`;
	} else if (node.kind === 'invitation' || node.kind === 'logistics') {
		const inviting = intent === 'invite' || intent === 'direct_interest';
		if (inviting && obs.flags.proposesLeaving) {
			if (meters.interest >= LEAVE_TOGETHER.interest && meters.comfort >= LEAVE_TOGETHER.comfort && meters.trust >= LEAVE_TOGETHER.trust && band !== 'poor' && band !== 'weak') {
				ending = 'leave_together';
			} else if (meters.interest >= FRIENDLY_FLOOR) {
				nextNodeId = node.kind === 'logistics' ? node.id : `${character.id}.logistics`;
				reactionOverride = 'declining';
			} else {
				ending = 'friendly';
			}
		} else if (inviting && band !== 'poor' && band !== 'weak') {
			if (obs.flags.containsConcretePlan && meters.interest >= DATE_PLAN.interest && meters.trust >= DATE_PLAN.trust) {
				ending = 'date_plan';
			} else if (meters.interest >= NUMBER_EXCHANGE.interest && meters.trust >= NUMBER_EXCHANGE.trust) {
				ending = 'number_exchange';
			} else if (meters.interest >= FRIENDLY_FLOOR) {
				nextNodeId = node.kind === 'logistics' ? node.id : `${character.id}.logistics`;
				reactionOverride = 'testing';
			} else {
				ending = 'friendly';
			}
		} else if (band === 'poor' || (forced && average < 0)) {
			ending = meters.interest >= FRIENDLY_FLOOR ? 'friendly' : 'rejected';
		} else if (forced) {
			nextNodeId = node.kind === 'logistics' ? 'ending.friendly' : `${character.id}.logistics`;
		}
	} else if (band === 'held') {
		nextNodeId = node.id;
	} else {
		const t = node.transitions;
		let target: string | undefined;
		if (band === 'strong' && advanceAllowed) target = t.strong ?? t.good;
		else if (band === 'good' && advanceAllowed) target = t.good;
		else if (band === 'neutral' && (advanceAllowed || forced) && (forced || turnsInNode >= minTurns + 1)) target = t.neutral ?? (average >= 0 && forced ? t.good : undefined);
		else if (band === 'weak') target = forced ? (t.weak ?? (average >= 0 ? t.good : t.poor)) : t.weak;
		else if (band === 'poor') target = scenario.recoveryOffered ? t.poor : t.weak;
		if (!target && forced) {
			target = average >= node.rubric.good ? t.good : average >= 0 ? (t.neutral ?? t.good) : (t.weak ?? t.poor ?? node.id);
			if (average < 0 && target === node.id) {
				strikes += 1;
			}
		}
		if (target && target !== node.id) {
			nextNodeId = target;
		}
	}

	// Interruption insertion rules.
	if (!ending && nextNodeId !== node.id) {
		const nextCandidate = getNode(nextNodeId);
		if (nextCandidate.id === `${character.id}.common_ground` && scenario.interruptionCount >= 2 && interruptionsFired === 0 && node.kind !== 'interruption') {
			nextNodeId = `${character.id}.interruption_early`;
			interruptionsFired += 1;
		} else if (nextCandidate.id === `${character.id}.interruption`) {
			if (scenario.interruptionCount === 0) {
				nextNodeId = `${character.id}.sincerity`;
			} else {
				interruptionsFired += 1;
				const avatar = AVATARS[run.avatarId];
				const biasNode = BIAS_NODE_BY_CHARACTER[character.id];
				if (scenario.newcomer && avatar.background === 'newcomer' && biasNode) {
					const biasRoll = rngNext(rng);
					rng = biasRoll.next;
					if (biasRoll.value < 0.7) {
						nextNodeId = biasNode;
					}
				}
			}
		}
	}

	if (strikes >= scenario.strikeLimit && !ending && getNode(nextNodeId).kind !== 'rejection') {
		const choice = chooseRejection(character, encounter, rng);
		rng = choice.rng;
		nextNodeId = choice.nodeId;
	}

	let nextNode = getNode(nextNodeId);
	if (ending) {
		nextNode = endingFor(ending);
		nextNodeId = nextNode.id;
	}
	if (nextNode.kind === 'rejection' || nextNode.kind === 'ending') {
		ending = nextNode.ending ?? 'rejected';
		closed = true;
	}
	if (ending === 'rejected') events.push('rejected');
	if (ending === 'number_exchange') events.push('number_exchange');
	if (ending === 'date_plan') events.push('date_plan');
	if (ending === 'leave_together') events.push('leave_together');
	if (ending === 'friendly') events.push('friendly');
	if (ending === 'graceful_exit') events.push('graceful_exit');
	if (nextNode.kind === 'interruption' && nextNode.id !== node.id) events.push(nextNode.attribution === 'npc_bias' ? 'bias_event' : 'interruption');

	const transitioned = nextNodeId !== node.id;
	const reaction = closed ? pickReaction('closed', nextNode, nextNode.kind === 'ending' ? 'accepting' : 'closing') : pickReaction(band, node, reactionOverride);

	// Fallback lines are chosen deterministically so a failed actor call stays reproducible.
	const lastLine = encounter.history.at(-1)?.npcLine;
	const fallback = fallbackFor(transitioned && nextNode.npcInitiates ? nextNode : node, transitioned && nextNode.npcInitiates ? pickReaction(band, nextNode, nextNode.kind === 'interruption' ? 'interrupted' : nextNode.kind === 'boundary' ? 'boundary' : reaction) : reaction, rng, lastLine);
	rng = fallback.rng;
	const interjectionSpeaker = transitioned ? supportingSpeaker(nextNode, character.id) : null;
	let fallbackInterjection: Interjection | null = null;
	if (interjectionSpeaker) {
		const pool = nextNode.interjectionLines ?? nextNode.fallbackLines[nextNode.attribution === 'npc_bias' ? 'biased_dismissal' : 'interrupted'] ?? ['...'];
		const pick = rngPick(rng, pool);
		rng = pick.next;
		fallbackInterjection = { speakerId: interjectionSpeaker, speakerName: speakerName(interjectionSpeaker), line: pick.item };
	}

	const coach = coachLines(events, rng, run.coachMuted);
	rng = coach.rng;

	const feedback: TurnFeedback = {
		scores,
		total: Math.round(total * 10) / 10,
		band,
		evidence: obs.evidence,
		explanation: obs.explanation,
		intent,
		routine: routineResolution?.outcome,
		notifications: [...(routineResolution?.outcome && routineResolution.outcome.kind !== 'recognized_suitable' && routineResolution.outcome.kind !== 'adaptation_bonus' ? [routineResolution.outcome.label] : []), ...coach.notifications],
		coachLines: coach.commentary,
		attribution,
	};

	const record: TurnRecord = {
		turn: turnNumber,
		turnId,
		nodeId: node.id,
		nodeKind: node.kind,
		stage: node.stage,
		playerText,
		evidence: obs.evidence,
		explanation: obs.explanation,
		scores,
		total: feedback.total,
		band,
		intent,
		routine: routineResolution?.outcome,
		reaction,
		npcLine: fallback.line,
		interjection: fallbackInterjection,
		expression: 'neutral',
		gesture: 'none',
		metersAfter: meters,
		notifications: feedback.notifications,
		attribution,
		nextNodeId,
		transitioned,
	};

	const playerFacts = [...encounter.playerFacts, ...obs.playerFactsAsserted.map((text) => ({ text, turn: turnNumber }))].slice(-12);
	const routinesUsed = routineResolution?.outcome?.routineId ? [...encounter.routinesUsed, routineResolution.outcome.routineId] : encounter.routinesUsed;
	const routinesRecognized = encounter.routinesRecognized + (routineResolution?.outcome?.kind === 'recognized_by_both' ? 1 : 0);

	const nextEncounter: EncounterState = {
		...encounter,
		nodeId: nextNodeId,
		turnsInNode: transitioned ? 0 : turnsInNode,
		nodeTotals: transitioned ? [] : nodeTotals,
		meters,
		strikes,
		closed,
		ending,
		playerFacts,
		routinesUsed,
		utteranceKeys: key ? [...encounter.utteranceKeys, key].slice(-30) : encounter.utteranceKeys,
		authoredRejection,
		interruptionsFired,
		pressureCount,
		lastRoutineSuitable: routineResolution?.suitable ?? false,
		routinesRecognized,
		history: [...encounter.history, record],
		checkpoints,
	};

	const completed = closed ? [...run.completed, summarize(nextEncounter)] : run.completed;
	const closedCharacters = closed ? [...run.closedCharacters, encounter.characterId] : run.closedCharacters;

	const nextRun: RunState = {
		...run,
		rng,
		version: run.version + 1,
		encounter: nextEncounter,
		completed,
		closedCharacters,
		processedTurnIds: [...run.processedTurnIds, turnId].slice(-200),
	};

	return {
		run: nextRun,
		committed: {
			turnId,
			characterId: character.id,
			nodeId: node.id,
			node,
			reaction,
			band,
			nextNode,
			transitioned,
			ending,
			closed,
			feedback,
			metersAfter: meters,
			interjectionSpeaker,
			fallbackLine: fallback.line,
			fallbackInterjection,
			attribution,
		},
	};
}

/** Records the actor's delivered line into the committed turn without touching scores. */
export function recordActorOutput(run: RunState, turnId: string, line: string, expression: Expression, gesture: Gesture, interjection: Interjection | null): RunState {
	if (!run.encounter) {
		return run;
	}
	const history = run.encounter.history.map((record) => (record.turnId === turnId ? { ...record, npcLine: line, expression, gesture, interjection } : record));
	return { ...run, encounter: { ...run.encounter, history } };
}

/** Practice mode only: restore the checkpoint taken before the given turn. */
export function rewindToTurn(run: RunState, turn: number): RunState {
	if (run.mode !== 'practice') {
		throw new EngineError('MODE', 'Rewind is only available in practice mode.');
	}
	const encounter = run.encounter;
	if (!encounter) {
		throw new EngineError('NO_ENCOUNTER', 'No encounter to rewind.');
	}
	const checkpoint = encounter.checkpoints.find((c) => c.turn === turn);
	if (!checkpoint) {
		throw new EngineError('INVALID', `No checkpoint for turn ${turn}.`);
	}
	const restored: EncounterState = {
		...clone(checkpoint.state),
		checkpoints: encounter.checkpoints.filter((c) => c.turn < turn),
	};
	const completed = run.completed.filter((c) => c.characterId !== encounter.characterId || !encounter.closed);
	return {
		...run,
		rng: checkpoint.rng,
		version: run.version + 1,
		encounter: restored,
		closedCharacters: run.closedCharacters.filter((id) => id !== encounter.characterId),
		completed,
	};
}

export function summarize(encounter: EncounterState): EncounterSummary {
	const sorted = [...encounter.history].sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
	const turningPoints = sorted.slice(0, 3).map((r) => `Turn ${r.turn} (${STAGE_TITLES[r.stage]}): ${r.band} on "${r.evidence}"`);
	return {
		characterId: encounter.characterId,
		ending: encounter.ending ?? 'rejected',
		turns: encounter.history.length,
		finalMeters: encounter.meters,
		turningPoints,
		biasedEvents: encounter.history.filter((r) => r.attribution === 'npc_bias').length,
	};
}

export function stageTitle(stage: number): string {
	return STAGE_TITLES[stage] ?? '';
}

export function seedFromRunId(runId: string): number {
	return hashSeed(runId);
}
