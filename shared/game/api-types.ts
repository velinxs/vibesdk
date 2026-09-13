import type { Difficulty, EncounterSummary, EndingKind, Meters, Mode, NodeKind, PlayerFact, TurnRecord } from './types';

/** Request to create a run. Mastery levels come from the device-local save. */
export interface CreateRunRequest {
	runId: string;
	difficulty: Difficulty;
	mode: Mode;
	avatarId: string;
	equipped: string[];
	coachMuted: boolean;
	masteryLevels: Record<string, number>;
	seed?: number;
}

/** What the browser is allowed to see of a run. Hidden rubric text and authored rejection reasons stay server-side until an encounter closes. */
export interface RunView {
	runId: string;
	version: number;
	seed: number;
	difficulty: Difficulty;
	mode: Mode;
	scenarioId: string;
	avatarId: string;
	equipped: string[];
	coachMuted: boolean;
	closedCharacters: string[];
	completed: EncounterSummary[];
	encounter: EncounterView | null;
}

export interface EncounterView {
	characterId: string;
	nodeId: string;
	nodeKind: NodeKind;
	stage: number;
	stageTitle: string;
	meters: Meters;
	strikes: number;
	closed: boolean;
	ending: EndingKind | null;
	history: TurnRecord[];
	checkpointTurns: number[];
	authoredRejectionReason: string | null;
	cues: string[];
	playerFacts: PlayerFact[];
}

export interface OpeningResponse {
	view: RunView;
	npcLine: string;
	expression: string;
	gesture: string;
	npcInitiates: boolean;
	provider: 'live' | 'demo';
}
