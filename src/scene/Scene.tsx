import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CHARACTERS } from 'shared/game/content/characters';
import type { Expression, Gesture } from 'shared/game/types';
import { Lounge } from './Lounge';
import { CharacterModel } from './Character';
import { PlayerControls } from './Player';
import { CONVERSATION_SEATS, PLACEMENTS } from './layout';

export interface SceneProps {
	mode: 'lounge' | 'conversation' | 'exit' | 'menu';
	characterId: string | null;
	expression: Expression;
	gesture: Gesture;
	closedCharacters: string[];
	quality: 'high' | 'medium' | 'low';
	reducedMotion: boolean;
	speechToken: string | null;
	speechDuration: number;
	walkRef: React.MutableRefObject<boolean>;
	onSelectCharacter: (id: string) => void;
	onLockChange: (locked: boolean) => void;
	onFps?: (fps: number) => void;
}

function CameraTarget({ onReady }: { onReady: (v: THREE.Vector3) => void }) {
	const { camera } = useThree();
	useEffect(() => {
		onReady(camera.position);
	}, [camera, onReady]);
	return null;
}

function FpsProbe({ onFps }: { onFps?: (fps: number) => void }) {
	const frames = useRef(0);
	const last = useRef(0);
	useEffect(() => {
		let raf = 0;
		last.current = performance.now();
		const tick = () => {
			frames.current += 1;
			const now = performance.now();
			if (now - last.current >= 1000) {
				onFps?.(Math.round((frames.current * 1000) / (now - last.current)));
				frames.current = 0;
				last.current = now;
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [onFps]);
	return null;
}

const GUESTS = [
	{ id: 'guest-a', position: [-4.7, 0, -3.3] as [number, number, number], rotationY: Math.PI * 0.3, appearance: { hair: 'short', hairColor: '#2b1d14', skin: '#c99a76', outfit: 'shirt', outfitColor: '#2c3446', accentColor: '#000' } },
	{ id: 'guest-b', position: [-3.5, 0, -3.9] as [number, number, number], rotationY: Math.PI * 0.05, appearance: { hair: 'long', hairColor: '#4a2e1a', skin: '#e8c8ae', outfit: 'dress', outfitColor: '#5c1f2e', accentColor: '#000' } },
	{ id: 'guest-c', position: [3.9, 0, 1.9] as [number, number, number], rotationY: Math.PI * 1.25, appearance: { hair: 'cropped', hairColor: '#111', skin: '#7b4a30', outfit: 'shirt', outfitColor: '#1f2a24', accentColor: '#000' } },
	{ id: 'dani', position: [-4.0, 0, 2.6] as [number, number, number], rotationY: Math.PI * 0.05, appearance: { hair: 'long', hairColor: '#1a1a1a', skin: '#d8a889', outfit: 'blazer', outfitColor: '#3a3a3a', accentColor: '#000' } },
];

export function Scene(props: SceneProps) {
	const { mode, characterId, expression, gesture, closedCharacters, quality, reducedMotion, speechToken, speechDuration, walkRef, onSelectCharacter, onLockChange, onFps } = props;
	const [cameraPos, setCameraPos] = useState<THREE.Vector3 | null>(null);
	const dpr = useMemo<[number, number]>(() => (quality === 'high' ? [1, 2] : quality === 'medium' ? [1, 1.5] : [0.75, 1]), [quality]);
	const guestCharacters = useMemo(
		() =>
			GUESTS.map((g) => ({
				...CHARACTERS.dev,
				id: g.id,
				name: g.id,
				appearance: g.appearance,
				placement: { position: g.position, rotationY: g.rotationY },
			})),
		[],
	);

	return (
		<Canvas
			shadows={quality === 'high'}
			dpr={dpr}
			camera={{ fov: 52, near: 0.05, far: 80, position: [0.6, 1.62, 2.4] }}
			gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.45 }}
			onCreated={({ gl }) => {
				gl.setClearColor('#0b0f16');
			}}
			style={{ position: 'absolute', inset: 0 }}
		>
			<fog attach="fog" args={['#0d1119', 12, 40]} />
			<CameraTarget onReady={setCameraPos} />
			<FpsProbe onFps={onFps} />
			<Suspense fallback={null}>
				<Lounge quality={quality} />
			</Suspense>
			{Object.entries(PLACEMENTS).map(([id, placement]) => {
				const character = CHARACTERS[id];
				if (!character) return null;
				const active = characterId === id && mode !== 'lounge' && mode !== 'menu';
				const selectable = mode === 'lounge' && character.role === 'principal' && !closedCharacters.includes(id);
				const focus = CONVERSATION_SEATS[id];
				const look = active ? cameraPos : focus ? cameraPos : null;
				const standing = active && gesture === 'stand_up';
				return (
					<CharacterModel
						key={id}
						character={character}
						position={placement.position}
						rotationY={placement.rotationY}
						seated={placement.seated && !standing}
						expression={active ? expression : closedCharacters.includes(id) ? 'cold' : 'neutral'}
						gesture={active ? gesture : closedCharacters.includes(id) ? 'turn_away' : id === 'sienna' ? 'check_phone' : id === 'elise' ? 'lean_back' : 'none'}
						lookTarget={look}
						engaged={active}
						detail={quality === 'low' ? 'low' : placement.detail}
						onSelect={selectable ? () => onSelectCharacter(id) : undefined}
						highlight={selectable}
						reducedMotion={reducedMotion}
						speechToken={active ? speechToken : null}
						speechDuration={speechDuration}
					/>
				);
			})}
			{guestCharacters.map((g) => (
				<CharacterModel key={g.id} character={g} position={g.placement.position} rotationY={g.placement.rotationY} seated detail="low" reducedMotion={reducedMotion} gesture={g.id === 'dani' ? 'check_phone' : 'sip_drink'} expression="amused" />
			))}
			<PlayerControls mode={mode} characterId={characterId} reducedMotion={reducedMotion} walkRef={walkRef} onLockChange={onLockChange} />
		</Canvas>
	);
}
