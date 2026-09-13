import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameProvider, useGame } from './state/game';
import { Scene } from './scene/Scene';
import { Hud } from './hud/Hud';
import { Menu } from './hud/Menu';
import { Debrief } from './hud/Debrief';
import { speak, stopSpeaking } from './hud/speech';

function detectQuality(setting: 'auto' | 'high' | 'medium' | 'low'): 'high' | 'medium' | 'low' {
	if (setting !== 'auto') return setting;
	const cores = navigator.hardwareConcurrency ?? 4;
	const mobile = /Mobi|Android/i.test(navigator.userAgent);
	if (mobile) return 'low';
	return cores >= 8 ? 'high' : 'medium';
}

function Game() {
	const game = useGame();
	const [locked, setLocked] = useState(false);
	const [fps, setFps] = useState<number | null>(null);
	const walkRef = useRef(false);
	const isTouch = useMemo(() => typeof window !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window), []);
	const quality = detectQuality(game.save.settings.quality);
	const reducedMotion = game.save.settings.reducedMotion;
	const lastNpc = [...game.transcript].reverse().find((l) => l.kind === 'npc');

	// Spoken audio is optional; the mouth animation is driven by the line token inside the scene.
	useEffect(() => {
		if (!lastNpc || !game.save.settings.speech) return;
		speak(lastNpc.text);
		return () => stopSpeaking();
	}, [lastNpc, game.save.settings.speech]);
	const speechDuration = lastNpc ? Math.min(9, 0.7 + lastNpc.text.length * 0.045) : 0;

	// Development hook so automated screenshots can drive the game without pointer lock.
	useEffect(() => {
		if (!import.meta.env.DEV) return;
		const w = window as unknown as { __afterHours?: { approach: (id: string) => void } };
		w.__afterHours = { approach: (id: string) => void game.approach(id) };
		return () => {
			delete w.__afterHours;
		};
	}, [game]);

	const requestLock = useCallback(() => {
		const canvas = document.querySelector('canvas');
		canvas?.requestPointerLock?.();
	}, []);

	const sceneMode = game.phase === 'menu' ? 'menu' : game.exitSequence ? 'exit' : game.phase === 'lounge' ? 'lounge' : 'conversation';
	const characterId = game.phase === 'menu' ? null : game.characterId;

	return (
		<div className="app" onClick={game.phase === 'lounge' && !locked && !isTouch ? requestLock : undefined}>
			<Scene
				mode={sceneMode}
				characterId={characterId}
				expression={game.expression}
				gesture={game.gesture}
				closedCharacters={game.run?.closedCharacters ?? []}
				quality={quality}
				reducedMotion={reducedMotion}
				speechToken={lastNpc?.id ?? null}
				speechDuration={speechDuration}
				walkRef={walkRef}
				onSelectCharacter={(id) => {
					if (game.phase === 'lounge' && !game.awaiting) void game.approach(id);
				}}
				onLockChange={setLocked}
				onFps={setFps}
			/>
			{game.phase === 'menu' ? <Menu /> : null}
			{game.phase === 'lounge' || game.phase === 'conversation' ? <Hud locked={locked} walkRef={walkRef} requestLock={requestLock} isTouch={isTouch} fps={fps} /> : null}
			{game.phase === 'debrief' ? <Debrief /> : null}
			{game.exitSequence ? (
				<div className="fade">
					<p>Outside, the air is cooler and the city is louder. You walk. That is the whole scene.</p>
				</div>
			) : null}
			{game.awaiting && game.phase === 'lounge' ? <div className="approaching">Walking over...</div> : null}
		</div>
	);
}

export function App() {
	return (
		<GameProvider>
			<Game />
		</GameProvider>
	);
}
