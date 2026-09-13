import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CONVERSATION_SEATS, EXIT, ROOM, SPAWN, BAR_CENTER, BAR_RADIUS, BAR_START, BAR_END } from './layout';

export interface PlayerControlsProps {
	mode: 'lounge' | 'conversation' | 'exit' | 'menu';
	characterId: string | null;
	reducedMotion: boolean;
	/** Set by the mobile walk button. */
	walkRef: React.MutableRefObject<boolean>;
	onLockChange?: (locked: boolean) => void;
	lookMultiplier?: number;
}

const KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function insideBar(x: number, z: number): boolean {
	const dx = x - BAR_CENTER.x;
	const dz = z - BAR_CENTER.z;
	const r = Math.hypot(dx, dz);
	const a = Math.atan2(dx, dz);
	return r < BAR_RADIUS + 1.0 && a > BAR_START - 0.15 && a < BAR_END + 0.15;
}

/**
 * First-person rig. Lounge mode: pointer-lock or touch look, WASD or walk
 * button to move. Conversation mode: glides to the seat and holds a gentle,
 * eye-level framing on the character. Exit mode: walks toward the door.
 */
export function PlayerControls({ mode, characterId, reducedMotion, walkRef, onLockChange, lookMultiplier = 1 }: PlayerControlsProps) {
	const { camera, gl } = useThree();
	const yaw = useRef(SPAWN.yaw);
	const pitch = useRef(SPAWN.pitch);
	const position = useRef(new THREE.Vector3(...SPAWN.position));
	const keys = useRef(new Set<string>());
	const locked = useRef(false);
	const touch = useRef<{ id: number; x: number; y: number } | null>(null);
	const target = useRef({ pos: new THREE.Vector3(), yaw: 0, pitch: 0 });
	const exitT = useRef(0);
	const transition = useRef({ key: '', start: 0, fromPos: new THREE.Vector3(), fromQuat: new THREE.Quaternion() });
	const settleQuat = useRef(new THREE.Quaternion());
	const tmpEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

	useEffect(() => {
		const el = gl.domElement;
		const onMove = (e: MouseEvent) => {
			if (!locked.current || mode !== 'lounge') return;
			yaw.current -= e.movementX * 0.0022 * lookMultiplier;
			pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0022 * lookMultiplier, -1.1, 1.1);
		};
		const onLock = () => {
			locked.current = document.pointerLockElement === el;
			onLockChange?.(locked.current);
		};
		const onKey = (down: boolean) => (e: KeyboardEvent) => {
			if (KEYS.has(e.code)) {
				if (down) keys.current.add(e.code);
				else keys.current.delete(e.code);
				if (mode === 'lounge' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') e.preventDefault();
			}
		};
		const onTouchStart = (e: TouchEvent) => {
			if (mode !== 'lounge') return;
			const t = e.changedTouches[0];
			touch.current = { id: t.identifier, x: t.clientX, y: t.clientY };
		};
		const onTouchMove = (e: TouchEvent) => {
			if (!touch.current || mode !== 'lounge') return;
			for (const t of Array.from(e.changedTouches)) {
				if (t.identifier !== touch.current.id) continue;
				yaw.current -= (t.clientX - touch.current.x) * 0.005 * lookMultiplier;
				pitch.current = THREE.MathUtils.clamp(pitch.current - (t.clientY - touch.current.y) * 0.005 * lookMultiplier, -1.1, 1.1);
				touch.current.x = t.clientX;
				touch.current.y = t.clientY;
			}
		};
		const onTouchEnd = () => {
			touch.current = null;
		};
		const keyDown = onKey(true);
		const keyUp = onKey(false);
		document.addEventListener('mousemove', onMove);
		document.addEventListener('pointerlockchange', onLock);
		window.addEventListener('keydown', keyDown);
		window.addEventListener('keyup', keyUp);
		el.addEventListener('touchstart', onTouchStart, { passive: true });
		el.addEventListener('touchmove', onTouchMove, { passive: true });
		el.addEventListener('touchend', onTouchEnd);
		return () => {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('pointerlockchange', onLock);
			window.removeEventListener('keydown', keyDown);
			window.removeEventListener('keyup', keyUp);
			el.removeEventListener('touchstart', onTouchStart);
			el.removeEventListener('touchmove', onTouchMove);
			el.removeEventListener('touchend', onTouchEnd);
		};
	}, [gl, mode, onLockChange, lookMultiplier]);

	useEffect(() => {
		if (mode !== 'lounge' && document.pointerLockElement) {
			document.exitPointerLock();
		}
		if (mode !== 'conversation') {
			transition.current.key = '';
		}
		if (mode === 'exit') {
			exitT.current = 0;
		}
	}, [mode]);

	useFrame((state, delta) => {
		const dt = Math.min(delta, 0.05);
		if (mode === 'lounge' || mode === 'menu') {
			if (mode === 'lounge') {
				const speed = 1.7;
				const forward = keys.current.has('KeyW') || keys.current.has('ArrowUp') || walkRef.current;
				const back = keys.current.has('KeyS') || keys.current.has('ArrowDown');
				const left = keys.current.has('KeyA') || keys.current.has('ArrowLeft');
				const right = keys.current.has('KeyD') || keys.current.has('ArrowRight');
				const dir = new THREE.Vector3((right ? 1 : 0) - (left ? 1 : 0), 0, (back ? 1 : 0) - (forward ? 1 : 0));
				if (dir.lengthSq() > 0) {
					dir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
					const next = position.current.clone().addScaledVector(dir, speed * dt);
					next.x = THREE.MathUtils.clamp(next.x, ROOM.minX, ROOM.maxX);
					next.z = THREE.MathUtils.clamp(next.z, ROOM.minZ, ROOM.maxZ);
					if (!insideBar(next.x, next.z)) {
						position.current.copy(next);
					}
				}
				const bob = reducedMotion || dir.lengthSq() === 0 ? 0 : Math.sin(state.clock.elapsedTime * 9) * 0.012;
				camera.position.set(position.current.x, position.current.y + bob, position.current.z);
			} else {
				// Menu: slow establishing drift near the entrance.
				const t = state.clock.elapsedTime;
				position.current.set(SPAWN.position[0], SPAWN.position[1], SPAWN.position[2]);
				camera.position.copy(position.current);
				yaw.current = reducedMotion ? 0 : Math.sin(t * 0.12) * 0.25;
				pitch.current = -0.04;
			}
			tmpEuler.current.set(pitch.current, yaw.current, 0);
			camera.quaternion.setFromEuler(tmpEuler.current);
			return;
		}
		if (mode === 'conversation' && characterId) {
			const seat = CONVERSATION_SEATS[characterId];
			if (!seat) return;
			// Time-based glide so the walk-over takes the same 1.4 seconds at any frame rate.
			const tr = transition.current;
			if (tr.key !== characterId) {
				tr.key = characterId;
				tr.start = state.clock.elapsedTime;
				tr.fromPos.copy(camera.position);
				tr.fromQuat.copy(camera.quaternion);
			}
			const raw = reducedMotion ? 1 : Math.min(1, (state.clock.elapsedTime - tr.start) / 1.4);
			const ease = raw * raw * (3 - 2 * raw);
			const t = target.current;
			t.pos.set(seat.camera[0], seat.camera[1], seat.camera[2]);
			camera.position.lerpVectors(tr.fromPos, t.pos, ease);
			position.current.copy(camera.position);
			const focus = new THREE.Vector3(seat.focus[0], seat.focus[1], seat.focus[2]);
			const idle = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
			focus.y += idle;
			const m = new THREE.Matrix4().lookAt(camera.position, focus, new THREE.Vector3(0, 1, 0));
			settleQuat.current.setFromRotationMatrix(m);
			camera.quaternion.slerpQuaternions(tr.fromQuat, settleQuat.current, ease);
			const e = tmpEuler.current.setFromQuaternion(camera.quaternion, 'YXZ');
			yaw.current = e.y;
			pitch.current = e.x;
			return;
		}
		if (mode === 'exit') {
			exitT.current += dt;
			const k = Math.min(1, dt * 0.9);
			const goal = EXIT.clone();
			goal.y = 1.55;
			camera.position.lerp(goal, k * 0.35);
			position.current.copy(camera.position);
			const m = new THREE.Matrix4().lookAt(camera.position, new THREE.Vector3(EXIT.x, 1.4, EXIT.z + 3), new THREE.Vector3(0, 1, 0));
			settleQuat.current.setFromRotationMatrix(m);
			camera.quaternion.slerp(settleQuat.current, k);
		}
	});

	return null;
}
