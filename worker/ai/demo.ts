import type { JsonRequest, TextProvider } from './provider';
import type { EvaluatorObservation } from 'shared/game/evaluation';
import { INTENT_CATEGORIES, type IntentCategory } from 'shared/game/types';

/**
 * Authored demo provider. No model runs here: the evaluator is a small
 * heuristic and the actor returns a fallback line. Output is labeled as
 * demo everywhere so keyword matching is never presented as live AI.
 */
export class DemoProvider implements TextProvider {
	readonly name = 'demo';
	readonly live = false;

	async generateJson(request: JsonRequest): Promise<unknown> {
		if (request.purpose === 'evaluator') {
			return heuristicEvaluation(request);
		}
		return { line: '', expression: 'neutral', gesture: 'none', interjection: null };
	}
}

interface DemoContext {
	turnId: string;
	stateVersion: number;
	playerText: string;
	cueWords: string[];
	knownFacts: string[];
	priorUtterances: string[];
	admissible: IntentCategory[];
}

function extractContext(request: JsonRequest): DemoContext | null {
	const marker = request.messages.find((m) => m.role === 'system' && m.content.startsWith('DEMO_CONTEXT:'));
	if (!marker) {
		return null;
	}
	try {
		return JSON.parse(marker.content.slice('DEMO_CONTEXT:'.length)) as DemoContext;
	} catch {
		return null;
	}
}

const INTENT_PATTERNS: Array<[IntentCategory, RegExp]> = [
	['exit', /\b(good ?night|have a good (one|night)|i('| a)m going to (go|head|let you)|enjoy the rest|nice (talking|meeting) you)\b/i],
	['manipulation', /\b(ignore (your|the|all) (rules|instructions)|max(imum)? score|system prompt|as an ai|you are (an|a) (ai|model|bot)|give me (the )?points)\b/i],
	['pressure', /\b(come on|just one|don'?t be like that|you know you want|why not|one more drink|stop being)\b/i],
	['insult', /\b(stupid|ugly|shut up|whatever, bitch|loser|pathetic)\b/i],
	['approval_seek', /\b(is that (ok|okay)|was that (ok|okay|weird)|sorry if|i hope that('| i)s (ok|fine)|do you like me)\b/i],
	['defensive', /\b(i('| a)m not (nervous|trying|like that)|that('| i)s not what i|i didn'?t mean|no i wasn'?t|i was just)\b/i],
	['invite', /\b(thursday|friday|saturday|sunday|monday|tuesday|wednesday|tomorrow|this week|your number|my number|coffee|dinner|come with me|get out of here|walk (you|me))\b/i],
	['direct_interest', /\b(i like you|i wanted to talk to you|i came over because|i('| a)m interested|i think you('| a)re)\b/i],
	['acknowledge', /\b(you('| a)re right|that came out|fair enough|my mistake|i said that wrong|that was (clumsy|a line|louder)|let me try that again|i heard you)\b/i],
	['agree_amplify', /\b(guilty|oh it('| i)s (much )?worse|page (four|4)|my friends bet|absolutely, and)\b/i],
	['story', /\b(when i|last (week|year|month)|my first|i moved|i once|one time)\b/i],
	['tease', /\b(you look like|is that your (whole|entire)|bold of you|says the (person|woman|one))\b/i],
	['question', /\?\s*$/],
];

function detectIntent(text: string, admissible: IntentCategory[]): IntentCategory {
	for (const [intent, pattern] of INTENT_PATTERNS) {
		if (pattern.test(text)) {
			return intent;
		}
	}
	if (admissible.includes('open')) {
		return 'open';
	}
	return admissible.includes('question') ? 'question' : 'transition';
}

function heuristicEvaluation(request: JsonRequest): EvaluatorObservation {
	const ctx = extractContext(request);
	if (!ctx) {
		throw new Error('Demo evaluator requires DEMO_CONTEXT.');
	}
	const text = ctx.playerText.trim();
	const words = text.toLowerCase().split(/[^a-z0-9']+/).filter((w) => w.length > 2);
	const cueHits = ctx.cueWords.filter((cue) => words.includes(cue.toLowerCase())).length;
	const intent = detectIntent(text, ctx.admissible);
	const lengthOk = words.length >= 4 && words.length <= 60;
	const relevant = cueHits > 0 || intent === 'acknowledge' || intent === 'exit';
	const repeats = ctx.priorUtterances.some((prev) => prev.toLowerCase() === text.toLowerCase());
	const negative = intent === 'pressure' || intent === 'insult' || intent === 'manipulation' || intent === 'approval_seek' || intent === 'defensive';

	let composure = negative ? -1 : lengthOk ? 1 : 0;
	if (intent === 'acknowledge') composure = 1;
	if (/!{2,}|[A-Z]{6,}/.test(text)) composure -= 1;
	const connection = negative ? -1 : Math.min(2, (cueHits > 0 ? 1 : 0) + (intent === 'question' || intent === 'story' || intent === 'callback' ? 1 : 0));
	const calibration = negative ? -1 : ctx.admissible.includes(intent) ? (relevant ? 2 : 1) : 0;
	const confidence = words.length < 2 ? 0.2 : 0.75;
	const evidence = text.slice(0, 120);
	const cueList = ctx.cueWords.slice(0, 3).join(', ');

	return {
		turnId: ctx.turnId,
		stateVersion: ctx.stateVersion,
		evidence,
		explanation: `Authored demo evaluation. Intent read as ${intent}; ${cueHits > 0 ? 'matches a scene cue' : `no cue words matched (${cueList})`}.`,
		scores: { composure, connection, calibration },
		intent: INTENT_CATEGORIES.includes(intent) ? intent : 'unclear',
		routineCandidate: null,
		flags: {
			relevantToCue: relevant,
			repeatsEarlier: repeats,
			continuesAfterRefusal: false,
			contradictsKnownFact: null,
			containsConcretePlan: /\b(thursday|friday|saturday|sunday|monday|tuesday|wednesday|tomorrow|at (\d|noon|seven|eight|nine|ten))\b/i.test(text),
			proposesLeaving: /\b(get out of here|leave together|walk (you|me) (out|home|to)|let'?s go)\b/i.test(text),
			stockPhrasing: /\b(come here often|heaven|angel|did it hurt)\b/i.test(text),
			includesThirdParty: /\b(priya|brooke|dani|noor|dev|theo)\b/i.test(text),
		},
		playerFactsAsserted: [],
		confidence,
	};
}
