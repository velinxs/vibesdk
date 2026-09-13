import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';
import path from 'node:path';
import fs from 'node:fs';

/**
 * AH_DEMO=1 runs the worker without the Workers AI binding so the authored
 * demo mode works with no Cloudflare login. The demo config is derived from
 * wrangler.jsonc at startup so the two never drift.
 */
function wranglerConfigPath(): string {
	if (process.env.AH_DEMO !== '1') {
		return 'wrangler.jsonc';
	}
	const source = fs.readFileSync(path.resolve(import.meta.dirname, 'wrangler.jsonc'), 'utf8');
	const parsed = JSON.parse(source.replace(/^\s*\/\/.*$/gm, '')) as Record<string, unknown>;
	delete parsed.ai;
	parsed.vars = { ...(parsed.vars as Record<string, string>), AI_PROVIDER: 'demo' };
	// Written next to wrangler.jsonc so the relative `main` path resolves the same way.
	const target = path.resolve(import.meta.dirname, 'wrangler.demo.json');
	fs.writeFileSync(target, JSON.stringify(parsed, null, 2));
	return target;
}

export default defineConfig({
	plugins: [react(), cloudflare({ configPath: wranglerConfigPath() })],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src'),
			shared: path.resolve(import.meta.dirname, './shared'),
		},
	},
	server: {
		allowedHosts: true,
	},
	build: {
		sourcemap: false,
		chunkSizeWarningLimit: 1500,
	},
});
