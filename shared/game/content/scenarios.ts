import type { Difficulty, PlayerAvatar, ScenarioConfig } from '../types';

/**
 * Difficulty changes starting conditions and challenge structure only. The
 * evaluator rubric is identical across settings.
 */
export const SCENARIOS: Record<string, ScenarioConfig> = {
	chad: {
		id: 'chad',
		name: 'Easy: Chad Mode',
		description:
			'You are styled as unusually attractive, you arrived with people who like you, and the room gives you the benefit of the doubt. The comedy is how much of the work the room is doing.',
		difficulty: 'chad',
		startMeters: { momentum: 55, interest: 48, comfort: 50, trust: 40 },
		strikeLimit: 4,
		setbackScale: 0.6,
		recoveryOffered: true,
		immediateRejectionChance: 0.02,
		interruptionCount: 1,
		npcInitiative: 2,
		stageTurnBonus: 0,
		modifiers: [
			'Premium-tier benefit of the doubt: openings start warmer.',
			'Strong social proof: two people in the room already vouched for you.',
			'Forgiving momentum: weak turns cost less.',
			'Generous recovery: a stumble gets a second chance more often.',
		],
		newcomer: false,
	},
	normal: {
		id: 'normal',
		name: 'Normal: A Guy at a Bar',
		description: 'Neutral familiarity and a mixed reception. Standard thresholds, ordinary interruptions, balanced recovery.',
		difficulty: 'normal',
		startMeters: { momentum: 45, interest: 35, comfort: 40, trust: 30 },
		strikeLimit: 3,
		setbackScale: 1,
		recoveryOffered: true,
		immediateRejectionChance: 0.1,
		interruptionCount: 1,
		npcInitiative: 1,
		stageTurnBonus: 0,
		modifiers: ['Ordinary reception.', 'One interruption per encounter.', 'Balanced recovery paths.'],
		newcomer: false,
	},
	hard: {
		id: 'hard',
		name: 'Hard: No Social Proof',
		description: 'You know nobody here and you are walking into established groups without an introduction.',
		difficulty: 'hard',
		startMeters: { momentum: 38, interest: 28, comfort: 32, trust: 24 },
		strikeLimit: 3,
		setbackScale: 1.25,
		recoveryOffered: true,
		immediateRejectionChance: 0.18,
		interruptionCount: 2,
		npcInitiative: 0,
		stageTurnBonus: 1,
		modifiers: [
			'No introduction: openings start cooler.',
			'Group management: friends interrupt twice.',
			'Fewer easy transitions: stages need one more good turn.',
		],
		newcomer: false,
	},
	epic: {
		id: 'epic',
		name: 'Epic: New City, No Wingman',
		description:
			'No local network, unfamiliar social circles, competing plans, and a demanding sequence of situational challenges. Successful routes exist; the obstacles are visible.',
		difficulty: 'epic',
		startMeters: { momentum: 35, interest: 25, comfort: 28, trust: 20 },
		strikeLimit: 2,
		setbackScale: 1.5,
		recoveryOffered: true,
		immediateRejectionChance: 0.22,
		interruptionCount: 2,
		npcInitiative: 0,
		stageTurnBonus: 1,
		modifiers: [
			'New in town: nobody can vouch for you.',
			'Unfamiliar circles: a friend may decide you are not worth the group\'s time.',
			'Consequential setbacks: two strikes close an approach.',
			'Harder recovery branches and limited coach assistance.',
			'Linked encounters: a dignified exit keeps the night alive.',
		],
		newcomer: true,
	},
};

export function getScenario(difficulty: Difficulty): ScenarioConfig {
	return SCENARIOS[difficulty];
}

/**
 * Avatars are characterization only. Nothing in the engine reads ethnicity
 * or background as a global attraction or difficulty multiplier.
 */
export const AVATARS: Record<string, PlayerAvatar> = {
	sam: {
		id: 'sam',
		name: 'Sam',
		description: 'Grew up two neighborhoods over. Product designer. Owns exactly one good jacket and is wearing it.',
		background: 'local',
		style: 'clean, understated, sleeves pushed up',
		strengths: ['listens well', 'dry humor', 'knows the city'],
	},
	arjun: {
		id: 'arjun',
		name: 'Arjun',
		description:
			'Arrived from Pune eleven weeks ago for a structural engineering job. Plays tabla badly and cricket well. Curious, dry, decisive once he has read a room. Knows nobody in this lounge yet.',
		background: 'newcomer',
		style: 'tailored navy overshirt, white tee, good watch he bought himself',
		strengths: ['reads group dynamics fast', 'specific compliments', 'unbothered by silence', 'makes concrete plans'],
	},
	marcus: {
		id: 'marcus',
		name: 'Marcus',
		description: 'Session drummer who moved here for the studios. Talks with his hands. Easy laugh, terrible at pretending to be bored.',
		background: 'local',
		style: 'black tee, silver chain, worn leather jacket',
		strengths: ['warmth', 'storytelling', 'takes a joke'],
	},
	rohan: {
		id: 'rohan',
		name: 'Rohan',
		description:
			'Born here, raised on his aunt\'s dosas and his dad\'s vinyl. Emergency physician on a rare night off. Calm under pressure, allergic to small talk, secretly great at it.',
		background: 'local',
		style: 'charcoal knit polo, clean sneakers',
		strengths: ['composure', 'sincerity', 'asks real questions'],
	},
	kenji: {
		id: 'kenji',
		name: 'Kenji',
		description: 'Transferred from Vancouver last month for a fintech job. Rock climber, coffee snob, pathologically punctual.',
		background: 'newcomer',
		style: 'olive bomber, white shirt',
		strengths: ['direct', 'observant', 'good at logistics'],
	},
};

export const AVATAR_IDS = Object.keys(AVATARS);
