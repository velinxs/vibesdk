/**
 * In-game codex. Each entry records the historical community meaning,
 * source (from the brief's source register), and how After Hours adapts it.
 */
export interface CodexEntry {
	term: string;
	meaning: string;
	source: string;
	adaptation: string;
}

export const CODEX: CodexEntry[] = [
	{ term: 'PUA', meaning: 'Pick-up artist.', source: 'R2', adaptation: 'The guru\'s self-description. The game never uses it for the player.' },
	{ term: 'Set / opening a set', meaning: 'A group approached and the act of beginning interaction.', source: 'R1', adaptation: 'Approach stage. Groups matter mechanically: friends interrupt and judge.' },
	{ term: 'Opener', meaning: 'A conversational entry gambit.', source: 'R3', adaptation: 'The Observation Opener routine: specific to the scene or it reads as a line.' },
	{ term: 'Direct / indirect', meaning: 'Expressing attraction upfront versus entering through another topic.', source: 'R3', adaptation: 'Direct Interest is a routine and an intent. It scores well when a connection exists and badly before one.' },
	{ term: 'Routine / canned material', meaning: 'Prepared conversational or performance material.', source: 'R1, R8', adaptation: 'Equipped routines. Mastery improves execution feedback, not suitability.' },
	{ term: 'Routine stack', meaning: 'Routines connected in sequence.', source: 'R2', adaptation: 'Consecutive suitable routines earn a small transition bonus. Interruptions break the stack.' },
	{ term: 'DHV', meaning: 'A demonstration intended to convey higher perceived value.', source: 'R1', adaptation: 'The Compact Story routine. Bragging is not a DHV here; relevance is.' },
	{ term: 'Peacocking', meaning: 'Conspicuous dress intended to attract attention.', source: 'R1', adaptation: 'Optional equipment with tradeoffs. A statement watch invites a tease.' },
	{ term: 'Social proof', meaning: 'Others\' regard used as a status or attractiveness cue.', source: 'R1', adaptation: 'A difficulty modifier: Chad Mode starts with it, Hard removes it. It is a starting condition, not a skill.' },
	{ term: 'Preselection', meaning: 'Others\' romantic interest presented as evidence of desirability.', source: 'R1', adaptation: 'Part of the Chad Mode fiction. The coach cites it constantly; the engine never scores it.' },
	{ term: 'Neg', meaning: 'A subtly negative remark intended to affect perceived relative value.', source: 'R1', adaptation: 'Not a routine. The evaluator distinguishes a friendly tease from a put-down; put-downs are scored as insults.' },
	{ term: 'Bitch shield', meaning: 'Derogatory shorthand for defensiveness or an unreceptive response.', source: 'R2', adaptation: 'A coach label only, always marked ALLEGED. The engine\'s explanation of her behavior is the node cue, not this.' },
	{ term: 'IOI / IOD', meaning: 'Indicator of interest / disinterest.', source: 'R2', adaptation: 'Gestures and expressions in the scene. The coach misreads them for comedy; the debrief reports the recorded reaction.' },
	{ term: 'AMOG', meaning: 'Alpha male of the group; perceived dominant rival.', source: 'R2, R9', adaptation: 'Dev. Sometimes competitive, usually looking for the bathroom.' },
	{ term: 'Frame / frame control', meaning: 'Interpretation of an interaction and attempts to direct it.', source: 'R4', adaptation: 'Composure covers the useful part. Trying to frame-control a refusal is scored as pressure.' },
	{ term: 'Shit / congruence test', meaning: 'A challenge interpreted as testing confidence or consistency.', source: 'R5', adaptation: 'Tease and consistency nodes. Disinterest is a different node kind and is never labeled a test.' },
	{ term: 'Calibration', meaning: 'Adjusting behavior and timing to circumstances.', source: 'R2', adaptation: 'One of the three scored dimensions: fit to topic, cue, personality, context, and boundaries.' },
	{ term: 'Cocky-funny', meaning: 'Cockiness delivered through humor.', source: 'R2', adaptation: 'A viable style with Sienna. With Elise it reads as volume.' },
	{ term: 'Qualification', meaning: 'Inviting someone to demonstrate appealing qualities.', source: 'R3', adaptation: 'Mutual Qualification routine: an exchange, not a test. Interview mode backfires.' },
	{ term: 'Comfort', meaning: 'Connection-building within the practitioner\'s progression model.', source: 'R3', adaptation: 'A fictional encounter meter, raised by listening and composure.' },
	{ term: 'False time constraint', meaning: 'Claiming limited availability on approach.', source: 'R2', adaptation: 'Not a routine. Sienna names it when she sees it.' },
	{ term: 'Inner / outer game', meaning: 'Internal confidence and beliefs versus outward performance.', source: 'R2', adaptation: 'Composure is scored from what the player wrote, never from inferred confidence.' },
	{ term: 'Kino', meaning: 'Touch in pickup terminology.', source: 'R2', adaptation: 'Not modeled. Typed input cannot touch anyone and the engine does not pretend it can.' },
	{ term: 'Number close', meaning: 'Obtaining or exchanging a phone number.', source: 'R2', adaptation: 'A positive ending, reached by a specific ask with interest and trust above the node threshold.' },
	{ term: 'Alpha / beta', meaning: 'Hierarchical male-status labels in this literature.', source: 'R9', adaptation: 'Coach labels only. Ordinary kindness is never scored as beta; approval-seeking and defensiveness are scored separately.' },
	{ term: 'Push-pull', meaning: 'Alternating engagement and distancing.', source: 'R4', adaptation: 'Sienna recognizes it on sight. The Playful Reframe routine covers the useful half.' },
	{ term: 'Agree and amplify', meaning: 'Accepting a teasing premise and exaggerating it.', source: 'R5', adaptation: 'A starter routine. Suitable for tease nodes; a misfit for sincere questions.' },
];
