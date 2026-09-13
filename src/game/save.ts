import type { Difficulty, EndingKind, Mode, RoutineMastery } from 'shared/game/types';
import { DEFAULT_LOADOUT, ROUTINES } from 'shared/game/content/routines';

/**
 * Device-local save. Nothing here is account-backed; clearing browser storage
 * clears it. Encounter interest and scenario memory never persist across runs.
 */
export interface Settings {
	coachMuted: boolean;
	reducedMotion: boolean;
	speech: boolean;
	voice: boolean;
	quality: 'auto' | 'high' | 'medium' | 'low';
	difficulty: Difficulty;
	mode: Mode;
	avatarId: string;
	equipped: string[];
}

export interface RunRecord {
	runId: string;
	difficulty: Difficulty;
	mode: Mode;
	avatarId: string;
	finishedAt: number;
	encounters: Array<{ characterId: string; ending: EndingKind; turns: number; biasedEvents: number }>;
	modifiers: string[];
}

export interface SaveData {
	version: 1;
	settings: Settings;
	mastery: Record<string, RoutineMastery>;
	unlocked: string[];
	runs: RunRecord[];
	achievements: string[];
}

const KEY = 'after-hours.save.v1';

export const DEFAULT_SETTINGS: Settings = {
	coachMuted: false,
	reducedMotion: false,
	speech: false,
	voice: false,
	quality: 'auto',
	difficulty: 'normal',
	mode: 'practice',
	avatarId: 'sam',
	equipped: DEFAULT_LOADOUT.slice(0, 4),
};

export function emptySave(): SaveData {
	return {
		version: 1,
		settings: { ...DEFAULT_SETTINGS },
		mastery: {},
		unlocked: Object.values(ROUTINES).filter((r) => r.unlockedByDefault).map((r) => r.id),
		runs: [],
		achievements: [],
	};
}

export function loadSave(): SaveData {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return emptySave();
		const parsed = JSON.parse(raw) as Partial<SaveData>;
		if (parsed.version !== 1) return emptySave();
		const base = emptySave();
		return {
			version: 1,
			settings: { ...base.settings, ...(parsed.settings ?? {}) },
			mastery: parsed.mastery ?? {},
			unlocked: Array.from(new Set([...base.unlocked, ...(parsed.unlocked ?? [])])),
			runs: parsed.runs ?? [],
			achievements: parsed.achievements ?? [],
		};
	} catch {
		return emptySave();
	}
}

export function persistSave(save: SaveData): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(save));
	} catch {
		// Storage can be unavailable in private windows; the game still runs.
	}
}

/** Mastery grows on suitable executions only. Level caps at 3. */
export function recordRoutineExecution(save: SaveData, routineId: string, suitable: boolean): SaveData {
	const current = save.mastery[routineId] ?? { routineId, executions: 0, suitableExecutions: 0, level: 0 };
	const suitableExecutions = current.suitableExecutions + (suitable ? 1 : 0);
	const level = Math.min(3, Math.floor(suitableExecutions / 3));
	const mastery = { ...save.mastery, [routineId]: { routineId, executions: current.executions + 1, suitableExecutions, level } };
	const unlocked = new Set(save.unlocked);
	const totalLevels = Object.values(mastery).reduce((sum, m) => sum + m.level, 0);
	for (const routine of Object.values(ROUTINES)) {
		if (!routine.unlockedByDefault && totalLevels >= routine.unlockMastery) {
			unlocked.add(routine.id);
		}
	}
	return { ...save, mastery, unlocked: Array.from(unlocked) };
}

export function masteryLevels(save: SaveData): Record<string, number> {
	return Object.fromEntries(Object.values(save.mastery).map((m) => [m.routineId, m.level]));
}

const ACHIEVEMENTS: Record<EndingKind, string> = {
	number_exchange: 'Contact Information Acquired',
	date_plan: 'Logistics Secured',
	leave_together: 'Extraction Complete',
	friendly: 'A Real Place With Good People In It',
	graceful_exit: 'Dignity Intact',
	rejected: 'Romantic Application Declined',
};

export function achievementFor(ending: EndingKind): string {
	return ACHIEVEMENTS[ending];
}
