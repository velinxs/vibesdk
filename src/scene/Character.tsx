import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Expression, Gesture } from 'shared/game/types';
import type { Character } from 'shared/game/types';

export interface CharacterProps {
	character: Character;
	position: [number, number, number];
	rotationY: number;
	seated: boolean;
	expression?: Expression;
	gesture?: Gesture;
	/** World point the character looks at while engaged. */
	lookTarget?: THREE.Vector3 | null;
	engaged?: boolean;
	detail?: 'high' | 'low';
	onSelect?: () => void;
	highlight?: boolean;
	reducedMotion?: boolean;
	/** Changes whenever a new line is delivered; drives the mouth without React state. */
	speechToken?: string | null;
	speechDuration?: number;
}

interface ExpressionPose {
	browHeight: number;
	browTilt: number;
	smile: number;
	mouthOpen: number;
	eyeOpen: number;
	headTilt: number;
}

const EXPRESSION_POSES: Record<Expression, ExpressionPose> = {
	neutral: { browHeight: 0, browTilt: 0, smile: 0.15, mouthOpen: 0, eyeOpen: 1, headTilt: 0 },
	amused: { browHeight: 0.004, browTilt: 0.15, smile: 0.7, mouthOpen: 0.1, eyeOpen: 0.85, headTilt: 0.08 },
	warm: { browHeight: 0.002, browTilt: 0.08, smile: 0.85, mouthOpen: 0.15, eyeOpen: 0.9, headTilt: 0.05 },
	intrigued: { browHeight: 0.006, browTilt: 0.2, smile: 0.35, mouthOpen: 0.05, eyeOpen: 1.05, headTilt: 0.12 },
	skeptical: { browHeight: -0.002, browTilt: -0.35, smile: 0.05, mouthOpen: 0, eyeOpen: 0.8, headTilt: -0.1 },
	bored: { browHeight: -0.003, browTilt: 0, smile: -0.1, mouthOpen: 0, eyeOpen: 0.7, headTilt: 0 },
	annoyed: { browHeight: -0.006, browTilt: -0.4, smile: -0.4, mouthOpen: 0, eyeOpen: 0.75, headTilt: 0 },
	surprised: { browHeight: 0.009, browTilt: 0.1, smile: 0.2, mouthOpen: 0.5, eyeOpen: 1.15, headTilt: 0 },
	uncertain: { browHeight: 0.004, browTilt: -0.2, smile: 0, mouthOpen: 0.08, eyeOpen: 0.95, headTilt: 0.14 },
	laughing: { browHeight: 0.005, browTilt: 0.2, smile: 1, mouthOpen: 0.6, eyeOpen: 0.5, headTilt: 0.05 },
	cold: { browHeight: -0.004, browTilt: -0.15, smile: -0.25, mouthOpen: 0, eyeOpen: 0.85, headTilt: 0 },
};

interface BodyPose {
	lean: number; // forward positive
	torsoTwist: number;
	headTurn: number; // toward target strength
	armLeft: 'rest' | 'bar' | 'drink' | 'phone' | 'cross' | 'hair';
	armRight: 'rest' | 'bar' | 'drink' | 'phone' | 'cross' | 'hair';
	standUp: number;
}

const GESTURE_POSES: Record<Gesture, BodyPose> = {
	none: { lean: 0, torsoTwist: 0, headTurn: 1, armLeft: 'rest', armRight: 'drink', standUp: 0 },
	lean_in: { lean: 0.22, torsoTwist: 0, headTurn: 1, armLeft: 'bar', armRight: 'bar', standUp: 0 },
	lean_back: { lean: -0.18, torsoTwist: 0, headTurn: 0.8, armLeft: 'rest', armRight: 'drink', standUp: 0 },
	turn_away: { lean: -0.05, torsoTwist: 0.7, headTurn: 0, armLeft: 'rest', armRight: 'drink', standUp: 0 },
	check_phone: { lean: 0.05, torsoTwist: 0.15, headTurn: 0, armLeft: 'phone', armRight: 'rest', standUp: 0 },
	sip_drink: { lean: 0, torsoTwist: 0, headTurn: 0.6, armLeft: 'bar', armRight: 'drink', standUp: 0 },
	hair_touch: { lean: 0.05, torsoTwist: 0, headTurn: 1, armLeft: 'hair', armRight: 'drink', standUp: 0 },
	glance_friends: { lean: 0, torsoTwist: 0.5, headTurn: 0, armLeft: 'bar', armRight: 'drink', standUp: 0 },
	cross_arms: { lean: -0.1, torsoTwist: 0, headTurn: 0.9, armLeft: 'cross', armRight: 'cross', standUp: 0 },
	nod: { lean: 0.08, torsoTwist: 0, headTurn: 1, armLeft: 'bar', armRight: 'bar', standUp: 0 },
	head_tilt: { lean: 0.05, torsoTwist: 0, headTurn: 1, armLeft: 'bar', armRight: 'drink', standUp: 0 },
	stand_up: { lean: 0.1, torsoTwist: 0, headTurn: 1, armLeft: 'rest', armRight: 'rest', standUp: 1 },
	wave_over: { lean: 0.1, torsoTwist: 0.3, headTurn: 0.5, armLeft: 'bar', armRight: 'hair', standUp: 0 },
};

const ARM_TARGETS: Record<BodyPose['armLeft'], { upper: [number, number, number]; lower: [number, number, number] }> = {
	rest: { upper: [0.1, 0, 0.12], lower: [-0.55, 0, 0] },
	bar: { upper: [-0.55, 0, 0.2], lower: [-0.85, 0, 0] },
	drink: { upper: [-0.35, 0, 0.3], lower: [-1.55, 0, 0.25] },
	phone: { upper: [-0.5, 0, 0.5], lower: [-2.2, 0, 0.35] },
	cross: { upper: [-0.6, 0, 0.9], lower: [-1.7, 0.4, 0.9] },
	hair: { upper: [-2.4, 0, 0.5], lower: [-1.9, 0, 0.6] },
};

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

let seedCounter = 0;
function nextSeed(id: string): number {
	seedCounter += 1;
	let h = 7;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
	return (h + seedCounter * 17) % 100;
}

export function CharacterModel(props: CharacterProps) {
	const { character, position, rotationY, seated, expression = 'neutral', gesture = 'none', lookTarget, engaged = false, detail = 'high', onSelect, highlight = false, reducedMotion = false, speechToken = null, speechDuration = 0 } = props;
	const speech = useRef<{ token: string | null; start: number }>({ token: null, start: -1 });
	const root = useRef<THREE.Group>(null);
	const torso = useRef<THREE.Group>(null);
	const head = useRef<THREE.Group>(null);
	const eyes = useRef<THREE.Group>(null);
	const browL = useRef<THREE.Mesh>(null);
	const browR = useRef<THREE.Mesh>(null);
	const mouth = useRef<THREE.Mesh>(null);
	const lidL = useRef<THREE.Mesh>(null);
	const lidR = useRef<THREE.Mesh>(null);
	const armL = useRef<THREE.Group>(null);
	const armR = useRef<THREE.Group>(null);
	const foreL = useRef<THREE.Group>(null);
	const foreR = useRef<THREE.Group>(null);
	const seed = useMemo(() => nextSeed(character.id), [character.id]);
	const blink = useRef({ next: 2 + (seed % 3), until: 0 });
	const tmp = useMemo(() => ({ v: new THREE.Vector3(), q: new THREE.Quaternion(), m: new THREE.Matrix4(), e: new THREE.Euler() }), []);

	const skinMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: character.appearance.skin, roughness: 0.62, sheen: 0.4, sheenColor: new THREE.Color('#ffd7c2'), sheenRoughness: 0.6 }), [character.appearance.skin]);
	const hairMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: character.appearance.hairColor, roughness: 0.45, metalness: 0.05, sheen: 0.6, sheenColor: new THREE.Color('#5a3a26') }), [character.appearance.hairColor]);
	const clothMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: character.appearance.outfitColor, roughness: 0.5, sheen: 0.9, sheenColor: new THREE.Color(character.appearance.outfitColor).lerp(new THREE.Color('#ffffff'), 0.4), sheenRoughness: 0.35 }), [character.appearance.outfitColor]);
	const trouserMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#15161a', roughness: 0.85 }), []);
	const eyeWhite = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4efe9', roughness: 0.25 }), []);
	const iris = useMemo(() => new THREE.MeshStandardMaterial({ color: character.id === 'sienna' ? '#4f7a8a' : '#3b2a1e', roughness: 0.3 }), [character.id]);
	const lipMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8f4a4e', roughness: 0.5 }), []);
	const browMat = useMemo(() => new THREE.MeshStandardMaterial({ color: character.appearance.hairColor, roughness: 0.9 }), [character.appearance.hairColor]);

	const hipY = seated ? 0.62 : 0.95;
	const longHair = /long|shoulder/.test(character.appearance.hair);
	const shortHair = /short|bob|cropped|swept|ponytail/.test(character.appearance.hair);
	const dress = /dress/.test(character.appearance.outfit);

	useFrame((state, delta) => {
		const t = state.clock.elapsedTime + seed;
		if (speech.current.token !== speechToken) {
			speech.current = { token: speechToken, start: speechToken ? state.clock.elapsedTime : -1 };
		}
		const speaking = speech.current.start >= 0 && state.clock.elapsedTime - speech.current.start < speechDuration;
		const pose = EXPRESSION_POSES[expression];
		const body = GESTURE_POSES[gesture];
		const k = reducedMotion ? 1 : Math.min(1, delta * 4);
		const motion = reducedMotion ? 0 : 1;
		if (torso.current) {
			const breathe = Math.sin(t * 1.6) * 0.006 * motion;
			torso.current.rotation.x = lerp(torso.current.rotation.x, -body.lean + breathe, k);
			torso.current.rotation.y = lerp(torso.current.rotation.y, body.torsoTwist * (rotationY > 0 ? 1 : -1) * 0.6, k);
			torso.current.position.y = lerp(torso.current.position.y, hipY + body.standUp * 0.35, k);
		}
		if (head.current && root.current) {
			let yaw = 0;
			let pitch = 0;
			if (lookTarget && (engaged || body.headTurn > 0)) {
				root.current.updateWorldMatrix(true, false);
				tmp.v.copy(lookTarget);
				head.current.parent?.worldToLocal(tmp.v);
				yaw = Math.atan2(tmp.v.x, tmp.v.z);
				pitch = -Math.atan2(tmp.v.y - 0.02, Math.hypot(tmp.v.x, tmp.v.z));
				yaw = THREE.MathUtils.clamp(yaw, -1.1, 1.1) * body.headTurn;
				pitch = THREE.MathUtils.clamp(pitch, -0.5, 0.5) * body.headTurn;
			}
			if (body.headTurn === 0) {
				yaw = gesture === 'check_phone' ? 0.2 : gesture === 'turn_away' ? -0.9 : -0.7;
				pitch = gesture === 'check_phone' ? 0.45 : 0;
			}
			const idleYaw = Math.sin(t * 0.7) * 0.03 * motion;
			const nod = gesture === 'nod' ? Math.sin(t * 6) * 0.06 * motion : 0;
			const talk = speaking ? Math.sin(t * 5) * 0.015 * motion : 0;
			head.current.rotation.y = lerp(head.current.rotation.y, yaw + idleYaw, k);
			head.current.rotation.x = lerp(head.current.rotation.x, pitch + nod + talk, k);
			head.current.rotation.z = lerp(head.current.rotation.z, pose.headTilt, k);
		}
		if (eyes.current) {
			eyes.current.rotation.y = lerp(eyes.current.rotation.y, Math.sin(t * 0.9) * 0.05 * motion, k);
		}
		if (browL.current && browR.current) {
			browL.current.position.y = lerp(browL.current.position.y, 0.035 + pose.browHeight, k);
			browR.current.position.y = lerp(browR.current.position.y, 0.035 + pose.browHeight, k);
			browL.current.rotation.z = lerp(browL.current.rotation.z, 0.1 + pose.browTilt * 0.5, k);
			browR.current.rotation.z = lerp(browR.current.rotation.z, -0.1 - pose.browTilt * 0.5, k);
		}
		if (mouth.current) {
			const open = pose.mouthOpen + (speaking ? (0.5 + Math.sin(t * 9) * 0.5) * 0.28 * motion : 0);
			mouth.current.scale.set(1 + pose.smile * 0.35, 0.45 + open * 1.4, 1);
			mouth.current.rotation.z = Math.PI;
			mouth.current.position.y = lerp(mouth.current.position.y, -0.045 + pose.smile * 0.004, k);
			mouth.current.rotation.x = lerp(mouth.current.rotation.x, pose.smile >= 0 ? 0 : Math.PI, k);
		}
		if (lidL.current && lidR.current) {
			const b = blink.current;
			if (t > b.next) {
				b.until = t + 0.12;
				b.next = t + 2.5 + ((Math.sin(t * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1 * 3.5;
			}
			const closed = t < b.until ? 1 : 0;
			const open = Math.max(0, Math.min(1, pose.eyeOpen)) * (1 - closed);
			const lidY = lerp(lidL.current.position.y, 0.006 + open * 0.02, reducedMotion ? 1 : Math.min(1, delta * 18));
			lidL.current.position.y = lidY;
			lidR.current.position.y = lidY;
		}
		const setArm = (upper: THREE.Group | null, lower: THREE.Group | null, target: BodyPose['armLeft'], side: number) => {
			if (!upper || !lower) return;
			const a = ARM_TARGETS[target];
			const sway = Math.sin(t * 1.3 + side) * 0.02 * motion;
			upper.rotation.x = lerp(upper.rotation.x, a.upper[0] + sway, k);
			upper.rotation.y = lerp(upper.rotation.y, a.upper[1] * side, k);
			upper.rotation.z = lerp(upper.rotation.z, a.upper[2] * side, k);
			lower.rotation.x = lerp(lower.rotation.x, a.lower[0], k);
			lower.rotation.y = lerp(lower.rotation.y, a.lower[1] * side, k);
			lower.rotation.z = lerp(lower.rotation.z, a.lower[2] * side, k);
		};
		const standingArm = (arm: BodyPose['armLeft']) => (!seated && (arm === 'bar' || arm === 'drink') ? 'rest' : arm);
		setArm(armL.current, foreL.current, standingArm(body.armLeft), 1);
		setArm(armR.current, foreR.current, standingArm(body.armRight), -1);
	});

	const segs = detail === 'high' ? 24 : 10;

	return (
		<group ref={root} position={position} rotation={[0, rotationY, 0]} onClick={onSelect ? (e) => { e.stopPropagation(); onSelect(); } : undefined} onPointerOver={onSelect ? () => { document.body.style.cursor = 'pointer'; } : undefined} onPointerOut={onSelect ? () => { document.body.style.cursor = ''; } : undefined}>
			{/* Legs */}
			{seated ? (
				<group position={[0, hipY, 0]}>
					<mesh position={[-0.09, -0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={dress ? skinMat : trouserMat} castShadow>
						<capsuleGeometry args={[0.075, 0.34, 6, segs]} />
					</mesh>
					<mesh position={[0.09, -0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={dress ? skinMat : trouserMat} castShadow>
						<capsuleGeometry args={[0.075, 0.34, 6, segs]} />
					</mesh>
					<mesh position={[-0.09, -0.3, 0.38]} material={dress ? skinMat : trouserMat} castShadow>
						<capsuleGeometry args={[0.06, 0.4, 6, segs]} />
					</mesh>
					<mesh position={[0.09, -0.3, 0.38]} material={dress ? skinMat : trouserMat} castShadow>
						<capsuleGeometry args={[0.06, 0.4, 6, segs]} />
					</mesh>
				</group>
			) : (
				<group position={[0, hipY, 0]}>
					<mesh position={[-0.09, -0.45, 0]} material={trouserMat} castShadow>
						<capsuleGeometry args={[0.07, 0.8, 6, segs]} />
					</mesh>
					<mesh position={[0.09, -0.45, 0]} material={trouserMat} castShadow>
						<capsuleGeometry args={[0.07, 0.8, 6, segs]} />
					</mesh>
				</group>
			)}
			<group ref={torso} position={[0, hipY, 0]}>
				{/* Hips and torso */}
				<mesh position={[0, 0.02, 0]} material={dress ? clothMat : trouserMat} castShadow>
					<capsuleGeometry args={[0.15, 0.12, 8, segs]} />
				</mesh>
				<mesh position={[0, 0.3, 0]} scale={[0.95, 1.15, 0.66]} material={clothMat} castShadow>
					<capsuleGeometry args={[0.16, 0.26, 8, segs]} />
				</mesh>
				<mesh position={[0, 0.36, 0.05]} scale={[0.85, 0.5, 0.45]} material={clothMat}>
					<sphereGeometry args={[0.15, segs, segs]} />
				</mesh>
				{/* Neck */}
				<mesh position={[0, 0.58, 0]} material={skinMat}>
					<cylinderGeometry args={[0.045, 0.055, 0.12, segs]} />
				</mesh>
				{/* Shoulders */}
				<mesh position={[-0.2, 0.5, 0]} material={clothMat} castShadow>
					<sphereGeometry args={[0.07, segs, segs]} />
				</mesh>
				<mesh position={[0.2, 0.5, 0]} material={clothMat} castShadow>
					<sphereGeometry args={[0.07, segs, segs]} />
				</mesh>
				{/* Arms */}
				<group ref={armL} position={[-0.22, 0.5, 0]}>
					<mesh position={[0, -0.15, 0]} material={clothMat} castShadow>
						<capsuleGeometry args={[0.05, 0.22, 6, segs]} />
					</mesh>
					<group ref={foreL} position={[0, -0.3, 0]}>
						<mesh position={[0, -0.13, 0]} material={/blouse|knit|jumpsuit|blazer|shirt|overshirt/.test(character.appearance.outfit) ? clothMat : skinMat} castShadow>
							<capsuleGeometry args={[0.042, 0.2, 6, segs]} />
						</mesh>
						<mesh position={[0, -0.27, 0]} scale={[1, 1.2, 0.6]} material={skinMat}>
							<sphereGeometry args={[0.045, segs, segs]} />
						</mesh>
					</group>
				</group>
				<group ref={armR} position={[0.22, 0.5, 0]}>
					<mesh position={[0, -0.15, 0]} material={clothMat} castShadow>
						<capsuleGeometry args={[0.05, 0.22, 6, segs]} />
					</mesh>
					<group ref={foreR} position={[0, -0.3, 0]}>
						<mesh position={[0, -0.13, 0]} material={/blouse|knit|jumpsuit|blazer|shirt|overshirt/.test(character.appearance.outfit) ? clothMat : skinMat} castShadow>
							<capsuleGeometry args={[0.042, 0.2, 6, segs]} />
						</mesh>
						<mesh position={[0, -0.27, 0]} scale={[1, 1.2, 0.6]} material={skinMat}>
							<sphereGeometry args={[0.045, segs, segs]} />
						</mesh>
						{gesture === 'sip_drink' || gesture === 'none' || gesture === 'lean_back' ? (
							<group position={[0, -0.3, 0.02]}>
								<mesh position={[0, 0.06, 0]}>
									<coneGeometry args={[0.055, 0.09, 16, 1, true]} />
									<meshPhysicalMaterial color="#f5f0e0" transmission={0.9} roughness={0.05} thickness={0.01} transparent />
								</mesh>
								<mesh position={[0, 0.07, 0]}>
									<coneGeometry args={[0.048, 0.06, 16]} />
									<meshStandardMaterial color="#e6a53a" emissive="#5a3a08" emissiveIntensity={0.4} />
								</mesh>
								<mesh position={[0, -0.02, 0]}>
									<cylinderGeometry args={[0.005, 0.005, 0.1, 8]} />
									<meshPhysicalMaterial color="#f5f0e0" transmission={0.9} roughness={0.05} transparent />
								</mesh>
							</group>
						) : null}
						{gesture === 'check_phone' ? (
							<mesh position={[0, -0.28, 0.05]} rotation={[0.5, 0, 0]}>
								<boxGeometry args={[0.07, 0.14, 0.008]} />
								<meshStandardMaterial color="#111" emissive="#8fb7ff" emissiveIntensity={0.8} roughness={0.3} metalness={0.2} />
							</mesh>
						) : null}
					</group>
				</group>
				{/* Head */}
				<group ref={head} position={[0, 0.735, 0]} scale={0.9}>
					<mesh material={skinMat} castShadow scale={[0.92, 1.08, 0.88]}>
						<sphereGeometry args={[0.11, segs * 2, segs * 2]} />
					</mesh>
					{/* jaw and chin */}
					<mesh position={[0, -0.055, 0.02]} scale={[0.78, 0.62, 0.74]} material={skinMat}>
						<sphereGeometry args={[0.1, segs, segs]} />
					</mesh>
					<mesh position={[0, -0.1, 0.045]} scale={[0.5, 0.35, 0.45]} material={skinMat}>
						<sphereGeometry args={[0.06, segs, segs]} />
					</mesh>
					{/* cheeks */}
					<mesh position={[-0.048, -0.025, 0.06]} scale={[1, 0.8, 0.7]} material={skinMat}>
						<sphereGeometry args={[0.03, segs, segs]} />
					</mesh>
					<mesh position={[0.048, -0.025, 0.06]} scale={[1, 0.8, 0.7]} material={skinMat}>
						<sphereGeometry args={[0.03, segs, segs]} />
					</mesh>
					{/* nose */}
					<mesh position={[0, -0.012, 0.097]} rotation={[0.35, 0, 0]} scale={[0.8, 1, 1]} material={skinMat}>
						<capsuleGeometry args={[0.011, 0.022, 4, 10]} />
					</mesh>
					{/* ears */}
					<mesh position={[-0.103, -0.005, -0.005]} scale={[0.35, 1, 0.75]} material={skinMat}>
						<sphereGeometry args={[0.024, 10, 10]} />
					</mesh>
					<mesh position={[0.103, -0.005, -0.005]} scale={[0.35, 1, 0.75]} material={skinMat}>
						<sphereGeometry args={[0.024, 10, 10]} />
					</mesh>
					{/* Eyes */}
					<group ref={eyes} position={[0, 0.014, 0.086]}>
						{[-0.036, 0.036].map((x, i) => (
							<group key={x} position={[x, 0, 0]}>
								<mesh material={eyeWhite} scale={[1.25, 0.8, 0.7]}>
									<sphereGeometry args={[0.019, 16, 16]} />
								</mesh>
								<mesh position={[0, 0, 0.011]} material={iris}>
									<sphereGeometry args={[0.0095, 14, 14]} />
								</mesh>
								<mesh position={[0, 0, 0.0185]}>
									<sphereGeometry args={[0.0045, 8, 8]} />
									<meshStandardMaterial color="#050505" roughness={0.1} />
								</mesh>
								<mesh position={[-0.003, 0.004, 0.021]}>
									<sphereGeometry args={[0.0018, 6, 6]} />
									<meshBasicMaterial color="#ffffff" />
								</mesh>
								{/* upper lid: a skin sphere that slides down over the eye when closing */}
								<mesh ref={i === 0 ? lidL : lidR} position={[0, 0.024, -0.002]} scale={[1.32, 0.9, 0.78]} material={skinMat}>
									<sphereGeometry args={[0.0205, 16, 12]} />
								</mesh>
								{/* lash line */}
								<mesh position={[0, 0.011, 0.012]} rotation={[0.35, 0, 0]}>
									<torusGeometry args={[0.0185, 0.0009, 6, 14, Math.PI]} />
									<meshStandardMaterial color="#1a100c" roughness={0.8} />
								</mesh>
							</group>
						))}
					</group>
					{/* Brows */}
					<mesh ref={browL} position={[-0.037, 0.035, 0.1]} rotation={[0, 0, 0.1]} material={browMat}>
						<capsuleGeometry args={[0.0035, 0.034, 4, 8]} />
					</mesh>
					<mesh ref={browR} position={[0.037, 0.035, 0.1]} rotation={[0, 0, -0.1]} material={browMat}>
						<capsuleGeometry args={[0.0035, 0.034, 4, 8]} />
					</mesh>
					{/* Lips */}
					<mesh ref={mouth} position={[0, -0.045, 0.092]} rotation={[0, 0, Math.PI]} material={lipMat}>
						<torusGeometry args={[0.022, 0.0065, 8, 16, Math.PI]} />
					</mesh>
					<mesh position={[0, -0.041, 0.092]} rotation={[0.2, 0, 0]} scale={[1, 0.6, 0.6]} material={lipMat}>
						<capsuleGeometry args={[0.0045, 0.03, 4, 8]} />
					</mesh>
					{/* Hair */}
					<mesh position={[0, 0.03, -0.015]} scale={[1.03, 1.06, 1.03]} material={hairMat} castShadow>
						<sphereGeometry args={[0.114, segs * 2, segs * 2, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
					</mesh>
					<mesh position={[0, 0.088, 0.03]} scale={[0.88, 0.34, 0.75]} material={hairMat}>
						<sphereGeometry args={[0.1, segs, segs]} />
					</mesh>
					{longHair ? (
						<>
							{[-1, 1].map((side) => (
								<group key={side}>
									<mesh position={[side * 0.095, -0.1, -0.01]} rotation={[0, 0, side * 0.1]} material={hairMat} castShadow>
										<capsuleGeometry args={[0.042, 0.26, 6, segs]} />
									</mesh>
									<mesh position={[side * 0.07, -0.14, -0.075]} rotation={[0.1, 0, side * 0.05]} material={hairMat} castShadow>
										<capsuleGeometry args={[0.04, 0.24, 6, segs]} />
									</mesh>
									<mesh position={[side * 0.11, 0.0, -0.04]} rotation={[0, 0, side * 0.35]} material={hairMat}>
										<capsuleGeometry args={[0.035, 0.12, 6, segs]} />
									</mesh>
								</group>
							))}
							<mesh position={[0, -0.12, -0.095]} scale={[1.7, 1, 0.7]} material={hairMat} castShadow>
								<capsuleGeometry args={[0.055, 0.24, 6, segs]} />
							</mesh>
						</>
					) : null}
					{shortHair ? (
						<mesh position={[0, -0.02, -0.06]} scale={[1.05, 0.9, 0.8]} material={hairMat}>
							<sphereGeometry args={[0.105, segs, segs, 0, Math.PI * 2, 0, Math.PI * 0.75]} />
						</mesh>
					) : null}
				</group>
			</group>
			{highlight ? (
				<mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<ringGeometry args={[0.32, 0.38, 48]} />
					<meshBasicMaterial color="#d9b86a" transparent opacity={0.55} />
				</mesh>
			) : null}
		</group>
	);
}
