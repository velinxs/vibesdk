import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Environment, Lightformer } from '@react-three/drei';
import { BAR_CENTER, BAR_END, BAR_RADIUS, BAR_START, GLASS_Z, ROOM, STOOLS, onArc } from './layout';
import { bokehSprite, useLoungeTexture } from './textures';
import { rngNext } from 'shared/game/rng';

interface LoungeProps {
	quality: 'high' | 'medium' | 'low';
}

const WALNUT = '#3a2416';
const CHARCOAL = '#2a2b2f';
const BRASS = '#b8925a';

function Bar({ quality }: LoungeProps) {
	const walnut = useLoungeTexture('/textures/walnut.jpg', 3);
	const brassTex = useLoungeTexture('/textures/brass.jpg', 6);
	const arc = BAR_END - BAR_START;
	const segments = quality === 'low' ? 24 : 64;
	const railCurve = useMemo(() => {
		const points: THREE.Vector3[] = [];
		for (let i = 0; i <= 48; i++) {
			const a = BAR_START + (arc * i) / 48;
			points.push(new THREE.Vector3(BAR_CENTER.x + (BAR_RADIUS + 0.62) * Math.sin(a), 1.09, BAR_CENTER.z + (BAR_RADIUS + 0.62) * Math.cos(a)));
		}
		return new THREE.CatmullRomCurve3(points);
	}, [arc]);
	const topMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06, reflectivity: 0.9, envMapIntensity: 1.6 }), []);
	const frontMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: walnut ? '#d9c6b3' : WALNUT, map: walnut, roughness: 0.45, clearcoat: 0.3 }), [walnut]);
	const brassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: brassTex ? '#f0d3a0' : BRASS, map: brassTex, metalness: 0.95, roughness: 0.28 }), [brassTex]);
	// Rotate so theta runs around the y axis like our onArc helper (sin for x, cos for z).
	return (
		<group position={[BAR_CENTER.x, 0, BAR_CENTER.z]}>
			{/* Bar top */}
			<mesh position={[0, 1.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={topMat} receiveShadow>
				<ringGeometry args={[BAR_RADIUS - 0.7, BAR_RADIUS + 0.62, segments, 1, Math.PI / 2 - BAR_END, arc]} />
			</mesh>
			<mesh position={[0, 1.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={frontMat}>
				<ringGeometry args={[BAR_RADIUS - 0.7, BAR_RADIUS + 0.66, segments, 1, Math.PI / 2 - BAR_END, arc]} />
			</mesh>
			{/* Front panel */}
			<mesh position={[0, 0.515, 0]} material={frontMat} castShadow receiveShadow>
				<cylinderGeometry args={[BAR_RADIUS + 0.62, BAR_RADIUS + 0.62, 1.03, segments, 1, true, BAR_START, arc]} />
			</mesh>
			{/* Brass rail and foot rail */}
			<mesh material={brassMat} position={[-BAR_CENTER.x, 0, -BAR_CENTER.z]}>
				<tubeGeometry args={[railCurve, 64, 0.03, 12, false]} />
			</mesh>
			<mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2 - BAR_END]} material={brassMat}>
				<torusGeometry args={[BAR_RADIUS + 0.78, 0.018, 8, segments, arc]} />
			</mesh>
			{/* Kick plate and inner counter */}
			<mesh position={[0, 0.06, 0]} material={brassMat}>
				<cylinderGeometry args={[BAR_RADIUS + 0.63, BAR_RADIUS + 0.63, 0.12, segments, 1, true, BAR_START, arc]} />
			</mesh>
			<mesh position={[0, 0.45, 0]}>
				<cylinderGeometry args={[BAR_RADIUS - 0.72, BAR_RADIUS - 0.72, 0.9, segments, 1, true, BAR_START, arc]} />
				<meshStandardMaterial color="#1c1a18" roughness={0.9} side={THREE.DoubleSide} />
			</mesh>
		</group>
	);
}

function BackBar({ quality }: LoungeProps) {
	const bottles = useMemo(() => {
		const items: Array<{ position: [number, number, number]; color: string; h: number }> = [];
		const colors = ['#c98f2b', '#7a3b1f', '#2f6b4f', '#d9d2c4', '#8a1f2b', '#3d5f8a', '#e0c070'];
		const count = quality === 'low' ? 10 : 22;
		for (let i = 0; i < count; i++) {
			const deg = -48 + (103 * i) / (count - 1) + ((i * 7) % 3) * 0.6;
			const p = onArc(2.35, deg, 0.92);
			items.push({ position: [p[0], p[1] + 0.13, p[2]], color: colors[i % colors.length], h: 0.22 + ((i * 13) % 5) * 0.03 });
		}
		return items;
	}, [quality]);
	const arc = BAR_END - BAR_START;
	return (
		<group>
			<mesh position={[BAR_CENTER.x, 0.45, BAR_CENTER.z]}>
				<cylinderGeometry args={[2.55, 2.55, 0.9, 48, 1, true, BAR_START - 0.05, arc + 0.1]} />
				<meshStandardMaterial color={WALNUT} roughness={0.5} side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[BAR_CENTER.x, 0.91, BAR_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
				<ringGeometry args={[2.15, 2.6, 48, 1, Math.PI / 2 - BAR_END - 0.05, arc + 0.1]} />
				<meshPhysicalMaterial color="#111214" roughness={0.15} clearcoat={0.8} />
			</mesh>
			{/* Under-shelf LED glow */}
			<mesh position={[BAR_CENTER.x, 0.93, BAR_CENTER.z]} rotation={[-Math.PI / 2, 0, 0]}>
				<ringGeometry args={[2.16, 2.2, 48, 1, Math.PI / 2 - BAR_END - 0.05, arc + 0.1]} />
				<meshBasicMaterial color="#ffb877" />
			</mesh>
			{bottles.map((b, i) => (
				<group key={i} position={b.position}>
					<mesh position={[0, b.h / 2, 0]}>
						<cylinderGeometry args={[0.032, 0.036, b.h, 12]} />
						<meshPhysicalMaterial color={b.color} transmission={0.55} roughness={0.15} thickness={0.5} ior={1.45} transparent />
					</mesh>
					<mesh position={[0, b.h + 0.04, 0]}>
						<cylinderGeometry args={[0.012, 0.018, 0.08, 10]} />
						<meshPhysicalMaterial color={b.color} transmission={0.4} roughness={0.2} transparent />
					</mesh>
				</group>
			))}
		</group>
	);
}

function Stool({ position, rotationY, quality }: { position: [number, number, number]; rotationY: number; quality: LoungeProps['quality'] }) {
	const velvet = useLoungeTexture('/textures/velvet.jpg', 2);
	const seatMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: velvet ? '#b4b4bc' : CHARCOAL, map: velvet, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#9a9ca4'), sheenRoughness: 0.45 }), [velvet]);
	const seg = quality === 'low' ? 12 : 28;
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			{[-1, 1].flatMap((sx) =>
				[-1, 1].map((sz) => (
					<mesh key={`${sx}${sz}`} position={[sx * 0.16, 0.36, sz * 0.16]} rotation={[sz * -0.06, 0, sx * 0.06]} castShadow>
						<cylinderGeometry args={[0.016, 0.024, 0.72, 10]} />
						<meshStandardMaterial color="#b98d5e" roughness={0.55} />
					</mesh>
				)),
			)}
			<mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<torusGeometry args={[0.2, 0.012, 8, 32]} />
				<meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0.72, 0]} material={seatMat} castShadow receiveShadow>
				<cylinderGeometry args={[0.24, 0.22, 0.09, seg]} />
			</mesh>
			{/* Curved back */}
			<mesh position={[0, 0.98, 0]} material={seatMat} castShadow>
				<cylinderGeometry args={[0.26, 0.26, 0.42, seg, 1, true, Math.PI * 0.62, Math.PI * 0.76]} />
			</mesh>
			<mesh position={[0, 0.98, 0]} material={seatMat}>
				<cylinderGeometry args={[0.22, 0.22, 0.42, seg, 1, true, Math.PI * 0.62, Math.PI * 0.76]} />
			</mesh>
		</group>
	);
}

function LoungeChair({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
	const velvet = useLoungeTexture('/textures/velvet.jpg', 1.5);
	const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: velvet ? '#a8a8b0' : CHARCOAL, map: velvet, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color('#9a9ca4') }), [velvet]);
	return (
		<group position={position} rotation={[0, rotationY, 0]}>
			<mesh position={[0, 0.36, 0]} material={mat} castShadow receiveShadow>
				<cylinderGeometry args={[0.42, 0.4, 0.34, 28]} />
			</mesh>
			<mesh position={[0, 0.72, 0]} material={mat} castShadow>
				<cylinderGeometry args={[0.44, 0.44, 0.44, 28, 1, true, Math.PI * 0.58, Math.PI * 0.84]} />
			</mesh>
			<mesh position={[0, 0.72, 0]} material={mat}>
				<cylinderGeometry args={[0.38, 0.38, 0.44, 28, 1, true, Math.PI * 0.58, Math.PI * 0.84]} />
			</mesh>
			<mesh position={[0, 0.1, 0]}>
				<cylinderGeometry args={[0.18, 0.28, 0.2, 20]} />
				<meshStandardMaterial color="#1a1b1e" roughness={0.6} metalness={0.4} />
			</mesh>
		</group>
	);
}

function SideTable({ position }: { position: [number, number, number] }) {
	return (
		<group position={position}>
			<mesh position={[0, 0.5, 0]}>
				<cylinderGeometry args={[0.24, 0.24, 0.025, 28]} />
				<meshPhysicalMaterial color="#0f0f11" roughness={0.1} clearcoat={1} />
			</mesh>
			<mesh position={[0, 0.25, 0]}>
				<cylinderGeometry args={[0.02, 0.02, 0.5, 10]} />
				<meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
			</mesh>
			<mesh position={[0, 0.55, 0]}>
				<cylinderGeometry args={[0.03, 0.03, 0.06, 12]} />
				<meshStandardMaterial color="#fff2cc" emissive="#ffb347" emissiveIntensity={2.2} />
			</mesh>
			<pointLight position={[0, 0.62, 0]} color="#ffb060" intensity={0.5} distance={1.8} decay={2} />
		</group>
	);
}

function Pendant({ position, quality }: { position: [number, number, number]; quality: LoungeProps['quality'] }) {
	return (
		<group position={position}>
			<mesh position={[0, 0.5, 0]}>
				<cylinderGeometry args={[0.004, 0.004, 1.0, 6]} />
				<meshStandardMaterial color="#111" />
			</mesh>
			{/* Fabric drum shade, lit from inside */}
			<mesh>
				<cylinderGeometry args={[0.24, 0.26, 0.24, 32, 1, true]} />
				<meshPhysicalMaterial color="#c9a578" emissive="#e8a860" emissiveIntensity={0.45} roughness={0.95} side={THREE.DoubleSide} sheen={0.6} sheenColor={new THREE.Color('#ffd9a8')} />
			</mesh>
			<mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.26, 32]} />
				<meshStandardMaterial color="#fff2d8" emissive="#ffc987" emissiveIntensity={1.4} side={THREE.DoubleSide} />
			</mesh>
			<mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
				<circleGeometry args={[0.24, 32]} />
				<meshStandardMaterial color="#c9a980" roughness={0.9} side={THREE.DoubleSide} />
			</mesh>
			<pointLight position={[0, -0.16, 0]} color="#ffb866" intensity={quality === 'low' ? 8 : 12} distance={6} decay={2} castShadow={quality === 'high'} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0008} />
		</group>
	);
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
	const leaves = useMemo(() => {
		const out: Array<{ p: [number, number, number]; r: [number, number, number]; s: number }> = [];
		for (let i = 0; i < 14; i++) {
			const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.4;
			const tilt = 0.5 + (i % 4) * 0.22;
			out.push({ p: [Math.sin(a) * 0.12, 0.55 + (i % 5) * 0.07, Math.cos(a) * 0.12], r: [tilt, a, 0], s: 0.9 + (i % 3) * 0.15 });
		}
		return out;
	}, []);
	return (
		<group position={position} scale={scale}>
			<mesh position={[0, 0.22, 0]}>
				<cylinderGeometry args={[0.2, 0.16, 0.44, 24]} />
				<meshStandardMaterial color="#2b2a28" roughness={0.7} />
			</mesh>
			{leaves.map((l, i) => (
				<mesh key={i} position={l.p} rotation={l.r} scale={l.s} castShadow>
					<capsuleGeometry args={[0.05, 0.5, 4, 8]} />
					<meshStandardMaterial color={i % 2 ? '#2f5a36' : '#3c6e42'} roughness={0.7} />
				</mesh>
			))}
		</group>
	);
}

function makeBokeh(count: number): { positions: Float32Array; colors: Float32Array } {
	const positions: number[] = [];
	const colors: number[] = [];
	const c1 = new THREE.Color('#ffc574');
	const c2 = new THREE.Color('#9fd0ff');
	let rng = 1337;
	const next = () => {
		const step = rngNext(rng);
		rng = step.next;
		return step.value;
	};
	for (let i = 0; i < count; i++) {
		positions.push((next() - 0.5) * 60, -3 + next() * 5, GLASS_Z - 9 - next() * 8);
		const c = next() < 0.7 ? c1 : c2;
		colors.push(c.r, c.g, c.b);
	}
	return { positions: new Float32Array(positions), colors: new Float32Array(colors) };
}

function GlassWall({ quality }: LoungeProps) {
	const skyline = useLoungeTexture('/textures/skyline3.jpg', 1, { window: [1, 0.5, 0, 0.28] });
	const sprite = useMemo(() => bokehSprite(), []);
	const bokeh = useMemo(() => makeBokeh(140), []);
	const mullions = useMemo(() => {
		const out: number[] = [];
		for (let x = ROOM.minX - 0.6; x <= ROOM.maxX + 0.6; x += 1.55) out.push(x);
		return out;
	}, []);
	return (
		<group>
			{/* Skyline backdrop far behind the glass */}
			<mesh position={[0, 4.5, GLASS_Z - 16]}>
				<planeGeometry args={[72, 36]} />
				<meshBasicMaterial map={skyline} color={skyline ? '#b9c6ea' : '#182238'} toneMapped={false} fog={false} />
			</mesh>
			{/* Bokeh points in front of the skyline */}
			<points position={[0, 0, 0]}>
				<bufferGeometry>
					<bufferAttribute attach="attributes-position" args={[bokeh.positions, 3]} />
					<bufferAttribute attach="attributes-color" args={[bokeh.colors, 3]} />
				</bufferGeometry>
				<pointsMaterial size={0.9} map={sprite} vertexColors transparent opacity={0.4} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
			</points>
			{/* Glass: thin reflective pane, cheap enough for every quality tier */}
			<mesh position={[0, ROOM.ceiling / 2, GLASS_Z]}>
				<planeGeometry args={[ROOM.maxX - ROOM.minX + 2, ROOM.ceiling]} />
				<meshPhysicalMaterial color="#dfe8ff" transparent opacity={0.09} roughness={0.02} metalness={0} envMapIntensity={quality === 'low' ? 0.4 : 1.4} reflectivity={1} depthWrite={false} />
			</mesh>
			{mullions.map((x) => (
				<mesh key={x} position={[x, ROOM.ceiling / 2, GLASS_Z]}>
					<boxGeometry args={[0.07, ROOM.ceiling, 0.12]} />
					<meshStandardMaterial color="#0c0d10" roughness={0.6} metalness={0.4} />
				</mesh>
			))}
			<mesh position={[0, 0.06, GLASS_Z]}>
				<boxGeometry args={[ROOM.maxX - ROOM.minX + 2, 0.12, 0.14]} />
				<meshStandardMaterial color="#0c0d10" roughness={0.6} metalness={0.4} />
			</mesh>
			<mesh position={[0, ROOM.ceiling - 0.05, GLASS_Z]}>
				<boxGeometry args={[ROOM.maxX - ROOM.minX + 2, 0.1, 0.14]} />
				<meshStandardMaterial color="#0c0d10" roughness={0.6} metalness={0.4} />
			</mesh>
		</group>
	);
}

/** A spotlight whose target lives in the scene graph so its aim actually updates. */
function AimedSpot({ position, target, intensity, castShadow }: { position: [number, number, number]; target: [number, number, number]; intensity: number; castShadow: boolean }) {
	const light = useRef<THREE.SpotLight>(null);
	const aim = useMemo(() => new THREE.Object3D(), []);
	useEffect(() => {
		if (light.current) {
			light.current.target = aim;
		}
	}, [aim]);
	return (
		<group>
			<spotLight ref={light} position={position} color="#ffc27a" intensity={intensity} angle={0.75} penumbra={0.7} distance={8} decay={2} castShadow={castShadow} shadow-bias={-0.0006} shadow-mapSize={[1024, 1024]} />
			<primitive object={aim} position={target} />
		</group>
	);
}

function Shell() {
	const floorTex = useLoungeTexture('/textures/floor.jpg', 6);
	const floorMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: floorTex ? '#6e6a66' : '#2a2a2c', map: floorTex, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.3, envMapIntensity: 0.35 }), [floorTex]);
	return (
		<group>
			<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.5]} material={floorMat} receiveShadow>
				<planeGeometry args={[14, 12]} />
			</mesh>
			<mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.ceiling, -0.5]}>
				<planeGeometry args={[14, 12]} />
				<meshStandardMaterial color="#08090b" roughness={1} />
			</mesh>
			{/* Side walls */}
			<mesh position={[ROOM.minX - 0.7, ROOM.ceiling / 2, -0.5]} rotation={[0, Math.PI / 2, 0]}>
				<planeGeometry args={[12, ROOM.ceiling]} />
				<meshStandardMaterial color="#232428" roughness={0.85} />
			</mesh>
			<mesh position={[ROOM.maxX + 0.7, ROOM.ceiling / 2, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
				<planeGeometry args={[12, ROOM.ceiling]} />
				<meshStandardMaterial color="#232428" roughness={0.85} />
			</mesh>
			{/* Back wall with entrance */}
			<mesh position={[0, ROOM.ceiling / 2, ROOM.maxZ + 1.2]} rotation={[0, Math.PI, 0]}>
				<planeGeometry args={[14, ROOM.ceiling]} />
				<meshStandardMaterial color="#1f2024" roughness={0.85} />
			</mesh>
			<mesh position={[0.4, 1.1, ROOM.maxZ + 1.15]}>
				<boxGeometry args={[1.2, 2.2, 0.06]} />
				<meshStandardMaterial color="#0a0a0c" />
			</mesh>
			<mesh position={[0.4, 2.35, ROOM.maxZ + 1.1]}>
				<boxGeometry args={[0.5, 0.12, 0.04]} />
				<meshStandardMaterial color="#ffe9c4" emissive="#ffb347" emissiveIntensity={1.5} />
			</mesh>
			{/* Wall sconces */}
			{[-3, 1.5].map((z) => (
				<group key={z}>
					<mesh position={[ROOM.minX - 0.62, 2.0, z]}>
						<cylinderGeometry args={[0.035, 0.035, 0.26, 12]} />
						<meshStandardMaterial color="#fff1d6" emissive="#ffc073" emissiveIntensity={0.9} />
					</mesh>
					<mesh position={[ROOM.minX - 0.66, 2.0, z]}>
						<boxGeometry args={[0.03, 0.34, 0.06]} />
						<meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
					</mesh>
					<pointLight position={[ROOM.minX - 0.4, 2.0, z]} color="#ffb866" intensity={1.2} distance={4} decay={2} />
					<mesh position={[ROOM.maxX + 0.62, 2.0, z]}>
						<cylinderGeometry args={[0.035, 0.035, 0.26, 12]} />
						<meshStandardMaterial color="#fff1d6" emissive="#ffc073" emissiveIntensity={0.9} />
					</mesh>
					<mesh position={[ROOM.maxX + 0.66, 2.0, z]}>
						<boxGeometry args={[0.03, 0.34, 0.06]} />
						<meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.3} />
					</mesh>
					<pointLight position={[ROOM.maxX + 0.4, 2.0, z]} color="#ffb866" intensity={1.2} distance={4} decay={2} />
				</group>
			))}
		</group>
	);
}

export function Lounge({ quality }: LoungeProps) {
	return (
		<group>
			<Environment resolution={quality === 'low' ? 64 : 256} frames={1}>
				<Lightformer intensity={2.5} color="#ffb870" position={[0, 3, -2]} scale={[6, 1, 1]} />
				<Lightformer intensity={1.2} color="#7fa8ff" position={[0, 1.5, -8]} scale={[16, 4, 1]} />
				<Lightformer intensity={0.6} color="#ffd9a8" position={[-6, 2, 0]} rotation-y={Math.PI / 2} scale={[4, 1, 1]} />
				<Lightformer intensity={0.6} color="#ffd9a8" position={[6, 2, 0]} rotation-y={-Math.PI / 2} scale={[4, 1, 1]} />
			</Environment>
			<Shell />
			<GlassWall quality={quality} />
			<Bar quality={quality} />
			<BackBar quality={quality} />
			{STOOLS.map((s, i) => (
				<Stool key={i} position={s.position} rotationY={s.rotationY} quality={quality} />
			))}
			{/* Window counter on the right */}
			<group>
				<mesh position={[4.6, 1.02, -4.25]}>
					<boxGeometry args={[2.6, 0.06, 0.5]} />
					<meshPhysicalMaterial color={WALNUT} roughness={0.25} clearcoat={0.8} />
				</mesh>
				<Stool position={[4.9, 0, -3.75]} rotationY={Math.PI} quality={quality} />
				<Stool position={[3.95, 0, -3.75]} rotationY={Math.PI} quality={quality} />
			</group>
			{/* Lounge seating: Sienna's table on the left rear, a second cluster by the window corner */}
			<LoungeChair position={[-4.6, 0, 0.9]} rotationY={Math.PI * 0.45} />
			<LoungeChair position={[-2.7, 0, 1.6]} rotationY={Math.PI * 1.45} />
			<LoungeChair position={[-4.0, 0, 2.6]} rotationY={Math.PI * 0.05} />
			<SideTable position={[-3.7, 0, 1.55]} />
			<LoungeChair position={[-1.2, 0, 2.7]} rotationY={Math.PI * 1.1} />
			<LoungeChair position={[-2.4, 0, 3.0]} rotationY={Math.PI * 0.9} />
			<SideTable position={[-1.8, 0, 2.4]} />
			<LoungeChair position={[3.9, 0, 1.9]} rotationY={Math.PI * 1.25} />
			<LoungeChair position={[4.8, 0, 0.8]} rotationY={Math.PI * 0.85} />
			<SideTable position={[4.6, 0, 1.75]} />
			{/* Pendants over the bar */}
			{[-28, 8, 42].map((deg) => (
				<Pendant key={deg} position={onArc(BAR_RADIUS + 0.1, deg, 2.05)} quality={quality} />
			))}
			<Pendant position={[-3.6, 2.15, 1.6]} quality={quality} />
			<Pendant position={[4.6, 2.15, -3.6]} quality={quality} />
			<Plant position={[-2.3, 0, -4.2]} scale={1.1} />
			<Plant position={[5.2, 0, 2.6]} />
			<Plant position={[-5.1, 0, 2.8]} scale={0.9} />
			<Plant position={[1.4, 0, -4.2]} scale={0.8} />
			{/* Ambient fill */}
			<hemisphereLight color="#4a5a80" groundColor="#2a1c14" intensity={0.9} />
			<directionalLight position={[0, 2.2, -9]} color="#6f8fd6" intensity={0.8} />
			{/* Warm key over the bar guests, the way the target lights her face */}
			<AimedSpot position={[-4.2, 2.8, -0.9]} target={[-3.68, 1.2, -2.94]} intensity={26} castShadow={quality === 'high'} />
			<AimedSpot position={[2.4, 2.9, -0.8]} target={[3.56, 1.2, -2.8]} intensity={18} castShadow={false} />
			<AimedSpot position={[4.2, 2.9, -2.4]} target={[4.9, 1.2, -3.75]} intensity={14} castShadow={false} />
			<AimedSpot position={[-3.6, 2.9, 0.2]} target={[-4.6, 1.0, 0.9]} intensity={14} castShadow={false} />
		</group>
	);
}
