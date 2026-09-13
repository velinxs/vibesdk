import { getNode } from 'shared/game/content/graph';
import { STAGE_TITLES } from 'shared/game/content/graph';
import { getCharacter } from 'shared/game/content/characters';
import { getScenario } from 'shared/game/content/scenarios';
import { useGame } from '../state/game';
import { achievementFor } from '../game/save';

function sign(n: number): string {
	return n > 0 ? `+${n}` : `${n}`;
}

export function Debrief() {
	const game = useGame();
	const run = game.run;
	const encounter = run?.encounter;
	if (!run || !encounter || !game.characterId) {
		return null;
	}
	const character = getCharacter(game.characterId);
	const scenario = getScenario(run.difficulty);
	const history = encounter.history;
	const turningPoints = [...history].sort((a, b) => Math.abs(b.total) - Math.abs(a.total)).slice(0, 3);
	const transitions = history.filter((r) => r.transitioned);
	const biased = history.filter((r) => r.attribution === 'npc_bias');
	const visited = Array.from(new Set(history.map((r) => r.nodeId)));
	const ending = encounter.ending ?? game.ending;
	const remaining = ['mara', 'sienna', 'camille', 'elise'].filter((id) => !run.closedCharacters.includes(id));
	return (
		<div className="debrief">
			<div className="debrief-card">
				<header>
					<p className="eyebrow">AFTER-ACTION REPLAY</p>
					<h1>
						{character.name}: {ending ? ending.replace('_', ' ') : 'unfinished'}
					</h1>
					{ending ? <p className="achievement">Achievement: {achievementFor(ending)}</p> : null}
					{encounter.authoredRejectionReason ? <p className="hint">Author's note on this ending: {encounter.authoredRejectionReason} (In real life the same words do not have one meaning.)</p> : null}
				</header>

				<section>
					<h2>Starting conditions (not your play)</h2>
					<ul>
						{scenario.modifiers.map((m) => (
							<li key={m}>{m}</li>
						))}
					</ul>
					{biased.length > 0 ? (
						<p className="bias-note">
							{biased.length} moment{biased.length > 1 ? 's' : ''} where another character's prejudice shaped the scene. Those turns were scored on your composure only and cost no interest or trust.
						</p>
					) : null}
				</section>

				<section>
					<h2>Turning points</h2>
					<ol>
						{turningPoints.map((r) => (
							<li key={r.turnId}>
								Turn {r.turn}, {STAGE_TITLES[r.stage]}: <strong>{r.band}</strong> on "{r.evidence}". {r.explanation}
							</li>
						))}
					</ol>
				</section>

				<section>
					<h2>Stage transitions</h2>
					<p className="hint">{transitions.length === 0 ? 'The conversation never left its first stage.' : transitions.map((r) => `${STAGE_TITLES[r.stage]} to ${getNode(r.nextNodeId).title} (turn ${r.turn})`).join(' · ')}</p>
				</section>

				<section>
					<h2>Transcript with evidence</h2>
					<div className="transcript">
						{history.map((r) => (
							<article key={r.turnId} className={`turn ${r.band}`}>
								<div className="turn-head">
									<span>
										Turn {r.turn} · {STAGE_TITLES[r.stage]} · {r.intent.replace('_', ' ')}
									</span>
									<span className="scores">
										C {sign(r.scores.composure)} · N {sign(r.scores.connection)} · L {sign(r.scores.calibration)} · {r.band}
										{r.attribution === 'npc_bias' ? ' · her friend, not you' : ''}
									</span>
								</div>
								<p className="player">You: {r.playerText}</p>
								{r.interjection ? (
									<p className="interjection">
										{r.interjection.speakerName}: {r.interjection.line}
									</p>
								) : null}
								<p className="npc">
									{character.name}: {r.npcLine}
								</p>
								<p className="evidence">
									Evidence: "{r.evidence}". {r.explanation}
									{r.routine ? ` Routine: ${r.routine.label}` : ''}
								</p>
								{run.mode === 'practice' && game.run?.encounter ? (
									<button className="chip small" onClick={() => void game.rewind(r.turn)}>
										Replay from turn {r.turn}
									</button>
								) : null}
							</article>
						))}
					</div>
				</section>

				<section>
					<h2>Alternatives worth trying</h2>
					<p className="hint">These are alternatives inside the game, not predictions about real people.</p>
					<ul>
						{visited.flatMap((id) => getNode(id).alternatives.slice(0, 2).map((a) => ({ id, a }))).map(({ id, a }) => (
							<li key={`${id}-${a}`}>
								<em>{getNode(id).title}:</em> {a}
							</li>
						))}
					</ul>
				</section>

				<div className="stack">
					{remaining.length > 0 ? (
						<button className="primary" onClick={() => game.backToLounge()}>
							Back to the lounge ({remaining.length} conversation{remaining.length > 1 ? 's' : ''} still open)
						</button>
					) : null}
					<button className="chip" onClick={() => game.toMenu()}>
						End the night
					</button>
				</div>
			</div>
		</div>
	);
}
