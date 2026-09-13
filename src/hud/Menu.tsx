import { AVATARS } from 'shared/game/content/scenarios';
import { SCENARIOS } from 'shared/game/content/scenarios';
import { ROUTINES, MAX_EQUIPPED } from 'shared/game/content/routines';
import type { Difficulty, Mode } from 'shared/game/types';
import { useGame } from '../state/game';

const DIFFICULTIES: Difficulty[] = ['chad', 'normal', 'hard', 'epic'];

export function Menu() {
	const game = useGame();
	const { settings } = game.save;
	const equipped = settings.equipped;
	const toggleRoutine = (id: string) => {
		if (equipped.includes(id)) {
			game.updateSettings({ equipped: equipped.filter((r) => r !== id) });
		} else if (equipped.length < MAX_EQUIPPED) {
			game.updateSettings({ equipped: [...equipped, id] });
		}
	};
	const newcomerScenario = settings.difficulty === 'epic';
	return (
		<div className="menu">
			<div className="menu-card">
				<header className="menu-header">
					<h1>AFTER HOURS</h1>
					<p className="menu-tag">A rooftop lounge. Four conversations. One deeply unqualified coach.</p>
					<p className="menu-provider">
						{game.provider === 'live' ? `Live characters: ${game.model ?? 'Workers AI'}` : game.provider === 'demo' ? 'Authored demo mode: no live model configured. Characters use scripted lines and a heuristic evaluator.' : 'Checking the server...'}
					</p>
				</header>
				<section>
					<h2>Mode</h2>
					<div className="chips">
						{(['practice', 'challenge'] as Mode[]).map((mode) => (
							<button key={mode} className={settings.mode === mode ? 'chip active' : 'chip'} onClick={() => game.updateSettings({ mode })}>
								{mode === 'practice' ? 'Practice' : 'Challenge'}
							</button>
						))}
					</div>
					<p className="hint">{settings.mode === 'practice' ? 'Cues visible, coach can explain, replay from any turn. The same scenario seed on every retry.' : 'A full lounge run. No rewind, live feedback, no answer hints.'}</p>
				</section>
				<section>
					<h2>Difficulty</h2>
					<div className="chips">
						{DIFFICULTIES.map((d) => (
							<button key={d} className={settings.difficulty === d ? 'chip active' : 'chip'} onClick={() => game.updateSettings({ difficulty: d })}>
								{SCENARIOS[d].name}
							</button>
						))}
					</div>
					<p className="hint">{SCENARIOS[settings.difficulty].description}</p>
					<ul className="modifiers">
						{SCENARIOS[settings.difficulty].modifiers.map((m) => (
							<li key={m}>{m}</li>
						))}
					</ul>
				</section>
				<section>
					<h2>You</h2>
					<div className="avatars">
						{Object.values(AVATARS).map((a) => (
							<button key={a.id} className={settings.avatarId === a.id ? 'avatar active' : 'avatar'} onClick={() => game.updateSettings({ avatarId: a.id })}>
								<strong>{a.name}</strong>
								<span>{a.description}</span>
								{newcomerScenario && a.background === 'newcomer' ? <em>New City, No Wingman storyline</em> : null}
							</button>
						))}
					</div>
				</section>
				<section>
					<h2>
						Loadout <small>{equipped.length}/{MAX_EQUIPPED}</small>
					</h2>
					<div className="routine-grid">
						{Object.values(ROUTINES).map((r) => {
							const unlocked = game.save.unlocked.includes(r.id);
							const level = game.save.mastery[r.id]?.level ?? 0;
							return (
								<button key={r.id} disabled={!unlocked} className={equipped.includes(r.id) ? 'routine active' : 'routine'} onClick={() => toggleRoutine(r.id)} title={r.description}>
									<strong>{r.name}</strong>
									<span>{unlocked ? `Mastery ${level}/3` : `Locked: mastery ${r.unlockMastery}`}</span>
								</button>
							);
						})}
					</div>
					<p className="hint">Routines augment play. A good conversation scores without them.</p>
				</section>
				{game.error ? <p className="error">{game.error}</p> : null}
				<button className="primary" onClick={() => void game.startRun()} disabled={game.awaiting}>
					{game.awaiting ? 'Opening the lounge...' : 'Enter the lounge'}
				</button>
				<p className="fineprint">Fictional characters, all adults. Follower counts and phone numbers are invented. Saves stay on this device.</p>
			</div>
		</div>
	);
}
