import type { TurnResult } from 'shared/game/types';
import type { CreateRunRequest, OpeningResponse, RunView } from 'shared/game/api-types';

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
		public readonly retryable: boolean,
	) {
		super(message);
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	let response: Response;
	try {
		response = await fetch(path, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
	} catch {
		throw new ApiError('Could not reach the server. Your message is still here; try again.', 0, true);
	}
	const body = (await response.json().catch(() => null)) as { error?: string; retryable?: boolean } | null;
	if (!response.ok) {
		throw new ApiError(body?.error ?? `Request failed (${response.status}).`, response.status, body?.retryable ?? response.status >= 500);
	}
	return body as T;
}

export const api = {
	health: () => request<{ ok: boolean; provider: 'live' | 'demo'; model: string | null }>('/api/health'),
	createRun: (body: CreateRunRequest) => request<RunView>('/api/runs', { method: 'POST', body: JSON.stringify(body) }),
	getRun: (runId: string) => request<RunView>(`/api/runs/${runId}`),
	approach: (runId: string, characterId: string) => request<OpeningResponse>(`/api/runs/${runId}/approach`, { method: 'POST', body: JSON.stringify({ characterId }) }),
	turn: (runId: string, turnId: string, stateVersion: number, text: string) => request<TurnResult>(`/api/runs/${runId}/turn`, { method: 'POST', body: JSON.stringify({ turnId, stateVersion, text }) }),
	rewind: (runId: string, turn: number) => request<RunView>(`/api/runs/${runId}/rewind`, { method: 'POST', body: JSON.stringify({ turn }) }),
	setCoachMuted: (runId: string, muted: boolean) => request<RunView>(`/api/runs/${runId}/coach`, { method: 'POST', body: JSON.stringify({ muted }) }),
};

export function newId(): string {
	const raw = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
	return raw.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
}
