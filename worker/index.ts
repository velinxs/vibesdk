import { Hono } from 'hono';
import { z } from 'zod';
import { EncounterSession, SessionError } from './session/EncounterSession';
import type { CreateRunRequest } from 'shared/game/api-types';
import { readConfig } from './env';
import { AVATARS } from 'shared/game/content/scenarios';
import { ROUTINES } from 'shared/game/content/routines';

export { EncounterSession };

const app = new Hono<{ Bindings: Env }>();

const createRunSchema = z.object({
	runId: z.string().regex(/^[a-z0-9-]{8,64}$/),
	difficulty: z.enum(['chad', 'normal', 'hard', 'epic']),
	mode: z.enum(['practice', 'challenge']),
	avatarId: z.string().refine((id) => Boolean(AVATARS[id]), 'Unknown avatar'),
	equipped: z.array(z.string().refine((id) => Boolean(ROUTINES[id]))).max(4).default([]),
	coachMuted: z.boolean().default(false),
	masteryLevels: z.record(z.string(), z.number().min(0).max(3)).default({}),
	seed: z.number().int().optional(),
});

const turnSchema = z.object({
	turnId: z.string().regex(/^[a-z0-9-]{8,64}$/),
	stateVersion: z.number().int().min(0),
	text: z.string().trim().min(1).max(600),
});

function stub(env: Env, runId: string): DurableObjectStub<EncounterSession> {
	const namespace = env.ENCOUNTER_SESSION as unknown as DurableObjectNamespace<EncounterSession>;
	return namespace.get(namespace.idFromName(runId));
}

function errorResponse(error: unknown): Response {
	if (error instanceof SessionError) {
		return Response.json({ error: error.message, retryable: error.retryable }, { status: error.status });
	}
	if (error instanceof Error && /Run not found/.test(error.message)) {
		return Response.json({ error: 'Run not found.', retryable: false }, { status: 404 });
	}
	if (error instanceof Error && /Stale state|conversation is over|already|No encounter|not a principal|in progress/.test(error.message)) {
		return Response.json({ error: error.message, retryable: false }, { status: 409 });
	}
	if (error instanceof Error && /evaluator is unavailable/i.test(error.message)) {
		return Response.json({ error: error.message, retryable: true }, { status: 503 });
	}
	console.error(error);
	return Response.json({ error: 'Something went wrong on the server.', retryable: true }, { status: 500 });
}

app.get('/api/health', (c) => {
	const config = readConfig(c.env);
	const live = config.provider !== 'demo' && Boolean(c.env.AI);
	return c.json({ ok: true, provider: live ? 'live' : 'demo', model: live ? config.workersAiActorModel : null });
});

app.post('/api/runs', async (c) => {
	const body = createRunSchema.safeParse(await c.req.json().catch(() => null));
	if (!body.success) {
		return c.json({ error: 'Invalid run request.', issues: body.error.issues }, 400);
	}
	try {
		const view = await stub(c.env, body.data.runId).create(body.data as CreateRunRequest);
		return c.json(view);
	} catch (error) {
		return errorResponse(error);
	}
});

app.get('/api/runs/:runId', async (c) => {
	try {
		return c.json(await stub(c.env, c.req.param('runId')).get());
	} catch (error) {
		return errorResponse(error);
	}
});

app.post('/api/runs/:runId/approach', async (c) => {
	const body = z.object({ characterId: z.string().min(1).max(40) }).safeParse(await c.req.json().catch(() => null));
	if (!body.success) {
		return c.json({ error: 'Invalid approach request.' }, 400);
	}
	try {
		return c.json(await stub(c.env, c.req.param('runId')).approach(body.data.characterId));
	} catch (error) {
		return errorResponse(error);
	}
});

app.post('/api/runs/:runId/turn', async (c) => {
	const body = turnSchema.safeParse(await c.req.json().catch(() => null));
	if (!body.success) {
		return c.json({ error: 'Invalid turn.', issues: body.error.issues }, 400);
	}
	try {
		const result = await stub(c.env, c.req.param('runId')).turn(body.data.turnId, body.data.stateVersion, body.data.text);
		return c.json(result);
	} catch (error) {
		return errorResponse(error);
	}
});

app.post('/api/runs/:runId/rewind', async (c) => {
	const body = z.object({ turn: z.number().int().min(1) }).safeParse(await c.req.json().catch(() => null));
	if (!body.success) {
		return c.json({ error: 'Invalid rewind request.' }, 400);
	}
	try {
		return c.json(await stub(c.env, c.req.param('runId')).rewind(body.data.turn));
	} catch (error) {
		return errorResponse(error);
	}
});

app.post('/api/runs/:runId/coach', async (c) => {
	const body = z.object({ muted: z.boolean() }).safeParse(await c.req.json().catch(() => null));
	if (!body.success) {
		return c.json({ error: 'Invalid coach request.' }, 400);
	}
	try {
		return c.json(await stub(c.env, c.req.param('runId')).setCoachMuted(body.data.muted));
	} catch (error) {
		return errorResponse(error);
	}
});

app.notFound((c) => c.json({ error: 'Not found.' }, 404));

export default app;
