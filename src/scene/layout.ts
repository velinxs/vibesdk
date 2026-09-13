import * as THREE from 'three';

/** World layout. The bar is an arc bulging toward the lounge; the glass wall is behind it. */
export const BAR_CENTER = new THREE.Vector3(0, 0, -6.5);
export const BAR_RADIUS = 4.0;
export const BAR_START = THREE.MathUtils.degToRad(-52);
export const BAR_END = THREE.MathUtils.degToRad(55);
export const STOOL_RADIUS = 5.12;
export const GLASS_Z = -4.7;
export const ROOM = { minX: -5.6, maxX: 5.6, minZ: -4.2, maxZ: 3.6, ceiling: 3.3 };
export const EXIT = new THREE.Vector3(0.4, 1.5, 3.4);

export function onArc(radius: number, degrees: number, y = 0): [number, number, number] {
	const a = THREE.MathUtils.degToRad(degrees);
	return [BAR_CENTER.x + radius * Math.sin(a), y, BAR_CENTER.z + radius * Math.cos(a)];
}

/** Rotation so a model at `from` faces `to` (models face +z locally). */
export function facing(from: [number, number, number], to: [number, number, number]): number {
	return Math.atan2(to[0] - from[0], to[2] - from[2]);
}

export interface Placement {
	position: [number, number, number];
	rotationY: number;
	seated: boolean;
	detail: 'high' | 'low';
}

export interface ConversationSeat {
	camera: [number, number, number];
	focus: [number, number, number];
}

const STOOL_ANGLES = [-40, -26, -12, 2, 16, 30, 44];

/**
 * Conversation framing follows the reference composition: the player stands
 * beside her stool, turned toward the bar, so the window is behind her and
 * the bar top runs off to one side.
 */
const maraPos = onArc(STOOL_RADIUS, -26);
const playerMaraPos = onArc(STOOL_RADIUS + 1.9, -36);
const camillePos = onArc(STOOL_RADIUS, 44);
const playerCamillePos = onArc(STOOL_RADIUS + 1.9, 54);
const elisePos: [number, number, number] = [4.9, 0, -3.75];
const playerElisePos: [number, number, number] = [3.3, 0, -2.2];
const siennaPos: [number, number, number] = [-4.6, 0, 0.9];
const playerSiennaPos: [number, number, number] = [-2.7, 0, 1.6];

export const PLACEMENTS: Record<string, Placement> = {
	mara: { position: maraPos, rotationY: facing(maraPos, playerMaraPos), seated: true, detail: 'high' },
	camille: { position: camillePos, rotationY: facing(camillePos, playerCamillePos), seated: true, detail: 'high' },
	elise: { position: elisePos, rotationY: facing(elisePos, playerElisePos), seated: true, detail: 'high' },
	sienna: { position: siennaPos, rotationY: facing(siennaPos, playerSiennaPos), seated: true, detail: 'high' },
	theo: { position: onArc(2.95, -4), rotationY: facing(onArc(2.95, -4), onArc(STOOL_RADIUS, -4)), seated: false, detail: 'high' },
	brooke: { position: [-5.1, 0, 2.2], rotationY: facing([-5.1, 0, 2.2], siennaPos), seated: false, detail: 'low' },
	dev: { position: [2.4, 0, 1.1], rotationY: facing([2.4, 0, 1.1], [0, 0, -2]), seated: false, detail: 'low' },
};

export const CONVERSATION_SEATS: Record<string, ConversationSeat> = {
	mara: { camera: [playerMaraPos[0], 1.28, playerMaraPos[2]], focus: [maraPos[0] + 0.12, 1.22, maraPos[2] - 0.1] },
	camille: { camera: [playerCamillePos[0], 1.28, playerCamillePos[2]], focus: [camillePos[0] - 0.12, 1.22, camillePos[2] - 0.1] },
	elise: { camera: [playerElisePos[0], 1.28, playerElisePos[2]], focus: [elisePos[0], 1.22, elisePos[2]] },
	sienna: { camera: [playerSiennaPos[0], 1.2, playerSiennaPos[2]], focus: [siennaPos[0], 1.08, siennaPos[2]] },
};

/** Stools face the bar, except the ones a principal has turned toward her visitor. */
const TURNED_STOOLS: Record<number, number> = { [-26]: PLACEMENTS.mara.rotationY, [44]: PLACEMENTS.camille.rotationY };
export const STOOLS = STOOL_ANGLES.map((deg) => ({ position: onArc(STOOL_RADIUS, deg), rotationY: TURNED_STOOLS[deg] ?? facing(onArc(STOOL_RADIUS, deg), onArc(BAR_RADIUS, deg)) }));

export const SPAWN = { position: [0.6, 1.62, 2.4] as [number, number, number], yaw: 0, pitch: 0 };
