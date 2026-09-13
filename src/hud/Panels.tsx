import { CODEX } from 'shared/game/content/codex';
import { ROUTINES } from 'shared/game/content/routines';
import { getNode } from 'shared/game/content/graph';
import { useGame } from '../state/game';
import { speechInputSupported, speechOutputSupported } from './speech';

function PanelFrame({ title, children }: { title: string; children: React.ReactNode }) {
	const game = useGame();
	return (
		<div className="panel-backdrop" onClick={() => game.openPanel('none')}>
			<div className="panel" onClick={(e) => e.stopPropagation()}>
				<header>
					<h2>{title}</h2>
					<button className="icon" onClick={() => game.openPanel('none')} aria-label="Close">
						×
					</button>
				</header>
				<div className="panel-body">{children}</div>
			</div>
		</div>
	);
}

export function CoachPanel() {
	const game = useGame();
	const muted = game.save.settings.coachMuted;
	const encounter = game.run?.encounter;
	const node = encounter ? getNode(encounter.nodeId) : null;
	return (
		<PanelFrame title="Vex Sterling, Certified Guru (self-certified)">
			<p className="coach-disclaimer">Vex is satire. He cannot score, reopen, or explain the actual rules. The debrief is the reliable record.</p>
			<button className="chip" onClick={() => void game.toggleCoach()}>
				{muted ? 'Unmute Vex' : 'Mute Vex'}
			</button>
			{game.run?.mode === 'practice' && node ? (
				<section className="coach-cues">
					<h3>Practice cues (reliable, from the scene)</h3>
					<p>
						<strong>Objective:</strong> {node.objective}
					</p>
					<ul>
						{node.cues.map((c) => (
							<li key={c}>{c}</li>
						))}
					</ul>
					<p className="hint">Admissible approaches: {node.strategies.join(' ')}</p>
				</section>
			) : null}
			<section>
				<h3>Vex says</h3>
				{muted ? <p className="hint">Muted. Vex is sulking in the bathroom line.</p> : game.coachLines.length === 0 ? <p className="hint">Nothing yet. He is adjusting his hat.</p> : null}
				{!muted ? game.coachLines.map((line, i) => <p key={i} className="coach-line">{line}</p>) : null}
			</section>
		</PanelFrame>
	);
}

export function RoutinesPanel() {
	const game = useGame();
	const equipped = game.run?.equipped ?? game.save.settings.equipped;
	return (
		<PanelFrame title="Routines">
			<p className="hint">Mastery improves feedback and unlocks harder variants. It never makes the wrong tactic work.</p>
			{Object.values(ROUTINES).map((r) => {
				const m = game.save.mastery[r.id];
				const unlocked = game.save.unlocked.includes(r.id);
				return (
					<article key={r.id} className={equipped.includes(r.id) ? 'routine-card equipped' : 'routine-card'}>
						<header>
							<strong>{r.name}</strong>
							<span>{equipped.includes(r.id) ? 'Equipped' : unlocked ? 'Available' : 'Locked'}</span>
						</header>
						<p>{r.description}</p>
						<p className="hint">Beats: {r.beats.join('; ')}</p>
						<p className="hint">Fits: {r.suitableKinds.join(', ')} nodes, stages {r.minStage} to {r.maxStage}. Backfire: {r.backfire}</p>
						<p className="hint">Mastery {m?.level ?? 0}/3 ({m?.suitableExecutions ?? 0} suitable executions)</p>
					</article>
				);
			})}
		</PanelFrame>
	);
}

export function CodexPanel() {
	return (
		<PanelFrame title="Codex">
			<p className="hint">Historical community meanings, the source they were checked against, and how this game adapts them. Claims in the sources are claims, not findings.</p>
			{CODEX.map((entry) => (
				<article key={entry.term} className="codex-entry">
					<strong>{entry.term}</strong> <span className="source">{entry.source}</span>
					<p>{entry.meaning}</p>
					<p className="hint">In After Hours: {entry.adaptation}</p>
				</article>
			))}
		</PanelFrame>
	);
}

export function SettingsPanel() {
	const game = useGame();
	const s = game.save.settings;
	return (
		<PanelFrame title="Settings">
			<label className="row">
				<span>Reduce camera motion</span>
				<input type="checkbox" checked={s.reducedMotion} onChange={(e) => game.updateSettings({ reducedMotion: e.target.checked })} />
			</label>
			<label className="row">
				<span>Render quality</span>
				<select value={s.quality} onChange={(e) => game.updateSettings({ quality: e.target.value as typeof s.quality })}>
					<option value="auto">Auto</option>
					<option value="high">High</option>
					<option value="medium">Medium</option>
					<option value="low">Low</option>
				</select>
			</label>
			<label className="row">
				<span>Spoken character lines {speechOutputSupported() ? '' : '(unavailable here)'}</span>
				<input type="checkbox" disabled={!speechOutputSupported()} checked={s.speech} onChange={(e) => game.updateSettings({ speech: e.target.checked })} />
			</label>
			<label className="row">
				<span>Microphone button {speechInputSupported() ? '' : '(unavailable here)'}</span>
				<input type="checkbox" disabled={!speechInputSupported()} checked={s.voice} onChange={(e) => game.updateSettings({ voice: e.target.checked })} />
			</label>
			<label className="row">
				<span>Mute the coach</span>
				<input type="checkbox" checked={s.coachMuted} onChange={() => void game.toggleCoach()} />
			</label>
			<p className="hint">Saves are stored in this browser only. Microphone audio is never stored. Press Esc to release the mouse at any time.</p>
			<h3>Runs on this device</h3>
			{game.save.runs.length === 0 ? <p className="hint">None yet.</p> : null}
			{game.save.runs
				.slice()
				.reverse()
				.slice(0, 8)
				.map((r) => (
					<p key={r.runId} className="hint">
						{new Date(r.finishedAt).toLocaleDateString()} · {r.difficulty} · {r.mode} · {r.encounters.map((e) => `${e.characterId}: ${e.ending.replace('_', ' ')}`).join(', ')}
					</p>
				))}
			<h3>Achievements</h3>
			<p className="hint">{game.save.achievements.length ? game.save.achievements.join(' · ') : 'None yet.'}</p>
		</PanelFrame>
	);
}

export function PausePanel() {
	const game = useGame();
	return (
		<PanelFrame title="Paused">
			<p className="hint">The lounge waits. Nobody is timing you unless you asked for a timed challenge.</p>
			<div className="stack">
				<button className="chip" onClick={() => game.openPanel('none')}>
					Resume
				</button>
				{game.phase === 'conversation' ? (
					<button className="chip" onClick={() => game.finishEncounter()}>
						Leave this conversation and see the debrief
					</button>
				) : null}
				<button className="chip" onClick={() => game.toMenu()}>
					End the night and return to the menu
				</button>
			</div>
		</PanelFrame>
	);
}
