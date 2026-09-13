/**
 * Core types for the After Hours encounter engine.
 *
 * Everything here is fictional game state. Meters such as interest or trust
 * describe an authored encounter variable, never a real person.
 */

export type Difficulty = 'chad' | 'normal' | 'hard' | 'epic';
export type Mode = 'practice' | 'challenge';

export type NodeKind =
	| 'conversation'
	| 'tease'
	| 'consistency'
	| 'interruption'
	| 'recovery'
	| 'logistics'
	| 'boundary'
	| 'rejection'
	| 'invitation'
	| 'ending';

export type EndingKind =
	| 'number_exchange'
	| 'date_plan'
	| 'leave_together'
	| 'friendly'
	| 'graceful_exit'
	| 'rejected';

export type ScoreDimension = 'composure' | 'connection' | 'calibration';

export interface ScoreDelta {
	composure: number;
	connection: number;
	calibration: number;
}

export interface Meters {
	momentum: number;
	interest: number;
	comfort: number;
	trust: number;
}

/** Intent categories the evaluator may assign to a completed player turn. */
export type IntentCategory =
	| 'open'
	| 'tease'
	| 'agree_amplify'
	| 'reframe'
	| 'story'
	| 'callback'
	| 'direct_interest'
	| 'qualify'
	| 'question'
	| 'transition'
	| 'scenario'
	| 'acknowledge'
	| 'invite'
	| 'exit'
	| 'disagree'
	| 'pressure'
	| 'defensive'
	| 'approval_seek'
	| 'insult'
	| 'off_topic'
	| 'manipulation'
	| 'silence'
	| 'unclear';

export const INTENT_CATEGORIES: readonly IntentCategory[] = [
	'open',
	'tease',
	'agree_amplify',
	'reframe',
	'story',
	'callback',
	'direct_interest',
	'qualify',
	'question',
	'transition',
	'scenario',
	'acknowledge',
	'invite',
	'exit',
	'disagree',
	'pressure',
	'defensive',
	'approval_seek',
	'insult',
	'off_topic',
	'manipulation',
	'silence',
	'unclear',
];

/** Allowlisted NPC performance cues. The actor may only pick from these. */
export type Expression =
	| 'neutral'
	| 'amused'
	| 'warm'
	| 'intrigued'
	| 'skeptical'
	| 'bored'
	| 'annoyed'
	| 'surprised'
	| 'uncertain'
	| 'laughing'
	| 'cold';

export const EXPRESSIONS: readonly Expression[] = [
	'neutral',
	'amused',
	'warm',
	'intrigued',
	'skeptical',
	'bored',
	'annoyed',
	'surprised',
	'uncertain',
	'laughing',
	'cold',
];

export type Gesture =
	| 'none'
	| 'lean_in'
	| 'lean_back'
	| 'turn_away'
	| 'check_phone'
	| 'sip_drink'
	| 'hair_touch'
	| 'glance_friends'
	| 'cross_arms'
	| 'nod'
	| 'head_tilt'
	| 'stand_up'
	| 'wave_over';

export const GESTURES: readonly Gesture[] = [
	'none',
	'lean_in',
	'lean_back',
	'turn_away',
	'check_phone',
	'sip_drink',
	'hair_touch',
	'glance_friends',
	'cross_arms',
	'nod',
	'head_tilt',
	'stand_up',
	'wave_over',
];

/**
 * Reaction tags an authored node permits. The engine commits one of these;
 * the actor performs it.
 */
export type ReactionTag =
	| 'engaged'
	| 'amused'
	| 'warming'
	| 'testing'
	| 'unimpressed'
	| 'cooling'
	| 'deflecting'
	| 'clarifying'
	| 'recognized_routine'
	| 'enjoyed_performance'
	| 'interrupted'
	| 'relieved'
	| 'sincere'
	| 'accepting'
	| 'declining'
	| 'closing'
	| 'initiating'
	| 'boundary'
	| 'biased_dismissal';

export type ResultBand = 'strong' | 'good' | 'neutral' | 'weak' | 'poor' | 'held' | 'closed';

export interface NodeRubric {
	/** Relative weight of each dimension for this node. */
	weights: ScoreDelta;
	/** Intents that fit the node's objective. */
	admissible: IntentCategory[];
	/** Intents that specifically miss this node's point. */
	misfit: IntentCategory[];
	/** Turn total at or above which the turn counts as strong. */
	strong: number;
	/** Turn total at or above which the turn counts as good. */
	good: number;
	/** Turn total below which the turn counts as poor. */
	poor: number;
}

export interface NodeTransitions {
	strong?: string;
	good?: string;
	neutral?: string;
	weak?: string;
	poor?: string;
}

export interface EncounterNode {
	id: string;
	kind: NodeKind;
	stage: number;
	title: string;
	objective: string;
	/** Observable cues the player can read. Shown by the coach in practice mode only. */
	cues: string[];
	/** What the NPC is doing or saying when the node opens. Used by the actor. */
	situation: string;
	/** Conversation strategies that are admissible here, in plain language for the evaluator. */
	strategies: string[];
	rubric: NodeRubric;
	reactions: ReactionTag[];
	transitions: NodeTransitions;
	/** Minimum turns before a band can advance. Lets a stage breathe. */
	minTurns: number;
	/** Maximum turns before the node forces a transition using the running average. */
	maxTurns: number;
	/** Alternatives shown in the debrief for this node. */
	alternatives: string[];
	/** Authored fallback lines when no actor is available or its output is invalid. */
	fallbackLines: Partial<Record<ReactionTag, string[]>>;
	/** Authored lines for the supporting character who opens an NPC-initiated node. */
	interjectionLines?: string[];
	/** Rubric text hidden from the player in challenge mode. */
	hidden?: string;
	/** For rejection and ending nodes. */
	ending?: EndingKind;
	/** Marks the turn as an NPC action on entry, for example an interruption. */
	npcInitiates?: boolean;
	/** Set when the node represents another character's prejudice rather than the player's error. */
	attribution?: 'player' | 'npc_bias' | 'circumstance';
}

export type RoutineCategory =
	| 'opener'
	| 'agree_amplify'
	| 'reframe'
	| 'story'
	| 'callback'
	| 'direct'
	| 'qualification'
	| 'transition'
	| 'scenario'
	| 'recovery'
	| 'invitation'
	| 'exit';

export interface RoutineDefinition {
	id: string;
	name: string;
	category: RoutineCategory;
	description: string;
	/** The structural beats the evaluator should look for. */
	beats: string[];
	/** Examples of acceptable paraphrases; never required verbatim. */
	paraphrases: string[];
	suitableKinds: NodeKind[];
	/** Traits the NPC must have for the routine to land cleanly. Empty means any. */
	personaRequires: string[];
	/** Traits that make the NPC recognize or resist this routine. */
	personaResists: string[];
	/** Minimum stage at which this routine is appropriate. */
	minStage: number;
	/** Maximum stage at which this routine is appropriate. */
	maxStage: number;
	effect: {
		momentum: number;
		interest: number;
		comfort: number;
		trust: number;
	};
	backfire: string;
	unlockedByDefault: boolean;
	/** Mastery level required to equip. */
	unlockMastery: number;
}

export interface RoutineMastery {
	routineId: string;
	executions: number;
	suitableExecutions: number;
	level: number;
}

export interface CharacterTraits {
	/** Preference profile: how much each style lands. 0 to 2. */
	boldness: number;
	wit: number;
	warmth: number;
	sincerity: number;
	/** Whether she recognizes stock routines. */
	recognizesRoutines: boolean;
	/** Whether she enjoys a confident performance even when recognized. */
	enjoysPerformance: boolean;
	/** Whether she notices defensiveness quickly. */
	noticesDefensiveness: boolean;
	/** Dislikes being made to perform for strangers. */
	dislikesSpotlight: boolean;
	/** Sometimes initiates conversation. */
	initiates: boolean;
}

export interface Character {
	id: string;
	name: string;
	age: number;
	role: 'principal' | 'bartender' | 'friend' | 'rival';
	statusCue: string;
	followers: number;
	appearance: {
		hair: string;
		hairColor: string;
		skin: string;
		outfit: string;
		outfitColor: string;
		accentColor: string;
	};
	personality: string;
	voice: string;
	interests: string[];
	humor: string;
	friends: string[];
	reasonHere: string;
	mood: string;
	likesTopics: string[];
	turnOffs: string[];
	traits: CharacterTraits;
	/** Graph entry node for this character. */
	entryNode: string;
	/** Node ids for authored rejections the engine can choose from. */
	rejectionNodes: string[];
	/** Private facts the actor may reveal gradually. */
	facts: string[];
	difficultyNote: string;
	/** Fictional system prompt additions for the actor. */
	actorNotes: string;
}

export interface PlayerAvatar {
	id: string;
	name: string;
	description: string;
	background: 'local' | 'newcomer';
	/** Fictional style descriptors that feed the actor scene context. */
	style: string;
	strengths: string[];
}

export interface ScenarioConfig {
	id: string;
	name: string;
	description: string;
	difficulty: Difficulty;
	/** Starting meters before character adjustments. */
	startMeters: Meters;
	/** Strikes before the encounter closes. */
	strikeLimit: number;
	/** Momentum loss multiplier on weak turns. */
	setbackScale: number;
	/** Whether recovery nodes are offered after poor turns. */
	recoveryOffered: boolean;
	/** Probability of an authored immediate rejection on approach, rolled once per encounter. */
	immediateRejectionChance: number;
	/** Whether a group interruption node is inserted. */
	interruptionCount: number;
	/** Whether NPC initiative is boosted. */
	npcInitiative: number;
	/** Extra turns required before conversation and tease stages can advance. */
	stageTurnBonus: number;
	/** Advantages or obstacles listed in the debrief. */
	modifiers: string[];
	/** Set for the newcomer storyline. */
	newcomer: boolean;
}

export interface PlayerFact {
	text: string;
	turn: number;
}

export interface TurnRecord {
	turn: number;
	turnId: string;
	nodeId: string;
	nodeKind: NodeKind;
	stage: number;
	playerText: string;
	evidence: string;
	explanation: string;
	scores: ScoreDelta;
	total: number;
	band: ResultBand;
	intent: IntentCategory;
	routine?: RoutineOutcome;
	reaction: ReactionTag;
	npcLine: string;
	interjection: Interjection | null;
	expression: Expression;
	gesture: Gesture;
	metersAfter: Meters;
	notifications: string[];
	attribution: 'player' | 'npc_bias' | 'circumstance';
	nextNodeId: string;
	transitioned: boolean;
}

export type RoutineOutcomeKind =
	| 'recognized_suitable'
	| 'wrong_room'
	| 'recognized_by_both'
	| 'adaptation_bonus'
	| 'backfire';

export interface RoutineOutcome {
	routineId: string | null;
	kind: RoutineOutcomeKind;
	label: string;
}

export interface EncounterState {
	characterId: string;
	nodeId: string;
	turnsInNode: number;
	nodeTotals: number[];
	meters: Meters;
	strikes: number;
	closed: boolean;
	ending: EndingKind | null;
	/** Facts the player has asserted about himself, used for congruence. */
	playerFacts: PlayerFact[];
	/** Facts the NPC has revealed this run. */
	revealedFacts: string[];
	/** Routine ids used this encounter, for repetition history. */
	routinesUsed: string[];
	/** Normalized player utterances for repetition detection. */
	utteranceKeys: string[];
	/** Authored immediate rejection decided at approach. */
	authoredRejection: { nodeId: string; reason: string } | null;
	/** Interruptions already fired. */
	interruptionsFired: number;
	/** Pressure or manipulation intents seen this encounter. */
	pressureCount: number;
	/** Whether the last turn was a suitable routine, for stack bonuses. */
	lastRoutineSuitable: boolean;
	/** Recognized stock routines this encounter, for rejection selection. */
	routinesRecognized: number;
	history: TurnRecord[];
	/** Snapshot taken before each turn, for practice rewind. */
	checkpoints: Checkpoint[];
}

export interface Checkpoint {
	turn: number;
	state: Omit<EncounterState, 'checkpoints'>;
	rng: number;
}

export interface RunState {
	runId: string;
	version: number;
	seed: number;
	rng: number;
	difficulty: Difficulty;
	mode: Mode;
	scenarioId: string;
	avatarId: string;
	equipped: string[];
	coachMuted: boolean;
	encounter: EncounterState | null;
	/** Characters whose approaches are closed for this run. */
	closedCharacters: string[];
	completed: EncounterSummary[];
	processedTurnIds: string[];
	createdAt: number;
}

export interface EncounterSummary {
	characterId: string;
	ending: EndingKind;
	turns: number;
	finalMeters: Meters;
	turningPoints: string[];
	biasedEvents: number;
}

export interface TurnFeedback {
	scores: ScoreDelta;
	total: number;
	band: ResultBand;
	evidence: string;
	explanation: string;
	intent: IntentCategory;
	routine?: RoutineOutcome;
	notifications: string[];
	coachLines: string[];
	attribution: 'player' | 'npc_bias' | 'circumstance';
}

export interface Interjection {
	speakerId: string;
	speakerName: string;
	line: string;
}

export interface TurnResult {
	turnId: string;
	stateVersion: number;
	npcLine: string;
	interjection: Interjection | null;
	expression: Expression;
	gesture: Gesture;
	reaction: ReactionTag;
	feedback: TurnFeedback;
	nodeId: string;
	stage: number;
	stageTitle: string;
	meters: Meters;
	closed: boolean;
	ending: EndingKind | null;
	transitioned: boolean;
	/** Set when the result was served from the processed-turn cache. */
	replayed: boolean;
	/** The mode the result was produced under, so the HUD can label authored demo output. */
	provider: 'live' | 'demo';
}
