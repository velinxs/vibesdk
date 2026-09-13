import { z } from 'zod';
import { INTENT_CATEGORIES, type IntentCategory } from './types';
import { ROUTINES } from './content/routines';

const scoreValue = z.number().min(-2).max(2);

/**
 * Structured observation the evaluator proposes for one completed player
 * turn. It never writes state; the engine applies rules to it exactly once.
 */
export const evaluatorObservationSchema = z.object({
	turnId: z.string().min(1).max(80),
	stateVersion: z.number().int().min(0),
	evidence: z.string().min(1).max(300),
	explanation: z.string().min(1).max(400),
	scores: z.object({
		composure: scoreValue,
		connection: scoreValue,
		calibration: scoreValue,
	}),
	intent: z.enum(INTENT_CATEGORIES as [IntentCategory, ...IntentCategory[]]),
	routineCandidate: z
		.object({
			routineId: z.string().min(1).max(60),
			confidence: z.number().min(0).max(1),
		})
		.nullable(),
	flags: z.object({
		relevantToCue: z.boolean(),
		repeatsEarlier: z.boolean(),
		continuesAfterRefusal: z.boolean(),
		contradictsKnownFact: z.string().max(200).nullable(),
		containsConcretePlan: z.boolean(),
		proposesLeaving: z.boolean(),
		stockPhrasing: z.boolean(),
		includesThirdParty: z.boolean(),
	}),
	playerFactsAsserted: z.array(z.string().min(1).max(160)).max(3),
	confidence: z.number().min(0).max(1),
});

export type EvaluatorObservation = z.infer<typeof evaluatorObservationSchema>;

/** JSON schema handed to providers that support constrained output. */
export const evaluatorJsonSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		turnId: { type: 'string' },
		stateVersion: { type: 'integer' },
		evidence: { type: 'string', description: 'Short verbatim excerpt from the player text that supports the judgment.' },
		explanation: { type: 'string', description: 'One or two sentences explaining the scores.' },
		scores: {
			type: 'object',
			additionalProperties: false,
			properties: {
				composure: { type: 'integer', minimum: -2, maximum: 2 },
				connection: { type: 'integer', minimum: -2, maximum: 2 },
				calibration: { type: 'integer', minimum: -2, maximum: 2 },
			},
			required: ['composure', 'connection', 'calibration'],
		},
		intent: { type: 'string', enum: [...INTENT_CATEGORIES] },
		routineCandidate: {
			anyOf: [
				{ type: 'null' },
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						routineId: { type: 'string', enum: Object.keys(ROUTINES) },
						confidence: { type: 'number', minimum: 0, maximum: 1 },
					},
					required: ['routineId', 'confidence'],
				},
			],
		},
		flags: {
			type: 'object',
			additionalProperties: false,
			properties: {
				relevantToCue: { type: 'boolean' },
				repeatsEarlier: { type: 'boolean' },
				continuesAfterRefusal: { type: 'boolean' },
				contradictsKnownFact: { anyOf: [{ type: 'null' }, { type: 'string' }] },
				containsConcretePlan: { type: 'boolean' },
				proposesLeaving: { type: 'boolean' },
				stockPhrasing: { type: 'boolean' },
				includesThirdParty: { type: 'boolean' },
			},
			required: ['relevantToCue', 'repeatsEarlier', 'continuesAfterRefusal', 'contradictsKnownFact', 'containsConcretePlan', 'proposesLeaving', 'stockPhrasing', 'includesThirdParty'],
		},
		playerFactsAsserted: { type: 'array', items: { type: 'string' }, maxItems: 3 },
		confidence: { type: 'number', minimum: 0, maximum: 1 },
	},
	required: ['turnId', 'stateVersion', 'evidence', 'explanation', 'scores', 'intent', 'routineCandidate', 'flags', 'playerFactsAsserted', 'confidence'],
} as const;

/**
 * Normalizes a raw observation: clamps and rounds scores, drops unknown
 * routine ids, and coerces an unknown intent into a low-confidence hold.
 */
export function sanitizeObservation(raw: unknown, turnId: string, stateVersion: number): EvaluatorObservation | null {
	if (typeof raw !== 'object' || raw === null) {
		return null;
	}
	const candidate = { ...(raw as Record<string, unknown>) };
	candidate.turnId = turnId;
	candidate.stateVersion = stateVersion;
	const scores = candidate.scores;
	if (typeof scores === 'object' && scores !== null) {
		const s = scores as Record<string, unknown>;
		for (const key of ['composure', 'connection', 'calibration']) {
			const value = typeof s[key] === 'number' && Number.isFinite(s[key]) ? (s[key] as number) : 0;
			s[key] = Math.max(-2, Math.min(2, Math.round(value)));
		}
	}
	if (typeof candidate.intent !== 'string' || !INTENT_CATEGORIES.includes(candidate.intent as IntentCategory)) {
		candidate.intent = 'unclear';
		candidate.confidence = 0;
	}
	const routine = candidate.routineCandidate;
	if (typeof routine === 'object' && routine !== null) {
		const r = routine as Record<string, unknown>;
		if (typeof r.routineId !== 'string' || !ROUTINES[r.routineId]) {
			candidate.routineCandidate = null;
		}
	} else {
		candidate.routineCandidate = null;
	}
	if (!Array.isArray(candidate.playerFactsAsserted)) {
		candidate.playerFactsAsserted = [];
	}
	if (typeof candidate.evidence === 'string') {
		candidate.evidence = candidate.evidence.slice(0, 300);
	}
	if (typeof candidate.explanation === 'string') {
		candidate.explanation = candidate.explanation.slice(0, 400);
	}
	const parsed = evaluatorObservationSchema.safeParse(candidate);
	return parsed.success ? parsed.data : null;
}

/** Actor output: one short in-character line plus allowlisted performance cues. */
export const actorOutputSchema = z.object({
	line: z.string().min(1).max(420),
	expression: z.string(),
	gesture: z.string(),
	interjection: z
		.object({
			speakerId: z.string().min(1).max(40),
			line: z.string().min(1).max(300),
		})
		.nullable(),
});

export type ActorOutput = z.infer<typeof actorOutputSchema>;

export const actorJsonSchema = {
	type: 'object',
	additionalProperties: false,
	properties: {
		line: { type: 'string', description: 'What the principal character says. One to three sentences.' },
		expression: { type: 'string' },
		gesture: { type: 'string' },
		interjection: {
			anyOf: [
				{ type: 'null' },
				{
					type: 'object',
					additionalProperties: false,
					properties: {
						speakerId: { type: 'string' },
						line: { type: 'string' },
					},
					required: ['speakerId', 'line'],
				},
			],
		},
	},
	required: ['line', 'expression', 'gesture', 'interjection'],
} as const;
