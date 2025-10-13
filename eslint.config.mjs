import eslint from '@eslint/js';
import { rules } from '@lmcd/eslint-config';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
	ignores: ['dist/'],
}, eslint.configs.recommended, tseslint.configs.recommended, {
	rules: {
		...rules,
		'@typescript-eslint/no-explicit-any': ['error', {
			fixToUnknown: true,
		}],
	},
	plugins: {
		'@stylistic': stylistic,
	},
});
