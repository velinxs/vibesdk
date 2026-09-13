export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface JsonRequest {
	/** Separate contexts: the evaluator and actor never share a conversation. */
	purpose: 'evaluator' | 'actor';
	messages: ChatMessage[];
	schema: Record<string, unknown>;
	schemaName: string;
	maxTokens: number;
	temperature: number;
}

export class ProviderError extends Error {
	constructor(
		message: string,
		public readonly retryable: boolean,
	) {
		super(message);
	}
}

/** A replaceable adapter that returns parsed JSON for a constrained request. */
export interface TextProvider {
	readonly name: string;
	readonly live: boolean;
	generateJson(request: JsonRequest): Promise<unknown>;
}

export function parseJsonLoose(text: string): unknown {
	const trimmed = text.trim();
	try {
		return JSON.parse(trimmed);
	} catch {
		const start = trimmed.indexOf('{');
		const end = trimmed.lastIndexOf('}');
		if (start >= 0 && end > start) {
			try {
				return JSON.parse(trimmed.slice(start, end + 1));
			} catch {
				return null;
			}
		}
		return null;
	}
}
