/**
 * Small seeded PRNG (mulberry32). State is a plain number so it can live
 * inside serializable game state and be restored from a checkpoint.
 */
export interface RngStep {
	value: number;
	next: number;
}

export function rngNext(state: number): RngStep {
	const a = (state + 0x6d2b79f5) | 0;
	let t = Math.imul(a ^ (a >>> 15), 1 | a);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	return { value, next: a };
}

export function rngPick<T>(state: number, items: readonly T[]): { item: T; next: number } {
	const step = rngNext(state);
	const index = Math.min(items.length - 1, Math.floor(step.value * items.length));
	return { item: items[index], next: step.next };
}

export function hashSeed(input: string): number {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}
