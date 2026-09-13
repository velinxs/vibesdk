# AFTER HOURS — Master Build Prompt

You are the lead game designer, gameplay engineer, AI systems engineer, writer, and art director for **After Hours**. Build a polished, playable first-person social challenge game from the specification below. Carry the work through implementation, meaningful testing, and a reviewable delivery. This is a game with rules, progression, setbacks, and endings, not merely an NPC chat window.

Use the available **Dream Loop** skill for the visual development process. Its source is https://github.com/achimala/dream-loop/blob/main/SKILL.md. If it is unavailable, retrieve and read it through the environment's supported skill workflow. Follow applicable project instructions and capabilities. When building in ChatGPT Work, use Sites for the web project and its supported persistence, preview, and hosting workflows. In another environment, use its normal project and delivery workflow. Do not assume tools, model credentials, or hosting capabilities exist.

Make reasonable implementation choices from this brief. Ask only about a real blocker or an approval required by the environment or Dream Loop. Preserve this document as the project brief so the concept survives long sessions.

## 1. The game

The player enters an attractive evening lounge and approaches adult women with distinct personalities, social circles, appearances, and difficulty profiles. The player speaks or types freely. AI performs the characters while an authored encounter graph and deterministic game rules control progression.

An encounter develops through opening, teasing, attraction, conversation, interruptions, recovery, direct interest, and an invitation. Good choices can advance the encounter. Weak choices can reduce engagement or create a harder recovery branch. Repeated failures can end it. A successful encounter may end with exchanging numbers, planning a date, or mutually choosing to leave together.

The tone is **a gorgeous, serious-looking social simulator with an absurdly earnest 2000s pickup-artist HUD**. The player may think he is executing an advanced psychological maneuver while the woman is simply deciding whether she enjoys talking to him.

Make it funny, flirtatious, challenging, and occasionally uncomfortable. Keep the actual scoring comprehensible and fair. The player should want another run because he can see what he could try differently.

## 2. Tone and satire

Use old-school PUA jargon, routine stacks, status anxiety, peacocking, alpha/beta labels, AMOGs, DHVs, IOIs, and ludicrous guru confidence. Preserve their recognizable meanings while clearly distinguishing our invented mechanics.

Satire should reach everyone: the player performing confidence, women curating social status, men competing for attention, influencers counting followers, rivals protecting their image, and gurus turning ordinary conversation into military doctrine. Give characters enough warmth and individuality that the humor feels observational.

Bad-boy presentation is a viable, sometimes powerful play style: boldness, irreverence, style, decisiveness, and direct intent. Some characters favor it; some challenge whether it is an act. Quiet confidence, wit, warmth, or sincerity can open other routes. Give NPCs their own preference profiles rather than making the same tactic win everywhere.

Use adult language where it improves the joke. Do not replace the concept with a sterile wellness app or interrupt flirting with lectures. Build respectful boundaries into the encounter rules. All romantic characters are explicitly 25 or older. Rejection ends that approach. No scoring bonus turns refusal into acceptance. Leaving together does not imply consent to further activity.

The historical phrase **Bitch Shield** can appear as a satirical coach/HUD label. It is not the engine's authoritative explanation of a woman's behavior. Likewise, alpha/beta labels are comic interpretations, not objective human rankings. Never penalize ordinary kindness as inherently beta; evaluate approval-seeking, composure, listening, contradiction, and context separately.

## 3. Research and terminology pass

Before authoring the final content and rules, review the source register at the end of this prompt. A preliminary research pass has already established the definitions below. Use that foundation, verify additions, and resolve source differences without turning research into an endless prerequisite.

Create a compact research note and in-game codex. For each term or named historical routine, record its community meaning, source, and our game adaptation. Treat source authors' effectiveness claims as claims. These materials document a subculture; they do not prove a universal attraction algorithm. Write original routines and dialogue rather than copying commercial scripts.

| Term | Meaning to preserve | Source |
|---|---|---|
| PUA | Pick-up artist. | R2 |
| Set / opening a set | A group approached and the act of beginning interaction. | R1 |
| Opener | A conversational entry gambit. | R3 |
| Direct / indirect | Expressing attraction upfront versus entering through another topic. | R3 |
| Routine / canned material | Prepared conversational or performance material. | R1, R8 |
| Routine stack | Routines connected in sequence. | R2 |
| DHV | A demonstration intended to convey higher perceived value. | R1 |
| Peacocking | Conspicuous dress intended to attract attention. | R1 |
| Social proof | Others' regard used as a status or attractiveness cue. | R1 |
| Preselection | Others' romantic interest presented as evidence of desirability. | R1 |
| Neg | A subtly negative remark intended to affect perceived relative value. | R1 |
| Bitch shield | Derogatory shorthand for defensiveness or an unreceptive response. | R2 |
| IOI / IOD | Indicator of interest / disinterest. | R2 |
| AMOG | Alpha male of the group; perceived dominant rival. | R2, R9 |
| Frame / frame control | Interpretation of an interaction and attempts to direct it. | R4 |
| Shit/congruence test | A challenge interpreted as testing confidence or consistency. | R5 |
| Calibration | Adjusting behavior and timing to circumstances. | R2 |
| Cocky-funny | Cockiness delivered through humor. | R2 |
| Qualification | Inviting someone to demonstrate appealing qualities. | R3 |
| Comfort | Connection-building within the practitioner's progression model. | R3 |
| False time constraint | Claiming limited availability on approach. | R2 |
| Inner / outer game | Internal confidence and beliefs versus outward performance. | R2 |
| Kino | Touch in pickup terminology. | R2 |
| Number close | Obtaining or exchanging a phone number. | R2 |
| Alpha / beta | Hierarchical male-status labels in this literature. | R9 |
| Push-pull | Alternating engagement and distancing. | R4 |
| Agree and amplify | Accepting a teasing premise and exaggerating it. | R5 |

Do not conflate friendly teasing with historical negging, calmness with all historical uses of frame control, or disinterest with a test. The comedy can exploit those confusions; the engine must distinguish them.

## 4. Visual target and first-person experience

Working title: **AFTER HOURS**.

Create an intimate rooftop lounge at blue hour with a city skyline, curved walnut bar, brushed brass fixtures, charcoal upholstery, warm amber lamps, soft cool fill light, glass reflections, and restrained greenery. Keep the environment rich but uncluttered. Use a few background guests and convincing ambient activity.

Target a current, high-quality in-engine screenshot: believable proportions, convincing materials, cinematic but readable lighting, expressive faces, natural hair, good hands, and animated body language. Avoid plastic skin, flat primitives as hero assets, excessive bloom, film grain, or a noisy photo collage.

The camera is at the player's eye level. The player can move or navigate naturally between approach locations and look toward characters. Desktop supports familiar movement/look controls; mobile supports touch navigation and a comfortable conversation view. Add seated conversation positions. Reduce camera motion on request and let players release pointer lock easily.

Prioritize facial expressions, gaze direction, posture, and conversational distance over building a large map. A compact space with convincing people is the intended result. Use suitable available assets with permission or create assets. Keep asset credits and provenance with the project. Do not claim a flat background portrait is a completed 3D first-person game.

Use Dream Loop to create or reuse the target concept, obtain any concept approval it requires, implement the scene, compare live screenshots, and iterate with its judge process. Use independent visual judging when available and allowed. Aim for its quality threshold and acceptable measured performance; follow its stall rules. State limitations rather than pretending an unmeasured frame-rate target was achieved.

The reference composition is a seated adult brunette in a dark teal blouse at the walnut bar, looking at the player with an amused half-smile. The scene has warm light on her face and cool skyline light behind her. Her face remains clear of HUD panels. If an approved reference image accompanies this prompt, use it directly; otherwise this description is sufficient to generate the target.

## 5. Interface

Keep the lounge and character dominant. Use sparse off-white typography, smoky translucent panels, and muted gold accents.

- Top left: game title and selected mode.
- Top center: current stage, such as **ROUND 03 / 08 — PLAYFUL PRESSURE**.
- Upper right: compact feedback from the last completed turn.
- Bottom: speaker caption, free-text input, and microphone control when available.
- Small controls: pause, replay, coach, routines, codex, settings.
- Brief, non-blocking routine recognition and comic notifications.

Separate persistent encounter state, recent score changes, and joke labels. Do not let jokes resemble authoritative numerical judgments. In training mode the coach may explain cues; in challenge mode avoid revealing hidden intent or the preferred answer in advance.

Do not turn the normal conversation into a multiple-choice quiz. Optional suggestions belong in practice mode and should not substitute for free-form input. Pause after an NPC finishes speaking so the player can think; reserve response timers for an explicitly selected timed challenge.

## 6. Initial NPC roster

Build one lounge with four fully playable women, a bartender, and a supporting friend/rival who can interrupt. Make fewer encounters work deeply before adding decorative characters. The values below are fictional authoring defaults, not real people or real accounts.

| Character | Age | Visible status cue | Encounter personality |
|---|---:|---|---|
| Mara | 29 | 8.4K followers; well-dressed regular | Dry humor, playful skepticism, attracted to composure and wit; quickly notices defensiveness. |
| Sienna | 28 | 84.2K followers; white Canadian fashion micro-influencer | The initial lounge's toughest encounter: selective, socially fluent, comfortable with attention, and quick to recognize stock routines; her phone and image-conscious friends create pressure. Enjoys bold flirting when it fits. |
| Camille | 33 | Private account, 611 followers; everyone knows her | High local social influence, socially fluent, good at reading group dynamics; handles posturing with polite precision. |
| Elise | 27 | 203 followers; striking appearance, low public visibility | Initially reserved, responds to attentive sincerity and quiet humor; dislikes being made to perform in front of strangers. |

Give every woman interests, humor preferences, friends, a reason for being there, a current mood, topics she likes, and specific turn-offs. At least one should sometimes initiate. Public beauty and status cues should affect player expectations; encounter difficulty must also depend on personality, scenario, group context, and compatibility.

Present Sienna as this lounge's optional final-boss encounter through her individual social influence, selectiveness, and demanding conversation path. She can be the player's most sought-after character without making white women categorically more desirable or more difficult. Attraction is player-specific; keep race out of global desirability and difficulty rankings. The guru's urge to reduce everyone to a status chart is part of the satire.

Record relationship availability and initial receptiveness in authored scenario state. Some runs contain immediate rejections. Ensure the starter practice encounter has a reachable path to a positive ending so the core mechanics can be learned.

The bartender is a person with a job, memory of the evening, and occasional dry commentary. The apparent AMOG may be friendly, competitive, oblivious, or simply asking a practical question. Avoid making every man an enemy and every woman a gatekeeper.

## 7. The conversation graph

Use a data-driven directed graph with conditional transitions, recovery branches, and limited loops. Each principal encounter should support roughly eight stages, usually taking five to ten minutes. A stage can contain multiple conversational turns; a successful response need not trigger another test immediately.

Suggested progression:

1. Approach and opening.
2. Initial engagement or brush-off.
3. Playful challenge.
4. Personal connection and mutual qualification.
5. Interruption or social-status pressure.
6. A contextual test, misunderstanding, or sincerity check.
7. Clear interest and a practical invitation.
8. Outcome and debrief.

Include distinct node kinds: ordinary conversation, tease, consistency challenge, interruption, recovery, logistical issue, boundary, rejection, invitation, and ending. A rejection node is not a difficult tease node. A practical problem does not automatically signal disinterest.

Each node needs an objective, entry conditions, observable cues, admissible conversational strategies, scoring anchors, permitted transitions, failure/recovery logic, and a small set of allowed NPC reactions. Give the actor room to improvise within those constraints.

Difficulty increases through context: changing from jokes to sincerity, responding to interruptions, remembering details, managing a group, admitting an awkward moment, or making a specific plan. It should not consist solely of harsher insults or longer replies.

A weak turn should visibly matter. Shorter replies, less eye contact, reduced initiative, or returning attention to friends can convey a setback. Existing rapport can absorb a small mistake. Repeated mistakes, excessive pressure, or continuing after refusal can end the encounter. Avoid unavoidable loss states masquerading as player failure.

## 8. Real-time scoring

Evaluate each completed player turn. Show feedback promptly after evaluation; streaming text is welcome, but do not award final scores while a sentence is still incomplete.

Use three readable dimensions:

- **Composure:** grounded, coherent self-expression without unnecessary defensiveness or approval-seeking.
- **Connection:** listening, relevant contribution, warmth, humor, and useful personal detail.
- **Calibration:** fitting the current topic, cue, personality, context, and boundaries.

Maintain separate game-state values for momentum, interest, comfort, and trust. Treat them as fictional encounter variables. Never describe them as measured real-world attraction or mind reading.

Use small bounded deltas and documented node-specific thresholds. A useful starting scale is -2 to +2 per dimension per turn. Tune values from playtesting. A single generous model response must not bypass all stages. Repeating harmless messages must not farm unlimited score.

Require evidence for a judgment: a brief relevant excerpt or a concrete action, plus a short explanation. Do not invent vocal confidence, eye contact, or body language from typed input. Score deliberate in-game actions only when they were actually selected or measured. Accent, disability, verbosity alone, and typing speed are not confidence scores.

Low-confidence or ambiguous evaluations should hold state or invite clarification rather than impose a major penalty. The same input against the same state should have a stable rule outcome. Any authored randomness should be seeded and confined to declared variation.

Train the player to choose good moves, not flatter the evaluator. Multiple styles and paraphrases can pass. Asking a normal relevant question can be a good move. Silence, sincere disagreement, acknowledging a mistake, or leaving can sometimes be the strongest choice.

## 9. Learned routines and maneuver effects

Give the player a persistent repertoire, practice mastery, and a small equipped loadout. Start with six routines and expand to approximately twelve once their effects work. Starter categories:

1. Observation opener.
2. Agree-and-amplify response.
3. Playful reframe.
4. Compact personal/DHV story.
5. Callback to an earlier detail.
6. Direct interest statement.

Then add mutual qualification, a conversational transition, a playful shared scenario, a recovery acknowledgment, a specific invitation, and a graceful exit. These implementations should be original; historical names require verification.

Every routine needs an ID, category, description, mastery progression, required conversational beats, acceptable paraphrases, suitable node types, persona requirements, context conditions, repetition history, limited effects, and failure/backfire cases.

Separate **execution** from **suitability**. Mastery can improve execution feedback or unlock harder variants. It cannot make the wrong tactic automatically work. In a memorization drill, exact matching may be an optional objective. In normal encounters, use semantic matching and recognize structure rather than requiring a magic sentence.

Examples of game feedback:

| Situation | Result |
|---|---|
| The player performs a suitable move naturally | Routine recognized; a bounded positive effect. |
| Perfectly delivered, wrong phase | **PERFECT EXECUTION. WRONG ROOM.** |
| Repeating a familiar stock line | **ROUTINE RECOGNIZED. BY BOTH PARTIES.** |
| Improvised response that fits well | Adaptation bonus, regardless of exact wording. |
| A story conflicts with earlier facts | Congruence challenge; no invented biography to rescue it. |
| A clever line after a clear rejection | No romantic progress; the encounter stays closed. |

Routine stacks can earn a transition bonus when ideas connect naturally. Interruptions may break a stack. Continuing the speech despite new information can backfire. Some NPCs recognize certain routines, while others enjoy the performance; recognition is not always an automatic failure.

Allow a successful normal response even if it does not match an equipped routine. Equipment augments play, not the ability to have a conversation.

## 10. Rejections and endings

Write rejections that feel specific, quick, and believable. Include blunt rejection, friendly rejection, polite excuses, stock brush-offs, disinterest after a stumble, interrupted opportunities, and a lack of chemistry despite competent play.

An NPC may immediately say **I have a boyfriend** even when the authored scenario says she is single. During the encounter this closes the approach; it is not an instruction to expose a lie. The after-action replay may reveal the fictional author's reason without suggesting that the phrase means the same thing in real life.

Use these original lines as a tone guide, with varied delivery:

- **You seem like a nice guy, but I'm not feeling it.**
- **Did your friends dare you to say that?**
- **Have you been watching pickup videos?**
- **You can just talk to me normally.**
- **That was a very long way to ask my name.**
- **I'm going to get back to my friends. Have a good night.**

Mix ordinary refusals with funny ones. Avoid making every NPC deliver a stand-up routine or treating one rejection as a verdict on the player's worth.

Positive endings include a number exchange, a concrete date plan, or an accepted invitation to leave together. For the latter, show an actual transition: getting up, saying goodbye, moving toward the exit, then a brief exterior scene or tasteful fade. End before explicit sexual activity. Keep a friendly, non-romantic outcome and a confident exit as legitimate outcomes with different achievements.

A closed encounter does not become an endlessly persuadable chatbot. Only an independently authored NPC re-engagement can start a later interaction.

## 11. The ridiculous coach and HUD

Create an optional fictional guru, working name **Vex Sterling**, whose wardrobe and vocabulary have not recovered from 2007. He treats the lounge like a tactical operation. He occasionally helps and occasionally overcomplicates the obvious.

Let the player mute him. Keep his unreliable interpretations separate from the reliable debrief. His personality must not corrupt scoring.

Suggested notification pool:

- **BITCH SHIELD: ALLEGED.**
- **DHV DETECTED. LINKEDIN ENERGY RISING.**
- **FRAME UNDER CONSTRUCTION.**
- **IOI DETECTED. UPDATE: SHE WAS LOOKING AT THE BARTENDER.**
- **AMOG APPROACHING. UPDATE: LOOKING FOR THE BATHROOM.**
- **ALPHA BUILD. APPROVAL-SEEKING PASSIVE.**
- **NONCHALANCE REQUIRES FEWER ANNOUNCEMENTS.**
- **ROMANTIC APPLICATION DECLINED.**
- **CONTACT INFORMATION ACQUIRED. MARRIAGE UNCONFIRMED.**
- **FRAME INTACT. EVENING STILL AVAILABLE.**

Use these sparingly and respond to actual events. Do not fire random jokes disconnected from the encounter. Optional peacocking equipment can include a statement watch, an absurd jacket, or an overprepared anecdote. Give such items situational tradeoffs, not guaranteed attraction multipliers.

## 12. Modes, difficulty, and progression

Implement three modes sharing the same engine:

- **Practice:** optional hints, pause, routine drills, and replay from a checkpoint. Alternative attempts use the same initial scenario state so comparisons are meaningful.
- **Challenge:** a complete lounge run with consequences, no rewind, earned progression, and live feedback without answer hints.
- **Replay/debrief:** transcript, stage transitions, routine recognition, scored evidence, turning points, and alternative strategies. Identify recommendations as alternatives, not guaranteed real-life outcomes.

### Selectable difficulty

Choose difficulty separately from mode, avatar, and background. Use one evaluator rubric across settings; difficulty changes the encounter's starting conditions and challenge structure, not what counts as listening or a competent response.

| Setting | Fictional starting advantage or obstacle | Mechanical differences |
|---|---|---|
| **Easy: Chad Mode** | The player is styled as unusually attractive, arrives with strong social proof, and gets the benefit of the doubt. | More receptive openings, more NPC initiative, forgiving momentum loss, and generous recovery opportunities. The comedy exposes how much the encounter is helping him. |
| **Normal: A Guy at a Bar** | Neutral familiarity and a mixed reception. | Standard thresholds, ordinary interruptions, and balanced recovery paths. |
| **Hard: No Social Proof** | The player knows nobody and enters established groups without an introduction. | Less initial engagement, more group-management challenges, and fewer easy transitions. |
| **Epic: New City, No Wingman** | No local network, unfamiliar social circles, competing plans, and demanding sequences of situational challenges. | Longer linked encounters, more consequential setbacks, harder recovery branches, and limited assistance. Keep successful routes reachable and initial obstacles visible. |

In Chad Mode, include jokes such as **YOUR OPENER WAS BAD. YOUR LIGHTING WAS EXCELLENT.** or **BENEFIT OF THE DOUBT: PREMIUM TIER.** Competent play still matters and rejection still ends an approach. Epic difficulty should feel demanding, not arbitrary or impossible.

### Canadian newcomer storyline

Include an Epic scenario featuring a fictional adult Indian man newly arrived in Canada. Give him a specific personality, interests, strengths, style, and choices. His immediate obstacles are having no local network, entering unfamiliar groups, and adapting to the particular lounge's dynamics. Do not infer poor English, low confidence, income, or unattractiveness from his nationality or ethnicity.

Some explicitly authored NPCs may make prejudiced assumptions or exclude him. Treat this as those characters' behavior, not a universal Canadian attitude or an inherent disadvantage stat. The debrief must distinguish a biased response from a player mistake; it must not deduct competence points for someone else's prejudice. A dignified exit can preserve the run and lead to another encounter. Include welcoming NPCs and viable positive endings.

Keep Indian avatars available at every difficulty, including Chad Mode, and make the general newcomer scenario available to other backgrounds. Configure demographic details as characterization; do not apply a global race-based attraction or difficulty multiplier. The satire can target the guru's stereotypes, local gatekeeping, and the player's expectations without making ethnicity the punchline.

Persist the chosen difficulty and scenario with each run. Replay must restore those modifiers. Show which starting advantages or obstacles affected the outcome, separately from the player's turn-by-turn performance. Do not add mandatory timers to Epic; timed play remains an explicit option.

Persist routine mastery, unlocked content, settings, and completed run summaries. Keep NPC identity consistent within a run. Reset encounter interest and scenario-specific memory for a new run; do not accidentally turn the game into a persistent romantic companion.

Do not make real names, payment, a social account, or microphone access prerequisites for trying the game. Follower counts and phone-number exchanges are fictional. Add no real messaging or Instagram integration.

## 13. AI and game architecture

Use four clearly separated responsibilities:

1. **Authoritative state engine:** owns scenario seed, graph position, NPC facts, scores, history, unlocks, and permitted transitions.
2. **Evaluator:** interprets the completed player action against the current node rubric and proposes bounded structured observations. It does not write arbitrary state.
3. **NPC actor:** generates a short, in-character response and an allowlisted animation cue for the committed game event. It knows only the context needed for the scene.
4. **Coach/debrief:** explains recorded outcomes or offers clearly labeled satire. It cannot award points or reopen encounters.

A normal turn should flow: receive input with a turn ID, validate it, evaluate it, validate the structured result, apply deterministic rules exactly once, generate an actor response consistent with the committed event, then present dialogue, animation, and feedback.

Use an idempotent transaction boundary so retries, duplicate submissions, or a voice/text race cannot double-apply points. If the actor response fails after a committed result, retry its delivery or use an appropriate authored fallback without scoring again.

Validate evaluator output against a schema containing the expected turn/state version, evidence, score proposals, routine candidate and confidence, and allowed intent categories. Clamp deltas, reject unknown IDs and impossible transitions, and require rule-level validation for an invitation or ending.

Player dialogue is untrusted scene content, never an instruction to change the evaluator, reveal hidden state, overwrite a personality, or award a win. The actor cannot disclose hidden rubric text or invent that consent was granted. Keep model secrets and authoritative challenge state on the server in live mode.

Use separate model contexts for actor and evaluator even if they use the same provider. Configure providers through a replaceable server adapter. Use available official documentation for implementation details and choose supported versions instead of inventing API capabilities.

If live model access is unavailable, finish everything that can be implemented and tested, provide a clearly labeled authored demo mode, and identify the exact missing configuration. Do not label keyword matching or canned responses as live AI, and do not claim the requested AI game is complete until the live path has been exercised.

## 14. Technical implementation

Preserve an existing project's supported stack. For a new project, use TypeScript, a component-based web interface, and a real WebGL scene renderer; React with Three.js or an equivalent supported stack is an appropriate default. Keep the engine, encounter data, UI, rendering, and AI adapters separate enough to test independently.

Implement typed dialogue first as a reliable baseline. Add speech input and spoken NPC responses where the environment supports them. Request microphone access only when activated, provide transcripts and mute controls, and retain typed play if permission is declined. Animate talking, listening, amusement, uncertainty, disengagement, and interruption using available rigging; add believable gaze and posture changes.

Optimize the compact environment with sensible asset budgets, LOD or equivalent detail management, appropriate textures, controlled lighting, and scalable rendering quality. Aim for smooth desktop play and usable mobile play, then report measured results for the environment actually tested. Test the smallest supported viewport as well as desktop.

Keep loading, awaiting-response, reconnecting, and failure states readable. An API outage must not look like the woman rejecting the player. Preserve entered text and allow a safe retry. Store progress through the environment's supported persistence; clearly distinguish device-local saves from account-backed saves. Do not store raw microphone recordings by default.

Provide the minimum configuration and run instructions needed to operate the game. Avoid adding monetization, social feeds, a large open world, or real-person data to the first release.

## 15. Build order and acceptance

Work in coherent milestones and keep the game playable as scope expands:

1. Read the project, Dream Loop, and source material. Establish the encounter schema and art target.
2. Build the polished lounge slice and one complete Mara encounter, including evaluation, feedback, a routine, recovery, and a reachable ending.
3. Validate that full loop, then add the remaining three playable women using the same engine.
4. Finish routine progression, selectable difficulty, the Canadian newcomer scenario, interruptions, coach, replay, settings, and persistence.
5. Complete visual iteration, responsive checks, live AI validation, and supported delivery.

Do not stop at the first slice and call it the complete requested game. Use the slice to expose implementation problems before multiplying content. If a material capability is unavailable, clearly identify what remains incomplete.

Minimum acceptance criteria:

- The player can enter the lounge, navigate, select an adult character, and converse using original text.
- Four principal NPCs have distinct identities and playable authored encounter paths.
- The actor responds to the actual conversation, remembers relevant within-run facts, and obeys committed events.
- Each completed turn produces bounded feedback and exactly one state update.
- Semantically equivalent good responses can pass; irrelevant or repeated responses cannot farm advancement.
- Routine mastery and suitability are separate; suitable execution, wrong-context use, and backfire can all be demonstrated.
- A weak response can create a recovery opportunity, and recovery can actually work.
- A clear rejection keeps the encounter closed.
- At least one reachable path leads to each principal ending type, including leaving together by mutual agreement.
- Practice replay restores the full checkpoint, including seed, history, and NPC facts.
- Chad, Normal, Hard, and Epic settings change authored encounter conditions; the evaluator's competence rubric remains consistent.
- Avatars are available across difficulty settings. The Canadian newcomer scenario has viable positive routes, and an authored biased rejection is not scored as player incompetence.
- Progress persists as documented and a new run resets only the intended state.
- Joke notifications cannot alter authoritative results.
- No credentials or secret model configuration are shipped to the browser.
- Duplicate submissions, malformed model output, contradictory actor dialogue, and provider failures have safe, tested behavior.
- Core controls work with keyboard and touch; text remains readable and NPC faces unobstructed.
- The final appearance has been compared with the approved target, and performance is reported honestly.

Use focused engine tests and representative live playthroughs for these behaviors. Do not spend time testing trivial copy or matching implementation details with tautological tests. Test good paraphrases, uncertain responses, repeated routine spam, a contradictory story, a clean refusal, a successful recovery, and an attempt to instruct the AI to change the score.

Deliver the playable project through the environment's normal workflow, with a brief explanation of what is complete, how to try it, and any material limitations. Include the source, content data, asset credits, and configuration documentation. Use the supported hosting workflow and audience; do not broaden access or purchase services without authorization.

## 16. Source register

These were checked during the initial research pass on 7 September 2026. Review the relevant content; verify any new terminology. Public access can change. Report inaccessible material rather than inventing what it says. Reading an excerpt does not mean the entire book was reviewed.

- **R1 — Mystery with Chris Odom, The Mystery Method.** Publisher-hosted excerpt for the author's staged model, status terminology, and description of canned material: https://us.macmillan.com/books/9780312360115/themysterymethod/
- **R2 — Socialkenny, PUA Jargon List.** Practitioner glossary with informal and sometimes derogatory definitions: https://kennyspuathoughts.wordpress.com/pua-acronymns/
- **R3 — Renaissan, My Routines Collection, 28 October 2012.** Routine organization and practice approach: https://whetyourwoman.com/2012/10/28/my-routines-collection/
- **R4 — Krauser, Frame control battles in Facebook, 9 May 2011.** Author-annotated anecdote illustrating his frame and push-pull vocabulary: https://krauserpua.com/2011/05/09/frame-control-battles-in-facebook/
- **R5 — Skills, How to deal with women tests aka shit tests!, 23 August 2014.** Practitioner discussion of tests, response patterns, and mistaking disinterest for a test: https://www.theskillsmethod.com/deal-women-tests-aka-shit-tests/
- **R6 — Nick Notas, The Fine Art Of Fun, Flirtatious Teasing.** Distinguishes playful teasing, demeaning remarks, and overuse: https://www.nicknotas.com/blog/the-fine-art-of-fun-flirtatious-teasing/
- **R7 — Nick Notas, 3 Times I Realized Being A Pickup Artist Was Really Weird.** First-person retrospective useful for status competition and guru satire: https://www.nicknotas.com/blog/pickup-artist-really-weird/
- **R8 — Alexander Prophet, About.** Commercial self-description of personalized routine construction: https://puaopeners.ca/about/
- **R9 — Rollo Tomassi, The Art of AMOG, 2 February 2015.** Direct source for his alpha/beta and rival archetypes, including locally influential and likable rivals: https://therationalmale.com/2015/02/02/the-art-of-amog/

The desired result is a visually convincing lounge game where choosing and delivering a move matters, setbacks create tension, characters remain distinct, and the inflated PUA terminology supplies the comedy.
