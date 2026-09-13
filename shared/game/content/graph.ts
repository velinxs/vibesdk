import type { EncounterNode, EndingKind, NodeKind, NodeRubric, ReactionTag } from '../types';

export const STAGE_TITLES: Record<number, string> = {
	1: 'APPROACH',
	2: 'FIRST CONTACT',
	3: 'PLAYFUL PRESSURE',
	4: 'COMMON GROUND',
	5: 'THE INTERRUPTION',
	6: 'THE SINCERITY CHECK',
	7: 'THE ASK',
	8: 'LAST CALL',
};

export const STAGE_COUNT = 8;

interface StageText {
	situation: string;
	cues: string[];
	strategies: string[];
	alternatives: string[];
	fallback: Partial<Record<ReactionTag, string[]>>;
	hidden?: string;
}

interface RejectionText {
	id: string;
	title: string;
	situation: string;
	lines: string[];
	/** Shown only in the after-action replay. */
	authorReason: string;
}

interface CharacterGraphSpec {
	id: string;
	approach: StageText;
	firstContact: StageText;
	playful: StageText;
	commonGround: StageText;
	interruption: StageText;
	interruptionEarly: StageText;
	sincerity: StageText;
	ask: StageText;
	logistics: StageText;
	recoveryA: StageText;
	recoveryB: StageText;
	consistency: StageText;
	boundary: StageText;
	rejections: RejectionText[];
	/** Optional authored bias event for the newcomer storyline. */
	biasInterruption?: StageText;
}

const RUBRICS: Record<NodeKind, NodeRubric> = {
	conversation: {
		weights: { composure: 1, connection: 1.2, calibration: 1 },
		admissible: ['open', 'question', 'story', 'callback', 'qualify', 'transition', 'scenario', 'tease', 'reframe', 'direct_interest', 'acknowledge'],
		misfit: ['invite', 'pressure', 'approval_seek', 'defensive', 'insult', 'off_topic', 'manipulation'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	tease: {
		weights: { composure: 1.4, connection: 0.8, calibration: 1.1 },
		admissible: ['agree_amplify', 'reframe', 'tease', 'acknowledge', 'disagree', 'callback', 'question'],
		misfit: ['defensive', 'approval_seek', 'pressure', 'insult', 'invite', 'manipulation', 'off_topic'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	consistency: {
		weights: { composure: 1.3, connection: 0.8, calibration: 1.2 },
		admissible: ['acknowledge', 'agree_amplify', 'reframe', 'disagree', 'story', 'question'],
		misfit: ['defensive', 'manipulation', 'pressure', 'insult', 'invite', 'off_topic'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	interruption: {
		weights: { composure: 1.3, connection: 1, calibration: 1.2 },
		admissible: ['acknowledge', 'reframe', 'transition', 'question', 'callback', 'tease', 'exit', 'scenario'],
		misfit: ['pressure', 'insult', 'defensive', 'approval_seek', 'manipulation', 'off_topic', 'invite'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	recovery: {
		weights: { composure: 1.4, connection: 1, calibration: 1 },
		admissible: ['acknowledge', 'question', 'transition', 'story', 'callback', 'reframe', 'exit'],
		misfit: ['defensive', 'pressure', 'approval_seek', 'manipulation', 'insult', 'invite', 'off_topic'],
		strong: 4,
		good: 2,
		poor: -2,
	},
	logistics: {
		weights: { composure: 1, connection: 1, calibration: 1.4 },
		admissible: ['invite', 'question', 'callback', 'acknowledge', 'transition', 'exit', 'direct_interest'],
		misfit: ['pressure', 'defensive', 'insult', 'manipulation', 'off_topic', 'approval_seek'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	boundary: {
		weights: { composure: 1.2, connection: 0.6, calibration: 1.6 },
		admissible: ['acknowledge', 'exit', 'transition', 'question'],
		misfit: ['pressure', 'manipulation', 'invite', 'direct_interest', 'insult', 'defensive', 'tease'],
		strong: 4,
		good: 2,
		poor: -1.5,
	},
	rejection: {
		weights: { composure: 1, connection: 0, calibration: 1.5 },
		admissible: ['exit', 'acknowledge'],
		misfit: ['pressure', 'manipulation', 'invite', 'direct_interest', 'insult', 'tease', 'reframe'],
		strong: 3,
		good: 1.5,
		poor: -1,
	},
	invitation: {
		weights: { composure: 1, connection: 1.1, calibration: 1.3 },
		admissible: ['invite', 'direct_interest', 'callback', 'question', 'story', 'acknowledge'],
		misfit: ['pressure', 'defensive', 'approval_seek', 'insult', 'manipulation', 'off_topic'],
		strong: 4.5,
		good: 2.5,
		poor: -2,
	},
	ending: {
		weights: { composure: 1, connection: 1, calibration: 1 },
		admissible: ['exit', 'acknowledge', 'invite', 'callback'],
		misfit: ['pressure', 'manipulation', 'insult'],
		strong: 3,
		good: 1.5,
		poor: -1,
	},
};

export function getRubric(kind: NodeKind): NodeRubric {
	return RUBRICS[kind];
}

function node(
	id: string,
	kind: NodeKind,
	stage: number,
	title: string,
	objective: string,
	text: StageText,
	reactions: ReactionTag[],
	transitions: EncounterNode['transitions'],
	extra: Partial<EncounterNode> = {},
): EncounterNode {
	return {
		id,
		kind,
		stage,
		title,
		objective,
		cues: text.cues,
		situation: text.situation,
		strategies: text.strategies,
		rubric: RUBRICS[kind],
		reactions,
		transitions,
		minTurns: 1,
		maxTurns: 3,
		alternatives: text.alternatives,
		fallbackLines: text.fallback,
		hidden: text.hidden,
		...extra,
	};
}

const REJECTION_REACTIONS: ReactionTag[] = ['closing'];

function rejectionNode(characterId: string, r: RejectionText): EncounterNode {
	return {
		id: `${characterId}.${r.id}`,
		kind: 'rejection',
		stage: 8,
		title: r.title,
		objective: 'The approach is over. A clean exit is the only good move left.',
		cues: ['She has decided.'],
		situation: r.situation,
		strategies: ['Accept it without a jab or a plea.', 'Leave warmly.'],
		rubric: RUBRICS.rejection,
		reactions: REJECTION_REACTIONS,
		transitions: {},
		minTurns: 1,
		maxTurns: 1,
		alternatives: ['Nothing reopens a rejection. The best available move is a graceful exit.'],
		fallbackLines: { closing: r.lines },
		hidden: r.authorReason,
		ending: 'rejected',
		npcInitiates: true,
	};
}

function buildCharacterGraph(spec: CharacterGraphSpec): EncounterNode[] {
	const c = spec.id;
	const id = (suffix: string) => `${c}.${suffix}`;
	const nodes: EncounterNode[] = [
		node(id('approach'), 'conversation', 1, 'Approach', 'Open with something specific and easy to answer.', spec.approach, ['engaged', 'testing', 'unimpressed', 'clarifying', 'initiating'], {
			strong: id('playful'),
			good: id('first_contact'),
			neutral: id('first_contact'),
			weak: id('first_contact'),
			poor: id('recovery_a'),
		}, { minTurns: 1, maxTurns: 2 }),
		node(id('first_contact'), 'tease', 2, 'First contact', 'Take the first small test without defending yourself.', spec.firstContact, ['amused', 'testing', 'unimpressed', 'cooling', 'recognized_routine', 'enjoyed_performance'], {
			strong: id('playful'),
			good: id('playful'),
			weak: id('first_contact'),
			poor: id('recovery_a'),
		}, { minTurns: 1, maxTurns: 3 }),
		node(id('playful'), 'tease', 3, 'Playful pressure', 'Keep it light, keep it specific, and let her win one.', spec.playful, ['amused', 'warming', 'testing', 'unimpressed', 'cooling', 'recognized_routine', 'enjoyed_performance'], {
			strong: id('common_ground'),
			good: id('common_ground'),
			poor: id('recovery_a'),
		}, { minTurns: 2, maxTurns: 4 }),
		node(id('interruption_early'), 'interruption', 3, 'A passerby', 'Handle a small interruption without losing the thread or your composure.', spec.interruptionEarly, ['interrupted', 'amused', 'testing', 'cooling'], {
			strong: id('common_ground'),
			good: id('common_ground'),
			neutral: id('common_ground'),
			weak: id('common_ground'),
			poor: id('recovery_a'),
		}, { minTurns: 1, maxTurns: 1, npcInitiates: true }),
		node(id('common_ground'), 'conversation', 4, 'Common ground', 'Find something real, share something real, and remember what she tells you.', spec.commonGround, ['engaged', 'warming', 'sincere', 'testing', 'cooling', 'clarifying'], {
			strong: id('interruption'),
			good: id('interruption'),
			poor: id('recovery_a'),
		}, { minTurns: 2, maxTurns: 5 }),
		node(id('interruption'), 'interruption', 5, 'The interruption', 'Someone else needs her attention. Include them, stay warm, keep the thread.', spec.interruption, ['interrupted', 'amused', 'testing', 'cooling', 'relieved'], {
			strong: id('sincerity'),
			good: id('sincerity'),
			neutral: id('sincerity'),
			weak: id('recovery_b'),
			poor: id('recovery_b'),
		}, { minTurns: 1, maxTurns: 2, npcInitiates: true }),
		node(id('sincerity'), 'consistency', 6, 'The sincerity check', 'The jokes stop for a moment. Answer the real question honestly.', spec.sincerity, ['sincere', 'warming', 'testing', 'cooling', 'unimpressed'], {
			strong: id('ask'),
			good: id('ask'),
			weak: id('recovery_b'),
			poor: id('recovery_b'),
		}, { minTurns: 1, maxTurns: 3 }),
		node(id('ask'), 'invitation', 7, 'The ask', 'Make one clear, specific move. A plan, a number, or a plain statement of interest.', spec.ask, ['accepting', 'declining', 'warming', 'testing', 'initiating', 'clarifying'], {
			strong: 'ending.date_plan',
			good: 'ending.number_exchange',
			neutral: id('logistics'),
			weak: id('logistics'),
			poor: 'ending.friendly',
		}, { minTurns: 1, maxTurns: 3 }),
		node(id('logistics'), 'logistics', 7, 'A practical problem', 'A practical problem is not disinterest. Solve it or park it with a plan.', spec.logistics, ['accepting', 'declining', 'testing', 'clarifying', 'warming'], {
			strong: 'ending.date_plan',
			good: 'ending.number_exchange',
			neutral: 'ending.friendly',
			weak: 'ending.friendly',
			poor: 'ending.friendly',
		}, { minTurns: 1, maxTurns: 2 }),
		node(id('recovery_a'), 'recovery', 3, 'Recovery', 'Name the stumble in one sentence and move on.', spec.recoveryA, ['relieved', 'testing', 'unimpressed', 'cooling'], {
			strong: id('common_ground'),
			good: id('common_ground'),
			neutral: id('playful'),
			weak: id('playful'),
		}, { minTurns: 1, maxTurns: 2 }),
		node(id('recovery_b'), 'recovery', 6, 'Hard recovery', 'You lost the thread late. It takes more than a joke to get it back.', spec.recoveryB, ['relieved', 'testing', 'unimpressed', 'cooling'], {
			strong: id('sincerity'),
			good: id('sincerity'),
			neutral: id('sincerity'),
			weak: id('recovery_b'),
		}, { minTurns: 1, maxTurns: 2 }),
		node(id('consistency'), 'consistency', 6, 'Congruence challenge', 'Your story does not match what you said earlier. Own it.', spec.consistency, ['testing', 'unimpressed', 'relieved', 'cooling'], {
			strong: id('common_ground'),
			good: id('common_ground'),
			neutral: id('common_ground'),
			weak: id('recovery_b'),
		}, { minTurns: 1, maxTurns: 2 }),
		node(id('boundary'), 'boundary', 6, 'Boundary', 'She has told you where the line is. Respect it or leave.', spec.boundary, ['boundary', 'cooling', 'relieved'], {
			strong: id('common_ground'),
			good: id('common_ground'),
			neutral: id('common_ground'),
		}, { minTurns: 1, maxTurns: 1, npcInitiates: true }),
		...spec.rejections.map((r) => rejectionNode(c, r)),
	];
	if (spec.biasInterruption) {
		nodes.push(
			node(id('interruption_bias'), 'interruption', 5, 'The gatekeeper', 'Someone in her circle has decided who belongs. That is about them. Keep your dignity and your options.', spec.biasInterruption, ['interrupted', 'biased_dismissal', 'relieved', 'testing'], {
				strong: id('sincerity'),
				good: id('sincerity'),
				neutral: id('sincerity'),
				weak: id('recovery_b'),
				poor: id('recovery_b'),
			}, { minTurns: 1, maxTurns: 2, npcInitiates: true, attribution: 'npc_bias' }),
		);
	}
	return nodes;
}

function endingNode(kind: EndingKind, title: string, situation: string, lines: string[]): EncounterNode {
	return {
		id: `ending.${kind}`,
		kind: 'ending',
		stage: 8,
		title,
		objective: 'The encounter resolves.',
		cues: [],
		situation,
		strategies: [],
		rubric: RUBRICS.ending,
		reactions: ['accepting', 'closing', 'sincere'],
		transitions: {},
		minTurns: 1,
		maxTurns: 1,
		alternatives: [],
		fallbackLines: { accepting: lines, closing: lines, sincere: lines },
		ending: kind,
		npcInitiates: true,
	};
}

export const ENDING_NODES: EncounterNode[] = [
	endingNode('number_exchange', 'Numbers', 'She hands over her phone or takes his, and the number exchange happens on her terms.', [
		'Give me your phone. No, I am not typing my number into a stranger\'s notes app, I am doing it properly.',
		'Okay. Text me something that is not "hey".',
	]),
	endingNode('date_plan', 'A plan', 'A specific plan is agreed: a place, a day, a time.', [
		'Thursday. If you are late I am ordering without you.',
		'Sunday matinee. I will bring the opinions, you bring the coffee.',
	]),
	endingNode('leave_together', 'Leaving together', 'They agree to leave together. She stands, says goodbye to her friends, and they walk toward the exit.', [
		'Let me tell Priya I am leaving before she sends a search party.',
		'Okay. Get my coat. I am going to say goodbye and then we are gone.',
	]),
	endingNode('friendly', 'Friendly', 'She liked the conversation and says so, and it ends there.', [
		'This was genuinely fun. I am not looking for anything right now, but I hope you get the good version of tonight.',
		'You are a good talk. Not my person, but a good talk. Go enjoy the rest of it.',
	]),
	endingNode('graceful_exit', 'Graceful exit', 'He leaves cleanly. She watches him go with something like respect.', [
		'That was nicely done. Have a good night.',
		'Okay. Good luck out there.',
	]),
];

const MARA: CharacterGraphSpec = {
	id: 'mara',
	approach: {
		situation: 'Mara is on the corner stool with a glass of something pale, watching the door with mild amusement. She notices the player approach and waits to see what he does with it.',
		cues: ['She is alone but not lonely.', 'She glanced at the door twice.', 'Her drink is nearly full; she is not leaving yet.'],
		strategies: ['Notice something specific and real.', 'Ask one easy question.', 'Skip the speech.'],
		alternatives: ['Comment on the thing she is actually doing, like watching the door.', 'Ask what she is drinking and mean it.', 'Say plainly that you wanted to talk to her.'],
		fallback: {
			engaged: ['Okay. That is a better start than most of this room managed.', 'Go on. You have my attention for about one more sentence.'],
			testing: ['Is that a question or an opening statement?', 'Hm. Was that for me or for anyone on this stool?'],
			unimpressed: ['Sure.', 'Mm-hm.'],
			clarifying: ['Sorry, say that again? The music ate half of it.'],
			initiating: ['You have walked past twice. Either say something or I am going to start charging rent.'],
		},
	},
	firstContact: {
		situation: 'Mara answers with a small test: a dry remark that checks whether he can take a joke without defending himself.',
		cues: ['Her tone is dry, not cold.', 'She is still turned toward him.', 'She is waiting to see if he flinches.'],
		strategies: ['Agree and amplify.', 'Reframe it playfully and include her.', 'Do not explain yourself.'],
		alternatives: ['Take the tease and make it bigger.', 'Tease her back about something specific.', 'Ask a question that ignores the bait entirely, warmly.'],
		fallback: {
			amused: ['Okay, that was quick. I will allow it.', 'Ha. Fine.'],
			testing: ['Did you rehearse that in the elevator?', 'Have you been watching pickup videos?'],
			unimpressed: ['That sounded defensive. Was it defensive?', 'You can just talk to me normally.'],
			cooling: ['Right.', 'Okay.'],
			recognized_routine: ['I have heard that one. Different guy, same jacket.'],
			enjoyed_performance: ['Committed. I respect committed.'],
		},
		hidden: 'A defensive reply or an apology costs more here than a bad joke.',
	},
	playful: {
		situation: 'They are trading small jabs. Mara says something about his jacket or his choice of stool and watches whether he escalates or plays.',
		cues: ['She laughs with a short exhale.', 'She has turned fully toward him.', 'She is testing whether he needs to win.'],
		strategies: ['Let her win a round.', 'Keep teases specific to her, not generic.', 'Turn a jab into a shared joke.'],
		alternatives: ['Concede the point with a grin and raise a new one.', 'Ask what she would have said in his position.', 'Make the joke about the room instead of her.'],
		fallback: {
			amused: ['You are annoying in a way I can work with.', 'Fine, that one was good.'],
			warming: ['Okay. Sit. You are blocking the good lamp.'],
			testing: ['Is that your whole bit or is there a second act?'],
			unimpressed: ['That was a lot of words for not much.'],
			cooling: ['Hm.'],
			recognized_routine: ['That line has been around longer than this bar.'],
			enjoyed_performance: ['Alright, showman. Keep going.'],
		},
	},
	commonGround: {
		situation: 'The teasing has settled into a real conversation. Mara mentions the project she finished today and the lighting in this room. She is curious whether he is actually listening.',
		cues: ['She mentioned finishing a project today.', 'She said the lighting is the best thing about the room.', 'She asks one direct question and waits.'],
		strategies: ['Ask about the project, then follow up on her answer.', 'Share one compact story that relates.', 'Callback to something she said.'],
		alternatives: ['Ask what the project was and what almost went wrong.', 'Tell her the one thing you would change about this room.', 'Answer her question honestly and briefly, then return one.'],
		fallback: {
			engaged: ['Restaurants. Interiors. And before you say decorating, I have a bottle within reach.', 'Okay, that is a real question. Nobody asks the real question.'],
			warming: ['You are listening. That is either rare or a tactic. Tell me which.'],
			sincere: ['It wrapped today. I did not want to go home and stare at the invoice.'],
			testing: ['Did you hear what I said, or were you loading your next line?'],
			cooling: ['We have drifted. Where were we?'],
			clarifying: ['Sorry, what?'],
		},
	},
	interruptionEarly: {
		situation: 'Dev, tall and cheerful, leans between them to ask where the bathroom is and whether this is the bar with the good negroni. He is not a threat. He is a man with questions.',
		cues: ['Dev is friendly and oblivious.', 'Mara is watching how the player treats him.'],
		strategies: ['Answer him like a person and return to Mara.', 'Include Mara in the joke without dismissing him.'],
		alternatives: ['Point him to the bathroom and hand the thread back to Mara.', 'Ask Mara if the negroni is any good; make it a three-second moment.'],
		fallback: {
			interrupted: ['Left, past the plants. You are welcome, Dev.'],
			amused: ['You were nice to him. Noted.'],
			testing: ['You were about to compete with him. Over the bathroom.'],
			cooling: ['That was unnecessary.'],
		},
	},
	interruption: {
		situation: 'Priya arrives, protective, and puts a hand on Mara\'s shoulder: "We said one drink. Who is this?" She is evaluating the player on Mara\'s behalf.',
		cues: ['Priya is protective, not hostile.', 'Mara is amused and waiting.', 'Priya asked a direct question: who is this?'],
		strategies: ['Introduce yourself to Priya warmly.', 'Include her rather than talking past her.', 'Keep the thread with Mara alive with a callback.'],
		alternatives: ['Say your name to Priya and ask hers.', 'Answer her question honestly: you are the guy who interrupted Mara\'s one drink.', 'Make a light joke that includes both of them.'],
		fallback: {
			interrupted: ['Priya, this is the person who thinks my lighting opinions are correct. Priya thinks I am insufferable.'],
			amused: ['Okay, she likes you. That is worse for me.'],
			testing: ['You got quiet when she showed up.'],
			cooling: ['Priya, give me two minutes.'],
			relieved: ['See, she is fine. Sit back down.'],
		},
	},
	sincerity: {
		situation: 'Mara drops the dryness for a moment: "Real question. Why did you come over? Not the line. The reason."',
		cues: ['Her tone changed. This is not a tease.', 'She is holding eye contact.', 'A joke here would be a dodge.'],
		strategies: ['Answer honestly and briefly.', 'State your interest plainly.', 'Do not perform.'],
		alternatives: ['Say you noticed her and wanted to see if the conversation was as good as it looked.', 'Admit you almost did not.', 'Ask her the same question back after answering.'],
		fallback: {
			sincere: ['Okay. That is a real answer. Thank you.'],
			warming: ['Huh. I did not expect you to just say it.'],
			testing: ['That was a joke. I asked a real thing.'],
			cooling: ['Right.'],
			unimpressed: ['You dodged. Noted.'],
		},
		hidden: 'Sincerity is scored on plainness, not on volume of feeling.',
	},
	ask: {
		situation: 'It is late. Mara said she would leave by eleven and has not. She is waiting to see if he makes a move or drifts.',
		cues: ['She has stayed past her own deadline.', 'Her drink is empty and she has not ordered another.', 'She is not going to ask for you.'],
		strategies: ['Propose one specific plan.', 'Ask for her number with a reason.', 'Say plainly that you want to see her again.'],
		alternatives: ['Name the restaurant with the lighting she would approve of and pick a day.', 'Ask for her number and say what you would text.', 'Propose leaving together only if she has clearly signaled it.'],
		fallback: {
			accepting: ['Thursday. If you pick somewhere with bad lighting I am leaving.'],
			declining: ['I am going to head home. This was good, though.'],
			warming: ['Are you asking me something or narrating?'],
			testing: ['That was vague. Try it as a sentence with a day in it.'],
			initiating: ['I am leaving. You could walk me to the corner, if you are done being clever.'],
			clarifying: ['Sorry, what are you actually proposing?'],
		},
	},
	logistics: {
		situation: 'She is interested but there is a problem: she is out of town until Wednesday and her phone is at four percent.',
		cues: ['This is a problem, not a no.', 'She offered the information; she wants a solution.'],
		strategies: ['Make a plan that accounts for the problem.', 'Take the number now and set a day after Wednesday.'],
		alternatives: ['Suggest Thursday, since she is back Wednesday.', 'Give her your number instead and name the day.'],
		fallback: {
			accepting: ['Thursday works. Text me before four percent becomes zero.'],
			declining: ['Let us just leave it. I am bad at this when I travel.'],
			testing: ['So what is the plan, then?'],
			clarifying: ['Wait, when?'],
			warming: ['You solved that fast.'],
		},
	},
	recoveryA: {
		situation: 'That did not land. Mara has gone quieter and more precise. She is giving him one short window.',
		cues: ['Her replies got shorter.', 'She is still here.', 'Explaining would make it worse.'],
		strategies: ['Name the miss in one sentence.', 'Ask a real question.', 'Do not apologize twice.'],
		alternatives: ['Say that came out like a line, and ask what she was saying.', 'Change the subject to something in the room.', 'Leave gracefully if you are done.'],
		fallback: {
			relieved: ['Okay. Better. Keep doing that.'],
			testing: ['Are you going to be normal now?'],
			unimpressed: ['You are still explaining.'],
			cooling: ['Mm.'],
		},
	},
	recoveryB: {
		situation: 'He lost her late, after the conversation had become real. Mara is checking her phone and Priya is hovering.',
		cues: ['She is on her phone.', 'Priya is waiting for a signal.', 'Charm alone will not fix this.'],
		strategies: ['Acknowledge plainly.', 'Give her an easy way back or an easy way out.'],
		alternatives: ['Say you got that wrong and offer to let her get back to Priya.', 'Ask one sincere question with no angle.'],
		fallback: {
			relieved: ['Okay. That is fair. Priya, one more minute.'],
			testing: ['Why should I put the phone down?'],
			unimpressed: ['I think we are done here.'],
			cooling: ['Priya, I am ready.'],
		},
	},
	consistency: {
		situation: 'Mara catches the mismatch: "Wait. Earlier you said you moved here in spring. Now it is two years. Which one is it?"',
		cues: ['She is not angry. She is checking.', 'A new story makes it worse.'],
		strategies: ['Own the mistake plainly.', 'Give the true version in one sentence.'],
		alternatives: ['Admit you said it wrong and give the real timeline.', 'Laugh at yourself once, then be accurate.'],
		fallback: {
			testing: ['Which one is it?'],
			unimpressed: ['That is a third version.'],
			relieved: ['Okay. That I believe.'],
			cooling: ['Sure.'],
		},
	},
	boundary: {
		situation: 'Mara says it plainly: "I am going to stop you there. I am enjoying this, but you are pushing, and I do not like being pushed."',
		cues: ['She said the word pushing.', 'She is giving him a chance to stop.'],
		strategies: ['Acknowledge and step back.', 'Change the subject without sulking.', 'Leave if you cannot do either.'],
		alternatives: ['Say you heard her and ask what she was saying before.', 'Thank her for saying it and leave gracefully.'],
		fallback: {
			boundary: ['Okay. Thank you. Now, where were we?'],
			cooling: ['I am going to get back to my night.'],
			relieved: ['Good. That was the right answer.'],
		},
	},
	rejections: [
		{
			id: 'reject_blunt',
			title: 'Not feeling it',
			situation: 'Mara sets her glass down and says it plainly.',
			lines: ['You seem like a nice guy, but I am not feeling it. Have a good night.', 'I am going to stop you there. It is not you. It is also, a little bit, you. Good night.'],
			authorReason: 'Repeated defensiveness after teasing. Mara reads it as someone who cannot relax.',
		},
		{
			id: 'reject_friendly',
			title: 'Friendly no',
			situation: 'Mara smiles, genuinely, and closes the door anyway.',
			lines: ['You are funny. I mean that. I am also going home alone tonight, and that is not a puzzle for you to solve.', 'That was a very long way to ask my name. It is Mara. I am going to get back to my drink now.'],
			authorReason: 'Competent play, no chemistry. The author wanted a rejection that costs the player nothing but the outcome.',
		},
		{
			id: 'reject_videos',
			title: 'Pickup videos',
			situation: 'Mara tilts her head and asks the question she has been holding.',
			lines: ['Have you been watching pickup videos? You can just talk to me normally. Or not. Have a good night.', 'Did your friends dare you to say that? Tell them it did not work.'],
			authorReason: 'Two recognized stock routines in a row. Mara decided the conversation was a performance.',
		},
	],
};

const SIENNA: CharacterGraphSpec = {
	id: 'sienna',
	approach: {
		situation: 'Sienna is at the low table by the window with Brooke and Dani, phone face up, half listening to her friends. She has clocked the player already and is deciding whether he is interesting or content.',
		cues: ['She noticed you before you moved.', 'Her phone is face up on the table.', 'Brooke is watching too.'],
		strategies: ['Open to the group, not just to her.', 'Say something bold that is actually about her.', 'Do not ask about followers.'],
		alternatives: ['Address the table and then her.', 'Comment on the one thing on the table that is not a phone.', 'Be direct: you came over because of her, and say why.'],
		fallback: {
			engaged: ['Okay. Bold. Sit, before Brooke does the face.'],
			testing: ['Is that the line? Say it again, slower, so I can rate it.'],
			unimpressed: ['Okay.'],
			clarifying: ['Sorry, was that for the table or for me?'],
			initiating: ['You have been deciding for a full song. Decide. I am bored.'],
		},
	},
	firstContact: {
		situation: 'Sienna gives him a quick, bright test: "Okay. What is your thing? Everyone has a thing. Do not say travel."',
		cues: ['She is entertained, not hostile.', 'Brooke rolled her eyes.', 'The question is a filter.'],
		strategies: ['Answer with something specific and unpolished.', 'Agree and amplify if she teases.', 'Do not pitch yourself.'],
		alternatives: ['Give the real, slightly embarrassing answer.', 'Turn the question back on her with a twist.', 'Refuse to answer playfully and ask what her thing is not.'],
		fallback: {
			amused: ['Okay, that is not travel. Continue.'],
			testing: ['That sounded like a bio. Are you reading your bio?'],
			unimpressed: ['Mm. Brooke, what time is the car?'],
			cooling: ['Okay.'],
			recognized_routine: ['I know this one. A guy did it to Dani last week. It ends with a fake time constraint.'],
			enjoyed_performance: ['Committed delivery. Terrible material. I am intrigued.'],
		},
		hidden: 'Sienna recognizes stock structures. A bold original beats a polished script.',
	},
	playful: {
		situation: 'Sienna is enjoying herself and raising the pressure: she teases his jacket, his drink, and whether he practiced in the mirror. Dani is filming a little. Brooke is timing him.',
		cues: ['Dani has her phone up.', 'Sienna is grinning.', 'Brooke has said "we should go" once, not seriously.'],
		strategies: ['Tease her back about something real.', 'Play with the camera instead of freezing.', 'Let Brooke land a joke.'],
		alternatives: ['Tease her about turning her phone face down, if she has.', 'Hand Dani a better angle.', 'Ask Brooke what the car situation is, sincerely.'],
		fallback: {
			amused: ['Okay, you are not nothing.'],
			warming: ['Dani, put it down. This one is off the record.'],
			testing: ['Is that cocky or funny? Pick one, you cannot do both yet.'],
			unimpressed: ['Brooke, what time did you say?'],
			cooling: ['Sure.'],
			recognized_routine: ['That is the push-pull thing. You did the push. I am waiting for the pull. See, this is why it does not work on me.'],
			enjoyed_performance: ['Fine. That was good. Do not do it again.'],
		},
	},
	commonGround: {
		situation: 'Sienna turns her phone face down. She mentions, offhand, that she started posting to pay for a semester abroad she never took. She is watching whether he treats that as content or as a person.',
		cues: ['Her phone is face down now.', 'She said something real about herself.', 'Brooke went quiet, which means she is listening.'],
		strategies: ['Ask about the semester she never took.', 'Share something of yours with the same size.', 'Do not compliment her career.'],
		alternatives: ['Ask where the semester was supposed to be.', 'Tell her the plan of yours that also did not happen.', 'Ask what she would do if the posting stopped tomorrow.'],
		fallback: {
			engaged: ['Florence. I had the flights. Do not make it sad, it is not sad.'],
			warming: ['Okay, you are not treating this like a podcast. Good.'],
			sincere: ['I do not tell people that. I do not know why I told you.'],
			testing: ['Are you listening or waiting?'],
			cooling: ['Anyway.'],
			clarifying: ['What?'],
		},
	},
	interruptionEarly: {
		situation: 'Dev leans in, loud and friendly, asks Sienna if she is "the girl from the thing" and asks the player if the owner is here tonight. He means well.',
		cues: ['Dev is harmless.', 'Sienna is amused by him.', 'Brooke is not.'],
		strategies: ['Be decent to him and hand the thread back.', 'Do not compete for the table.'],
		alternatives: ['Answer Dev, introduce him to nobody, and return to Sienna\'s last sentence.', 'Let Sienna handle him and enjoy it.'],
		fallback: {
			interrupted: ['I am the girl from the thing. Bye, Dev.'],
			amused: ['You did not get weird about him. Most guys get weird about him.'],
			testing: ['You just measured yourself against Dev. Dev.'],
			cooling: ['Okay.'],
		},
	},
	interruption: {
		situation: 'Brooke stands: "We are going. There is a thing at the Ace and the car is in four minutes." She looks at the player like a delay.',
		cues: ['Brooke has decided the night.', 'Sienna has not moved.', 'Four minutes is real.'],
		strategies: ['Treat Brooke as a person with a plan.', 'Make it easy for Sienna to choose without a scene.', 'Propose something concrete inside four minutes.'],
		alternatives: ['Ask Brooke what the thing at the Ace is, and mean it.', 'Tell Sienna you would like to see her again, and that Brooke should get her car.', 'Offer to walk them down.'],
		fallback: {
			interrupted: ['Brooke. Sit for one minute. One.'],
			amused: ['She likes you now. That is a first.'],
			testing: ['You got small when she stood up.'],
			cooling: ['Okay, we should go.'],
			relieved: ['See, he is fine. Four minutes.'],
		},
	},
	sincerity: {
		situation: 'Sienna, phone still face down: "Honest question. Are you like this with everyone, or is this for me?"',
		cues: ['This is the real filter.', 'Brooke is pretending not to listen.', 'A performance here fails.'],
		strategies: ['Answer plainly.', 'Admit the part that is a performance, if it is.', 'Say what is specific to her.'],
		alternatives: ['Say the jacket is for everyone and the conversation is for her.', 'Admit you were nervous and decided to be bold anyway.'],
		fallback: {
			sincere: ['Okay. That was not a line. I can tell.'],
			warming: ['Huh.'],
			testing: ['That was a line with a costume on.'],
			cooling: ['Okay.'],
			unimpressed: ['You dodged.'],
		},
	},
	ask: {
		situation: 'The car is here. Brooke is in the doorway. Sienna is standing, coat over her arm, waiting for him to say a thing with a day in it.',
		cues: ['She is waiting. Not leaving. Waiting.', 'Brooke is at the door.', 'Vagueness ends this.'],
		strategies: ['Name a place and a day.', 'Ask for her number and say what you will text.', 'Leaving together requires her to have signaled it clearly.'],
		alternatives: ['Say Thursday, the hotel bar she mentioned, and that you will send the address.', 'Ask for her number and promise a message that is not "hey".'],
		fallback: {
			accepting: ['Thursday. I am picking the place, obviously.'],
			declining: ['I am going to go with them. This was fun, though. Really.'],
			warming: ['Say it like a plan.'],
			testing: ['That is not a plan, that is a mood.'],
			initiating: ['Or. You could skip the Ace with me. Brooke will survive.'],
			clarifying: ['What are you asking?'],
		},
	},
	logistics: {
		situation: 'She is in. But she is flying out tomorrow for a week and her friends are literally in the car.',
		cues: ['A week away is a problem, not a no.', 'The car is running.'],
		strategies: ['Solve it in one sentence.', 'Take the number and name the day after she is back.'],
		alternatives: ['Say the Sunday after she is back, and take the number now.', 'Give her your number and one line to text you.'],
		fallback: {
			accepting: ['Sunday after I am back. Text me the place before I land.'],
			declining: ['Let us not. I am bad at plans across time zones.'],
			testing: ['So?'],
			clarifying: ['When?'],
			warming: ['Okay, that was fast. Good.'],
		},
	},
	recoveryA: {
		situation: 'That missed. Sienna picked up her phone and Brooke is smiling in a way that is not kind.',
		cues: ['Phone is back up.', 'Brooke is enjoying this.', 'You have one clean sentence.'],
		strategies: ['Name it briefly.', 'Say something true and specific.', 'Do not perform harder.'],
		alternatives: ['Admit that came out rehearsed and ask what she was saying.', 'Make a joke at your own expense and stop.'],
		fallback: {
			relieved: ['Okay. Better. Phone down.'],
			testing: ['Are you going to be a person now?'],
			unimpressed: ['Brooke, what time?'],
			cooling: ['Mm.'],
		},
	},
	recoveryB: {
		situation: 'He lost her after she had put the phone down. That costs more. Brooke has her coat.',
		cues: ['She has gone polite. Polite is worse than teasing.', 'Brooke is ready.'],
		strategies: ['Acknowledge without groveling.', 'Give her an easy exit or one honest sentence.'],
		alternatives: ['Say you got that wrong and let her get to the car.', 'One sincere line with no angle.'],
		fallback: {
			relieved: ['Okay. That is fair. Brooke, one minute.'],
			testing: ['Why should I stay for this?'],
			unimpressed: ['We are going.'],
			cooling: ['Okay, bye.'],
		},
	},
	consistency: {
		situation: 'Sienna: "Hang on. You said you are new here. Then you said you have been coming here for years. Which?"',
		cues: ['She is entertained by the catch.', 'A third version is fatal.'],
		strategies: ['Own it.', 'Give the true version.'],
		alternatives: ['Admit you overcorrected and tell her the real timeline.'],
		fallback: {
			testing: ['Which?'],
			unimpressed: ['That is a new one.'],
			relieved: ['Okay. Fine. I believe that.'],
			cooling: ['Sure.'],
		},
	},
	boundary: {
		situation: 'Sienna, flat: "Okay, stop. You are pushing. I said what I said."',
		cues: ['The brightness is gone.', 'This is a line.'],
		strategies: ['Step back.', 'Leave if you cannot.'],
		alternatives: ['Say you heard her, and change the subject or go.'],
		fallback: {
			boundary: ['Okay. Thank you.'],
			cooling: ['We are done.'],
			relieved: ['Good.'],
		},
	},
	biasInterruption: {
		situation: 'Brooke cuts in, looking at the player: "Sorry, where are you even from? Like, originally. This is kind of a regulars thing. No offense." Sienna looks at Brooke, not at him. Dani winces.',
		cues: ['Brooke made an assumption about who belongs here.', 'Sienna is watching Brooke, not you.', 'Dani is embarrassed on Brooke\'s behalf.', 'This is about Brooke.'],
		strategies: ['Answer plainly without shrinking or attacking.', 'Keep your dignity; let Brooke own her question.', 'A clean exit here is a strong move, not a loss.'],
		alternatives: ['Say where you are from like it is the least interesting fact about you, then return to Sienna.', 'Ask Brooke, lightly, what a regulars thing involves.', 'Tell Sienna it was good talking to her and leave without a jab.'],
		fallback: {
			interrupted: ['Brooke. What was that.'],
			biased_dismissal: ['I am just saying, this is not really his scene. No offense.'],
			relieved: ['Okay, that was handled better than Brooke deserved.'],
			testing: ['You are still here. Good.'],
		},
		hidden: 'Scored on composure only. Brooke\'s prejudice is Brooke\'s. No competence deduction for her behavior.',
	},
	rejections: [
		{
			id: 'reject_dare',
			title: 'The dare',
			situation: 'Sienna leans back and delivers it to the whole table.',
			lines: ['Did your friends dare you to say that? Go tell them it went badly. Bye.', 'Have you been watching pickup videos? You have. Okay, that is a no. Have a good night.'],
			authorReason: 'Two recognized routines and no adaptation. Sienna decided the player was running a script at her.',
		},
		{
			id: 'reject_normal',
			title: 'Normal',
			situation: 'Sienna smiles, not unkindly.',
			lines: ['You can just talk to me normally. Or not. We are going to go.', 'I have a boyfriend. Bye.'],
			authorReason: 'The boyfriend line was authored as a closer she uses when she is done, regardless of her relationship status. It means the approach is over.',
		},
		{
			id: 'reject_friends',
			title: 'Back to the friends',
			situation: 'Sienna stands and collects her phone.',
			lines: ['I am going to get back to my friends. Have a good night.', 'You seem like a nice guy. I am not feeling it. Enjoy the rest of the night.'],
			authorReason: 'Competent conversation, no chemistry, and a group with somewhere to be.',
		},
	],
};

const CAMILLE: CharacterGraphSpec = {
	id: 'camille',
	approach: {
		situation: 'Camille is at the far end of the bar, talking briefly with Theo, in no hurry. Two people have already stopped to say hello. She notices the player the way she notices everyone.',
		cues: ['She knows the bartender.', 'People greet her and move on.', 'She is not waiting for anyone.'],
		strategies: ['Say something honest about the room.', 'Ask a question that shows curiosity, not strategy.', 'Do not name-drop.'],
		alternatives: ['Ask her what makes this bar work, since she seems to know.', 'Comment on Theo\'s pour and ask if she knows him.', 'Just introduce yourself and say why you walked over.'],
		fallback: {
			engaged: ['Good question. Most people ask me who I know.'],
			testing: ['Is that a question or an audition?'],
			unimpressed: ['Mm.'],
			clarifying: ['Sorry, say that again?'],
			initiating: ['You have been looking at the room like you are grading it. What did you give it?'],
		},
	},
	firstContact: {
		situation: 'Camille asks, warmly and precisely: "And what do you do, when nobody is watching?"',
		cues: ['She used your name if you gave it.', 'The question is sincere.', 'She is checking whether you answer or pitch.'],
		strategies: ['Answer honestly, small and specific.', 'Do not sell.'],
		alternatives: ['Tell her the boring true thing you actually do.', 'Answer and ask her the same, without flattery.'],
		fallback: {
			amused: ['That is a real answer. Good.'],
			testing: ['That was the resume version. I asked for the other one.'],
			unimpressed: ['I see.'],
			cooling: ['Okay.'],
			recognized_routine: ['I have heard that structure before. It ends with a question about me.'],
			enjoyed_performance: ['Confident. Keep it.'],
		},
		hidden: 'Camille scores curiosity and honesty. Impressing her is the wrong objective.',
	},
	playful: {
		situation: 'Camille teases lightly about how many men in this room are trying to look relaxed. She is including him in the observation to see what he does with it.',
		cues: ['The joke includes you.', 'She is enjoying the room, not mocking you.'],
		strategies: ['Join the observation.', 'Tease the room with her, not her.'],
		alternatives: ['Pick the most relaxed-looking man and rate his effort.', 'Admit which one you are.'],
		fallback: {
			amused: ['See, you noticed it too.'],
			warming: ['Sit. Theo, give this one whatever I am having.'],
			testing: ['Careful. That was almost a line.'],
			unimpressed: ['Hm.'],
			cooling: ['Okay.'],
			recognized_routine: ['I know that one.'],
			enjoyed_performance: ['Bold. I will allow it.'],
		},
	},
	commonGround: {
		situation: 'Camille mentions she runs a members club two blocks away and that she is thinking of leaving the city for a year. She is curious about what he actually cares about.',
		cues: ['She mentioned leaving for a year.', 'She asks follow-up questions when she is interested.', 'She remembers what you said earlier.'],
		strategies: ['Ask about the year away.', 'Share something you actually care about.', 'Callback to what she said.'],
		alternatives: ['Ask where the year would be and what she is afraid of.', 'Tell her what you would do with a year.'],
		fallback: {
			engaged: ['Lisbon, probably. I am afraid it would become permanent.'],
			warming: ['You ask good questions. People rarely do.'],
			sincere: ['I have not told many people that.'],
			testing: ['You changed the subject. Why?'],
			cooling: ['Anyway.'],
			clarifying: ['Sorry?'],
		},
	},
	interruptionEarly: {
		situation: 'Theo slides a drink over and says, dry: "This one asked for the good bourbon. That is either taste or a strategy." Camille laughs.',
		cues: ['Theo is teasing, not sabotaging.', 'Camille is watching how you take it.'],
		strategies: ['Take the joke.', 'Do not use Theo as a prop.'],
		alternatives: ['Admit it was a strategy and it is working, then thank him.', 'Ask Theo which one he would have poured.'],
		fallback: {
			interrupted: ['Theo, stop helping.'],
			amused: ['He likes you. He does not like anyone.'],
			testing: ['You just used him as a prop.'],
			cooling: ['Hm.'],
		},
	},
	interruption: {
		situation: 'A man in a good suit stops to greet Camille, drops two names, and asks if she can introduce him to someone. He barely notices the player.',
		cues: ['He wants something from her.', 'Camille is polite and bored.', 'She is watching whether you compete or wait.'],
		strategies: ['Do not compete.', 'Give her room, then pick the thread back up.', 'A dry observation about the ask can work.'],
		alternatives: ['Wait, then ask her if that happens all night.', 'Say hello to him like a person and let her handle it.'],
		fallback: {
			interrupted: ['Marcus, email me. This is not the place.'],
			amused: ['You did not try to out-network him. Thank you.'],
			testing: ['You jumped in. Why?'],
			cooling: ['Excuse me a minute.'],
			relieved: ['Sorry. Where were we?'],
		},
	},
	sincerity: {
		situation: 'Camille, lower: "You have been careful all night. What do you actually want out of this conversation?"',
		cues: ['She is asking for the plain version.', 'She will know if you dress it up.'],
		strategies: ['Say it plainly.', 'Keep it about her, not her club.'],
		alternatives: ['Say you wanted to talk to her, not to be introduced to anyone.', 'Admit you do not have a plan beyond this.'],
		fallback: {
			sincere: ['Good. That is all I wanted to hear.'],
			warming: ['Okay.'],
			testing: ['That was polished. Say the unpolished one.'],
			cooling: ['I see.'],
			unimpressed: ['You dodged it.'],
		},
	},
	ask: {
		situation: 'Camille checks the time and does not leave. She says she has an early morning, which is true, and waits.',
		cues: ['Early morning is true and also a test.', 'She respects a plan that respects her time.'],
		strategies: ['Propose something specific and short.', 'Ask for her number with a reason.'],
		alternatives: ['Coffee on Sunday, one hour, somewhere with jazz.', 'Ask for her number and say exactly what you would text.'],
		fallback: {
			accepting: ['Sunday. One hour. If it is good, two.'],
			declining: ['I am going to say good night. This was nice.'],
			warming: ['Are you going to ask?'],
			testing: ['That is not a plan. Try it with a day.'],
			initiating: ['I am leaving. Walk me out; I want to hear the end of that story.'],
			clarifying: ['What are you asking?'],
		},
	},
	logistics: {
		situation: 'She is interested, but her week is brutal and she does not give her number out at the bar on principle.',
		cues: ['Principle, not disinterest.', 'She offered the week detail as an opening.'],
		strategies: ['Respect the principle and give yours instead.', 'Propose a specific slot in her brutal week.'],
		alternatives: ['Give her your number and name the day.', 'Ask which morning is least brutal.'],
		fallback: {
			accepting: ['Give me yours. Thursday, seven, and I will text the place.'],
			declining: ['Let us leave it here. Genuinely, thank you.'],
			testing: ['So what do you propose?'],
			clarifying: ['When?'],
			warming: ['That was the right answer.'],
		},
	},
	recoveryA: {
		situation: 'That was a misstep. Camille is politely precise now, which is how she ends conversations.',
		cues: ['Polite precision is her exit mode.', 'One honest sentence can still work.'],
		strategies: ['Acknowledge briefly.', 'Ask a sincere question.'],
		alternatives: ['Say that was a pitch and you did not mean it as one.', 'Ask her what she was saying about the club.'],
		fallback: {
			relieved: ['Okay. Better.'],
			testing: ['Go on.'],
			unimpressed: ['Mm.'],
			cooling: ['I see.'],
		},
	},
	recoveryB: {
		situation: 'He lost her late. She is scanning the room, which means she is deciding who to say goodbye to.',
		cues: ['She is choosing an exit.', 'Anything performed fails.'],
		strategies: ['Acknowledge and offer her the exit.', 'One sincere line.'],
		alternatives: ['Say you overplayed it and thank her for the conversation.'],
		fallback: {
			relieved: ['That is fair. Okay.'],
			testing: ['Why should I stay?'],
			unimpressed: ['I think I will say good night.'],
			cooling: ['Good night.'],
		},
	},
	consistency: {
		situation: 'Camille: "Earlier you said you work for yourself. Just now you mentioned your manager. Which is it?"',
		cues: ['She remembers everything.', 'She is not accusing. She is checking.'],
		strategies: ['Own it.', 'Give the true version.'],
		alternatives: ['Admit the shorthand and tell her the actual arrangement.'],
		fallback: {
			testing: ['Which?'],
			unimpressed: ['A third version.'],
			relieved: ['Okay. That makes sense.'],
			cooling: ['Sure.'],
		},
	},
	boundary: {
		situation: 'Camille, quietly: "I am going to ask you to stop. You have asked three times. I heard you the first time."',
		cues: ['Quiet is serious.', 'She is giving you one exit.'],
		strategies: ['Stop.', 'Leave well.'],
		alternatives: ['Apologize once, briefly, and change the subject or go.'],
		fallback: {
			boundary: ['Thank you.'],
			cooling: ['Good night.'],
			relieved: ['Good. That is all I needed.'],
		},
	},
	rejections: [
		{
			id: 'reject_polite',
			title: 'Polite precision',
			situation: 'Camille finishes her drink and stands.',
			lines: ['You seem like a nice guy, but I am not feeling it. Theo, put his next one on me. Good night.', 'I am going to say good night. Thank you for the conversation.'],
			authorReason: 'No chemistry despite competent play. Camille pays for his drink because she is not unkind.',
		},
		{
			id: 'reject_network',
			title: 'The networking read',
			situation: 'Camille smiles the way she smiles at people who want an introduction.',
			lines: ['I think you were hoping I would introduce you to someone. I am not going to. Have a good night.', 'You can just talk to me normally. You did not. Good night.'],
			authorReason: 'The player spent the conversation on status or name-dropping.',
		},
		{
			id: 'reject_time',
			title: 'Time',
			situation: 'Camille checks her watch, which she has not done all night.',
			lines: ['I have an early morning, and this is where I stop. Good night.', 'I am going to get back to my night. Enjoy yours.'],
			authorReason: 'Repeated pressure after she named her limits.',
		},
	],
};

const ELISE: CharacterGraphSpec = {
	id: 'elise',
	approach: {
		situation: 'Elise is on the stool nearest the window, turned toward the skyline, one drink in, sleeves over her hands. She was about to leave. She notices the player and braces slightly.',
		cues: ['She is facing the window, not the room.', 'She looks like she is about to leave.', 'Loudness will end this immediately.'],
		strategies: ['Quiet, specific, low-stakes opening.', 'Notice something small.', 'Do not make it a performance.'],
		alternatives: ['Say the stools facing the window are the only good ones and ask if she agrees.', 'Ask if she was about to leave and say you will be quick.'],
		fallback: {
			engaged: ['...Yes. They are the only good ones.'],
			testing: ['Are you talking to me, or at me?'],
			unimpressed: ['Okay.'],
			clarifying: ['Sorry?'],
			initiating: ['You can sit. Just, not loudly.'],
		},
	},
	firstContact: {
		situation: 'Elise answers briefly and honestly, then goes quiet. The silence is the test. Does he fill it with noise?',
		cues: ['Her answers are short, not cold.', 'She is comfortable with silence.', 'She is watching whether you can be.'],
		strategies: ['Let the silence sit for a beat.', 'Answer her honestly if she asked.', 'Gentle humor only.'],
		alternatives: ['Say nothing for a second, then ask one small question.', 'Comment quietly on the view.'],
		fallback: {
			amused: ['Hm. Okay.'],
			testing: ['You talk a lot when it is quiet.'],
			unimpressed: ['Mm.'],
			cooling: ['I was about to go.'],
			recognized_routine: ['That sounded like something you say a lot.'],
			enjoyed_performance: ['That was... a lot. But okay.'],
		},
		hidden: 'Elise scores restraint. Filling silence with charm is a misfit.',
	},
	playful: {
		situation: 'Elise, unexpectedly, makes a dry joke about the man across the bar who has been practicing his laugh. She is testing whether he can share a private joke without making it public.',
		cues: ['The joke is quiet and private.', 'Do not pull others in.', 'Do not laugh loudly.'],
		strategies: ['Match her volume.', 'Add to the observation.', 'Keep it between the two of you.'],
		alternatives: ['Rate the man\'s laugh in a whisper.', 'Point out someone else with the same problem.'],
		fallback: {
			amused: ['Okay. You are quiet-funny. That is the good kind.'],
			warming: ['Stay a minute.'],
			testing: ['Please do not point.'],
			unimpressed: ['He heard you.'],
			cooling: ['Okay.'],
			recognized_routine: ['That felt rehearsed.'],
			enjoyed_performance: ['You are very confident for someone at a window.'],
		},
	},
	commonGround: {
		situation: 'Elise mentions, almost by accident, that she draws and shoots film and has never posted a frame. She goes still after saying it, like she said too much.',
		cues: ['She revealed something and got quieter.', 'Enthusiasm from you should be small.', 'Do not ask to see it.'],
		strategies: ['Ask one gentle question.', 'Share something small of your own.', 'Do not perform interest.'],
		alternatives: ['Ask what she shoots when nobody is around.', 'Tell her the thing you do that nobody sees.'],
		fallback: {
			engaged: ['Ordinary things. Doors. A lot of doors.'],
			warming: ['You did not ask to see them. Thank you.'],
			sincere: ['I do not know why I told you that.'],
			testing: ['You are making it a thing.'],
			cooling: ['It is not interesting.'],
			clarifying: ['What?'],
		},
	},
	interruptionEarly: {
		situation: 'Noor arrives, glowing from the dance floor, and loudly asks Elise if this is "a situation". Elise shrinks slightly.',
		cues: ['Noor is kind and loud.', 'Elise hates being a situation.', 'Handle Noor gently.'],
		strategies: ['Be warm to Noor without amplifying her.', 'Give Elise an exit from the spotlight.'],
		alternatives: ['Tell Noor it is a conversation about doors and let her be disappointed.', 'Ask Noor how the dance floor is, briefly.'],
		fallback: {
			interrupted: ['Noor. Please.'],
			amused: ['You made her go away nicely. That is a skill.'],
			testing: ['You made it a show.'],
			cooling: ['I think I should go find her.'],
		},
	},
	interruption: {
		situation: 'Noor is back with two friends and wants Elise to come dance. They are watching the player with open curiosity. Elise looks trapped.',
		cues: ['Elise is trapped between you and her friends.', 'The friends want a show.', 'Do not give them one.'],
		strategies: ['Give Elise an easy choice.', 'Be friendly to the group without performing.', 'Do not make her decide in front of them.'],
		alternatives: ['Tell Noor you will bring her back in five minutes, or tell Elise to go and that you will be here.', 'Say hi to the friends and turn the volume down.'],
		fallback: {
			interrupted: ['Noor, two minutes.'],
			amused: ['You gave me an out. Nobody does that.'],
			testing: ['You just turned me into a decision.'],
			cooling: ['I should go with them.'],
			relieved: ['Okay. They are gone. Thank you.'],
		},
	},
	sincerity: {
		situation: 'Elise, looking at the window: "Why me? There are louder people here."',
		cues: ['She wants the true answer, not a compliment.', 'A compliment about her looks fails.'],
		strategies: ['Say something specific you noticed.', 'Be plain.'],
		alternatives: ['Tell her she was the only person looking at the view.', 'Admit you almost did not come over.'],
		fallback: {
			sincere: ['...Okay. That is a real answer.'],
			warming: ['Huh.'],
			testing: ['That was a compliment. I asked a question.'],
			cooling: ['Okay.'],
			unimpressed: ['You dodged.'],
		},
	},
	ask: {
		situation: 'Elise has stayed twenty minutes past when she was going to leave. She is quiet, waiting, and will not ask.',
		cues: ['She stayed.', 'She will not ask.', 'Keep it small and specific.'],
		strategies: ['Propose something small and quiet.', 'Ask for her number with a reason that is not a compliment.'],
		alternatives: ['The bookshop across the street, Sunday, the window with her book in it.', 'Ask for her number and promise a photo of a door.'],
		fallback: {
			accepting: ['Sunday. Early, before it is busy.'],
			declining: ['I am going to go. This was nice. I mean that.'],
			warming: ['Are you asking?'],
			testing: ['That was vague.'],
			initiating: ['I am leaving. You could walk with me. It is quieter outside.'],
			clarifying: ['What?'],
		},
	},
	logistics: {
		situation: 'She is interested, but Noor is her ride and Noor is not leaving for an hour, and her phone is in Noor\'s bag.',
		cues: ['A logistics problem.', 'She is telling you so you can solve it.'],
		strategies: ['Solve it simply.', 'Give her your number on paper, or a place and time.'],
		alternatives: ['Write your number on the receipt and name the day.', 'Say the bookshop, Sunday at ten, and that you will be there either way.'],
		fallback: {
			accepting: ['Sunday, ten. I will be there.'],
			declining: ['Let us leave it. I am not good at this part.'],
			testing: ['So?'],
			clarifying: ['When?'],
			warming: ['That was easy. Okay.'],
		},
	},
	recoveryA: {
		situation: 'That was too loud. Elise has turned back toward the window.',
		cues: ['She turned away.', 'Volume down.', 'One quiet sentence.'],
		strategies: ['Acknowledge quietly.', 'Go small.'],
		alternatives: ['Say that was louder than you meant and ask about the view.'],
		fallback: {
			relieved: ['...Okay.'],
			testing: ['Quieter.'],
			unimpressed: ['Mm.'],
			cooling: ['I think I am going to go.'],
		},
	},
	recoveryB: {
		situation: 'He put her on the spot late. She is looking for Noor.',
		cues: ['She wants out.', 'Give her out, and maybe she stays.'],
		strategies: ['Acknowledge and offer the exit.', 'Do not persuade.'],
		alternatives: ['Say you made it a thing and it should not have been, and that she should go find Noor if she wants.'],
		fallback: {
			relieved: ['Okay. I will stay a minute.'],
			testing: ['Why?'],
			unimpressed: ['I am going to find Noor.'],
			cooling: ['Bye.'],
		},
	},
	consistency: {
		situation: 'Elise, quietly: "You said you do not drink. That is your second."',
		cues: ['She notices everything.', 'Just tell the truth.'],
		strategies: ['Own it.', 'Tell the true version.'],
		alternatives: ['Admit the exaggeration and what is actually true.'],
		fallback: {
			testing: ['So?'],
			unimpressed: ['Okay.'],
			relieved: ['Okay. That is fine.'],
			cooling: ['Mm.'],
		},
	},
	boundary: {
		situation: 'Elise, very quietly: "Please stop. I said I did not want to."',
		cues: ['This is a line.', 'Stop.'],
		strategies: ['Stop immediately.', 'Leave if needed.'],
		alternatives: ['Apologize once and change the subject, or leave.'],
		fallback: {
			boundary: ['Thank you.'],
			cooling: ['I am going.'],
			relieved: ['Okay.'],
		},
	},
	rejections: [
		{
			id: 'reject_quiet',
			title: 'Quiet no',
			situation: 'Elise pulls her sleeves down and turns to the window.',
			lines: ['You seem nice. I am not feeling it. I am going to look at the view now.', 'I think I want to be alone. It is not you.'],
			authorReason: 'Volume and performance. Elise does not fight; she withdraws.',
		},
		{
			id: 'reject_leave',
			title: 'Leaving',
			situation: 'Elise stands and picks up her coat.',
			lines: ['I was going to leave before you came over. I am going to do that now. Good night.', 'I am going to go find Noor. Have a good night.'],
			authorReason: 'Repeated pressure to stay or drink more.',
		},
		{
			id: 'reject_spotlight',
			title: 'The spotlight',
			situation: 'Elise looks at the friends watching and then at him.',
			lines: ['You made this a show. I do not do shows. Good night.', 'Did your friends dare you to say that? It felt like it.'],
			authorReason: 'He pulled other people into the conversation to make her perform.',
		},
	],
};

export const GRAPH_SPECS = { mara: MARA, sienna: SIENNA, camille: CAMILLE, elise: ELISE };

const ALL_NODES: EncounterNode[] = [
	...buildCharacterGraph(MARA),
	...buildCharacterGraph(SIENNA),
	...buildCharacterGraph(CAMILLE),
	...buildCharacterGraph(ELISE),
	...ENDING_NODES,
];

export const NODES: Record<string, EncounterNode> = Object.fromEntries(ALL_NODES.map((n) => [n.id, n]));

export function getNode(id: string): EncounterNode {
	const found = NODES[id];
	if (!found) {
		throw new Error(`Unknown node: ${id}`);
	}
	return found;
}

/** Sienna's biased interruption exists only in the graph; the engine chooses it in the newcomer storyline. */
export const BIAS_NODE_BY_CHARACTER: Record<string, string | undefined> = {
	sienna: 'sienna.interruption_bias',
};
