import { useEffect, useRef, useState } from 'react';
import { getCharacter } from 'shared/game/content/characters';
import { SCENARIOS } from 'shared/game/content/scenarios';
import { STAGE_COUNT } from 'shared/game/content/graph';
import { useGame } from '../state/game';
import { listenOnce, speechInputSupported } from './speech';
import { CoachPanel, CodexPanel, PausePanel, RoutinesPanel, SettingsPanel } from './Panels';

interface HudProps {
	locked: boolean;
	walkRef: React.MutableRefObject<boolean>;
	requestLock: () => void;
	isTouch: boolean;
	fps: number | null;
}

function sign(n: number): string {
	return n > 0 ? `+${n}` : `${n}`;
}

export function Hud({ locked, walkRef, requestLock, isTouch, fps }: HudProps) {
	const game = useGame();
	const run = game.run;
	const encounter = run?.encounter;
	const inConversation = game.phase === 'conversation';
	const character = game.characterId ? getCharacter(game.characterId) : null;
	const [listening, setListening] = useState(false);
	const [micError, setMicError] = useState<string | null>(null);
	const stopRef = useRef<() => void>(() => {});
	const inputRef = useRef<HTMLTextAreaElement>(null);
	const lastLine = [...game.transcript].reverse().find((l) => l.kind !== 'player');
	const lastPlayer = [...game.transcript].reverse().find((l) => l.kind === 'player');
	const closed = encounter?.closed ?? false;

	useEffect(() => {
		if (inConversation && !game.awaiting && !closed) {
			inputRef.current?.focus();
		}
	}, [inConversation, game.awaiting, closed]);

	const submit = () => {
		if (!game.pendingText.trim() || game.awaiting) return;
		void game.sendTurn(game.pendingText);
	};

	const toggleMic = () => {
		if (listening) {
			stopRef.current();
			setListening(false);
			return;
		}
		setMicError(null);
		setListening(true);
		stopRef.current = listenOnce(
			(text) => game.setPendingText(text),
			(error) => {
				setListening(false);
				if (error) setMicError(error);
			},
		);
	};

	const stage = encounter?.stage ?? 1;
	const provider = game.provider;

	return (
		<div className="hud">
			<div className="hud-top">
				<div className="hud-title">
					<span className="brand">AFTER HOURS</span>
					<span className="mode">
						{run ? `${run.mode === 'practice' ? 'PRACTICE' : 'CHALLENGE'} · ${SCENARIOS[run.difficulty].name.split(':')[0].toUpperCase()}` : ''}
						{provider === 'demo' ? ' · AUTHORED DEMO' : ''}
					</span>
				</div>
				{inConversation && encounter ? (
					<div className="hud-stage">
						<span className="stage-round">
							ROUND {String(stage).padStart(2, '0')} / {String(STAGE_COUNT).padStart(2, '0')}
						</span>
						<span className="stage-title">{encounter.stageTitle}</span>
					</div>
				) : (
					<div className="hud-stage">
						<span className="stage-title">{game.phase === 'lounge' ? (isTouch ? 'DRAG TO LOOK · TAP SOMEONE TO APPROACH' : locked ? 'WASD TO MOVE · CLICK SOMEONE TO APPROACH · ESC TO RELEASE' : 'CLICK THE LOUNGE TO LOOK AROUND') : ''}</span>
					</div>
				)}
				<div className="hud-feedback">
					{game.lastFeedback ? (
						<div className={`feedback ${game.lastFeedback.band}`}>
							<div className="feedback-scores">
								<span title="Composure">C {sign(game.lastFeedback.scores.composure)}</span>
								<span title="Connection">N {sign(game.lastFeedback.scores.connection)}</span>
								<span title="Calibration">L {sign(game.lastFeedback.scores.calibration)}</span>
								<span className="band">{game.lastFeedback.band.toUpperCase()}</span>
							</div>
							<p className="feedback-evidence">"{game.lastFeedback.evidence}"</p>
							<p className="feedback-why">{game.lastFeedback.explanation}</p>
							{game.lastFeedback.attribution === 'npc_bias' ? <p className="feedback-bias">That was about them. Scored on composure only.</p> : null}
						</div>
					) : null}
				</div>
			</div>

			<div className="hud-notes" aria-live="polite">
				{game.notifications.map((n) => (
					<button key={n.id} className={`note ${n.tone}`} onClick={() => game.dismissNotification(n.id)}>
						{n.text}
					</button>
				))}
			</div>

			<div className="hud-bottom">
				{inConversation && character ? (
					<>
						<div className="caption">
							{game.awaiting ? (
								<p className="caption-line thinking">
									<span className="speaker">{character.name}</span> is listening...
								</p>
							) : lastLine ? (
								<p className="caption-line">
									<span className="speaker">{lastLine.speaker}</span> {lastLine.text}
								</p>
							) : (
								<p className="caption-line muted">You walk over. Say something.</p>
							)}
							{lastPlayer && !game.awaiting ? <p className="caption-you">You: {lastPlayer.text}</p> : null}
						</div>
						{game.error ? (
							<div className="hud-error">
								<span>{game.error}</span>
								<button className="chip small" onClick={() => void game.retry()}>
									Retry
								</button>
								<button className="chip small" onClick={() => game.clearError()}>
									Dismiss
								</button>
							</div>
						) : null}
						{micError ? <div className="hud-error">{micError}</div> : null}
						{closed ? (
							<div className="closed-row">
								<span>{game.ending === 'leave_together' ? 'You leave together.' : 'This conversation is over.'}</span>
								<button className="primary small" onClick={() => game.finishEncounter()}>
									Debrief
								</button>
							</div>
						) : (
							<div className="input-row">
								<textarea
									ref={inputRef}
									value={game.pendingText}
									onChange={(e) => game.setPendingText(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter' && !e.shiftKey) {
											e.preventDefault();
											submit();
										}
									}}
									placeholder={`Say something to ${character.name}`}
									maxLength={600}
									rows={1}
									disabled={game.awaiting}
								/>
								{game.save.settings.voice && speechInputSupported() ? (
									<button className={listening ? 'icon mic on' : 'icon mic'} onClick={toggleMic} aria-label="Microphone" title="Speak instead of typing">
										{listening ? '●' : '🎙'}
									</button>
								) : null}
								<button className="send" onClick={submit} disabled={game.awaiting || !game.pendingText.trim()}>
									{game.awaiting ? '...' : 'Say it'}
								</button>
							</div>
						)}
					</>
				) : null}
				{game.phase === 'lounge' && !locked && !isTouch ? (
					<button className="lock-hint" onClick={requestLock}>
						Click to look around
					</button>
				) : null}
				{game.phase === 'lounge' && isTouch ? (
					<button
						className="walk"
						onPointerDown={() => {
							walkRef.current = true;
						}}
						onPointerUp={() => {
							walkRef.current = false;
						}}
						onPointerLeave={() => {
							walkRef.current = false;
						}}
					>
						Walk
					</button>
				) : null}
				<div className="controls">
					<button className="ctl" onClick={() => game.openPanel('pause')}>
						Pause
					</button>
					{inConversation ? (
						<button className="ctl" onClick={() => game.finishEncounter()}>
							Replay
						</button>
					) : null}
					<button className="ctl" onClick={() => game.openPanel('coach')}>
						Coach{game.save.settings.coachMuted ? ' (muted)' : ''}
					</button>
					<button className="ctl" onClick={() => game.openPanel('routines')}>
						Routines
					</button>
					<button className="ctl" onClick={() => game.openPanel('codex')}>
						Codex
					</button>
					<button className="ctl" onClick={() => game.openPanel('settings')}>
						Settings
					</button>
					{fps !== null ? <span className="fps">{fps} fps</span> : null}
				</div>
			</div>

			{game.panel === 'coach' ? <CoachPanel /> : null}
			{game.panel === 'routines' ? <RoutinesPanel /> : null}
			{game.panel === 'codex' ? <CodexPanel /> : null}
			{game.panel === 'settings' ? <SettingsPanel /> : null}
			{game.panel === 'pause' ? <PausePanel /> : null}
		</div>
	);
}
