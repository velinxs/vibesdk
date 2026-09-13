import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{ ignores: ['dist', 'worker-configuration.d.ts', '.wrangler', '.dream-loop'] },
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['src/**/*.{ts,tsx}', 'worker/**/*.ts', 'shared/**/*.ts'],
		languageOptions: {
			ecmaVersion: 2022,
			globals: { ...globals.browser, ...globals.node },
		},
		plugins: { 'react-hooks': reactHooks },
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'error',
		},
	},
);
