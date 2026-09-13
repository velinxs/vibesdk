import { useEffect, useState } from 'react';
import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const cache = new Map<string, Promise<THREE.Texture | null>>();

export interface TextureOptions {
	repeat?: number;
	srgb?: boolean;
	mirrored?: boolean;
	/** Optional UV window as [repeatX, repeatY, offsetX, offsetY], applied after repeat. */
	window?: [number, number, number, number];
}

function load(url: string, repeat: number, srgb: boolean, mirrored: boolean, window?: TextureOptions['window']): Promise<THREE.Texture | null> {
	const key = `${url}|${repeat}|${srgb}|${mirrored}|${window?.join(',') ?? ''}`;
	let pending = cache.get(key);
	if (!pending) {
		pending = new Promise((resolve) => {
			loader.load(
				url,
				(texture) => {
					texture.wrapS = mirrored ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
					texture.wrapT = mirrored ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
					texture.repeat.set(repeat, mirrored ? 1 : repeat);
					if (window) {
						texture.repeat.set(window[0], window[1]);
						texture.offset.set(window[2], window[3]);
					}
					texture.anisotropy = 8;
					texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
					resolve(texture);
				},
				undefined,
				() => resolve(null),
			);
		});
		cache.set(key, pending);
	}
	return pending;
}

let spriteTexture: THREE.Texture | null = null;

/** Soft radial sprite used for distant city bokeh. Generated once, no asset needed. */
export function bokehSprite(): THREE.Texture {
	if (spriteTexture) return spriteTexture;
	const size = 64;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (ctx) {
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
	}
	spriteTexture = new THREE.CanvasTexture(canvas);
	return spriteTexture;
}

/** Loads a texture without suspending; returns null until ready or if the file is missing. */
export function useLoungeTexture(url: string, repeat = 1, options: Omit<TextureOptions, 'repeat'> = {}): THREE.Texture | null {
	const { srgb = true, mirrored = false, window } = options;
	const windowKey = window?.join(',') ?? '';
	const [texture, setTexture] = useState<THREE.Texture | null>(null);
	useEffect(() => {
		let active = true;
		const parsed = windowKey ? (windowKey.split(',').map(Number) as [number, number, number, number]) : undefined;
		load(url, repeat, srgb, mirrored, parsed).then((t) => {
			if (active) setTexture(t);
		});
		return () => {
			active = false;
		};
	}, [url, repeat, srgb, mirrored, windowKey]);
	return texture;
}
