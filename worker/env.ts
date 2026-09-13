export type ProviderName = 'workers-ai' | 'demo';

export interface WorkerConfig {
	provider: ProviderName;
	workersAiActorModel: string;
	workersAiEvaluatorModel: string;
}

interface RawEnv {
	AI_PROVIDER?: string;
	WORKERS_AI_ACTOR_MODEL?: string;
	WORKERS_AI_EVALUATOR_MODEL?: string;
}

const DEFAULT_MODEL = '@cf/nvidia/nemotron-3-120b-a12b';

/** Reads provider configuration from bindings and vars. Nothing here is ever sent to the browser. */
export function readConfig(env: Env): WorkerConfig {
	const raw = env as unknown as RawEnv;
	const providerRaw = raw.AI_PROVIDER ?? 'workers-ai';
	const provider: ProviderName = providerRaw === 'demo' ? 'demo' : 'workers-ai';
	return {
		provider,
		workersAiActorModel: raw.WORKERS_AI_ACTOR_MODEL || DEFAULT_MODEL,
		workersAiEvaluatorModel: raw.WORKERS_AI_EVALUATOR_MODEL || DEFAULT_MODEL,
	};
}
