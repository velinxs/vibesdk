/**
 * Vex Sterling, the fictional guru. Everything here is satire and none of it
 * touches authoritative state. Lines are chosen by event, never at random.
 */
export type CoachEvent =
	| 'strong_turn'
	| 'weak_turn'
	| 'poor_turn'
	| 'held'
	| 'routine_recognized'
	| 'wrong_room'
	| 'recognized_by_both'
	| 'adaptation'
	| 'interruption'
	| 'interruption_handled'
	| 'defensive'
	| 'approval_seek'
	| 'story'
	| 'direct_interest'
	| 'boundary'
	| 'rejected'
	| 'number_exchange'
	| 'date_plan'
	| 'leave_together'
	| 'friendly'
	| 'graceful_exit'
	| 'congruence'
	| 'repeat'
	| 'bias_event'
	| 'chad_help'
	| 'manipulation';

export const COACH_NOTIFICATIONS: Record<CoachEvent, string[]> = {
	strong_turn: ['FRAME INTACT. EVENING STILL AVAILABLE.', 'IOI DETECTED. UPDATE: SHE WAS LOOKING AT THE BARTENDER.', 'ALPHA BUILD. APPROVAL-SEEKING PASSIVE.'],
	weak_turn: ['FRAME UNDER CONSTRUCTION.', 'NONCHALANCE REQUIRES FEWER ANNOUNCEMENTS.'],
	poor_turn: ['BITCH SHIELD: ALLEGED.', 'FRAME UNDER CONSTRUCTION.'],
	held: ['SIGNAL UNCLEAR. RECALIBRATING.'],
	routine_recognized: ['ROUTINE STACK ENGAGED.', 'DHV DETECTED. LINKEDIN ENERGY RISING.'],
	wrong_room: ['PERFECT EXECUTION. WRONG ROOM.'],
	recognized_by_both: ['ROUTINE RECOGNIZED. BY BOTH PARTIES.'],
	adaptation: ['CALIBRATION CONFIRMED. NOBODY TAUGHT YOU THAT.'],
	interruption: ['AMOG APPROACHING. UPDATE: LOOKING FOR THE BATHROOM.', 'SET UNDER PRESSURE. DEPLOY GROUP THEORY.'],
	interruption_handled: ['AMOG NEUTRALIZED. HE WAS NEVER HOSTILE.'],
	defensive: ['DEFENSIVE POSTURE DETECTED. THE FRAME IS LEAKING.'],
	approval_seek: ['ALPHA BUILD. APPROVAL-SEEKING ACTIVE. ABORT.'],
	story: ['DHV DETECTED. LINKEDIN ENERGY RISING.'],
	direct_interest: ['DIRECT GAME ENGAGED. NO EXITS.'],
	boundary: ['BOUNDARY DETECTED. THIS IS NOT A TEST. I REPEAT: NOT A TEST.'],
	rejected: ['ROMANTIC APPLICATION DECLINED.'],
	number_exchange: ['CONTACT INFORMATION ACQUIRED. MARRIAGE UNCONFIRMED.'],
	date_plan: ['LOGISTICS SECURED. CALENDAR IS THE NEW BATTLEFIELD.'],
	leave_together: ['EXTRACTION IN PROGRESS. WALK NORMALLY.'],
	friendly: ['FRIEND ZONE: A REAL PLACE WITH GOOD PEOPLE IN IT.'],
	graceful_exit: ['EJECT EXECUTED. DIGNITY INTACT.'],
	congruence: ['CONGRUENCE TEST FAILED. YOUR BACKSTORY HAS A CONTINUITY ERROR.'],
	repeat: ['ROUTINE RECOGNIZED. BY BOTH PARTIES.'],
	bias_event: ['HOSTILE GATEKEEPER. NOT YOUR FRAME. NOT YOUR PROBLEM.'],
	chad_help: ['YOUR OPENER WAS BAD. YOUR LIGHTING WAS EXCELLENT.', 'BENEFIT OF THE DOUBT: PREMIUM TIER.'],
	manipulation: ['ATTEMPTED FRAME CONTROL ON THE REFEREE. REFEREE IS NOT IN THE BAR.'],
};

/** Longer coach commentary shown in the coach panel. Unreliable by design. */
export const COACH_COMMENTARY: Record<CoachEvent, string[]> = {
	strong_turn: ['Textbook. I would say I taught you that, and I will.', 'See how she leaned in? That is an IOI. Or she is reaching for her drink. Both are wins.'],
	weak_turn: ['You gave ground. Alphas do not give ground. They also do not explain what ground is.', 'That was beta-adjacent. Not full beta. Beta-curious.'],
	poor_turn: ['Bitch shield. Classic. Alternatively, she simply did not enjoy that. The distinction is academic.', 'Frame collapse. Rebuild the frame. Use lumber.'],
	held: ['She did not understand you. Neither did I. Neither did the frame.'],
	routine_recognized: ['Routine recognized by the system. The system is me. I am very proud.'],
	wrong_room: ['Flawless delivery. Wrong moment. This is like landing a plane on a highway. Impressive. Wrong.'],
	recognized_by_both: ['She has heard that one. To be fair, everyone has. I sold it on a DVD in 2006.'],
	adaptation: ['You improvised. Off-script. I do not endorse this and it worked, which is worse.'],
	interruption: ['AMOG in the set. Deploy the AMOG protocol. The protocol is: be normal. I made it sound harder on purpose.'],
	interruption_handled: ['You befriended the obstacle. In my day we called that a tactical alliance. It was just being nice.'],
	defensive: ['You defended yourself. Never defend. Unless attacked. Which you were not. See the problem.'],
	approval_seek: ['You asked if that was okay. Never ask if it was okay. Ask yourself. Then do not answer.'],
	story: ['DHV deployed. Demonstration of higher value. Or a story about a tabla. Same thing.'],
	direct_interest: ['Direct game. The nuclear option. No hedging, no routines, no me. I feel unnecessary and I hate it.'],
	boundary: ['She said stop. This is not a shit test. There is no move here. Stop is stop.'],
	rejected: ['Rejection is redirection. The redirection is toward the exit.'],
	number_exchange: ['Number close. Text her something that is not "hey". I have a list. Do not use my list.'],
	date_plan: ['A day and a time. Logistics. The least sexy word in game and the one that actually works.'],
	leave_together: ['Extraction. Walk normally. Say goodbye to her friends. Do not narrate this.'],
	friendly: ['A friend. Fine. Friends have friends. This is called social circle game and it is also called having friends.'],
	graceful_exit: ['You left on your terms. Alpha exit. Or you just left. Either way the room respects it.'],
	congruence: ['Your story changed. She noticed. Women notice. Also men. Also I noticed.'],
	repeat: ['You said that already. She heard you the first time. So did the bartender.'],
	bias_event: ['That was not a shit test. That was a person being small at you. You do not owe her a routine. You owe yourself a good exit or a better conversation.'],
	chad_help: ['Your opener was bad. Your lighting was excellent. The room is doing sixty percent of this and I want you to know that.'],
	manipulation: ['You tried to talk to the scoreboard. She is not the scoreboard. I am not the scoreboard. Nobody knows who the scoreboard is.'],
};
