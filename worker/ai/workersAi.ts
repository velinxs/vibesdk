import { parseJsonLoose, ProviderError, type JsonRequest, type TextProvider } from './provider';

interface WorkersAiChatResponse {
	response?: unknown;
	choices?: Array<{ message?: { content?: string } }>;
}

/**
 * Reasoning models pad constrained JSON output with whitespace until the
 * token cap when their thinking phase is enabled, so thinking is switched off
 * for them. The evaluator and actor need a direct answer, not a chain of thought.
 */
const THINKING_MODEL_PREFIXES = ['@cf/nvidia/nemotron', '@cf/qwen/qwen3', '@cf/deepseek-ai/deepseek-r1', '@cf/zai-org/glm'];

function thinkingControl(model: string): Record<string, unknown> {
	return THINKING_MODEL_PREFIXES.some((prefix) => model.startsWith(prefix)) ? { chat_template_kwargs: { enable_thinking: false } } : {};
}

/**
 * Workers AI adapter. Uses JSON mode so the model output is constrained to
 * the schema. Actor and evaluator can use different models.
 */
export class WorkersAiProvider implements TextProvider {
	readonly name: string;
	readonly live = true;

	constructor(
		private readonly ai: Ai,
		private readonly actorModel: string,
		private readonly evaluatorModel: string,
	) {
		this.name = `workers-ai:${actorModel}`;
	}

	async generateJson(request: JsonRequest): Promise<unknown> {
		const model = request.purpose === 'actor' ? this.actorModel : this.evaluatorModel;
		let result: WorkersAiChatResponse;
		try {
			result = (await this.ai.run(model as keyof AiModels, {
				messages: request.messages,
				response_format: { type: 'json_schema', json_schema: request.schema },
				max_tokens: request.maxTokens,
				temperature: request.temperature,
				...thinkingControl(model),
			} as never)) as WorkersAiChatResponse;
		} catch (error) {
			throw new ProviderError(`Workers AI request failed: ${error instanceof Error ? error.message : String(error)}`, true);
		}
		const response = result.response ?? result.choices?.[0]?.message?.content;
		if (typeof response === 'string') {
			const parsed = parseJsonLoose(response);
			if (parsed === null) {
				throw new ProviderError('Workers AI returned non-JSON output.', true);
			}
			return parsed;
		}
		if (typeof response === 'object' && response !== null) {
			return response;
		}
		throw new ProviderError('Workers AI returned an empty response.', true);
	}
}
