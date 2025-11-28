/**
 * Minimal production-focused ESLint flat config for a TypeScript Node project.
 * Recommended dev dependencies:
 *   npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin @eslint/eslintrc eslint-config-prettier
 *
 * This file uses the "flat" config format (ESM) available in ESLint v8+.
 */

import { FlatCompat } from "@eslint/eslintrc";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const compat = new FlatCompat({
	recommendedConfig: {},
});

export default [
	// Extend recommended rule sets (via FlatCompat for legacy shareable configs)
	...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),

	// TypeScript files
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2021,
				sourceType: "module",
				// point at your tsconfig so rules like no-floating-promises / project based rules work
				project: "./tsconfig.json",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
		},
		rules: {
			// Avoid noisy console output in production by warning
			"no-console": "warn",
			// Use strict equality
			eqeqeq: ["error", "always"],
			// Always use braces for blocks
			curly: "none",
			// Prevent common async mistakes
			"no-async-promise-executor": "error",
			"no-return-await": "error",
			"require-atomic-updates": "error",
			// Encourage modern declarations
			"prefer-const": "error",
			"no-var": "error",
			// Prevent redeclarations and shadowing which cause subtle bugs
			"no-redeclare": "error",
			"no-shadow": "error",
			// Avoid implicit coercions that hide intent
			"no-implicit-coercion": "error",
			// Warn on magic numbers (allow common ones)
			"no-magic-numbers": ["warn", { ignore: [0, 1, -1], ignoreArrayIndexes: true }],
			// Use TypeScript-aware unused-vars
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
			],
			// Discourage any; allow gradual adoption
			"@typescript-eslint/no-explicit-any": "warn",
			// Module boundary types can be noisy; keep off but consider enabling
			"@typescript-eslint/explicit-module-boundary-types": "off",
		},
	},

	// JavaScript files (lighter rules)
	{
		files: ["**/*.js"],
		languageOptions: {
			parserOptions: {
				ecmaVersion: 2021,
				sourceType: "module",
			},
		},
		rules: {
			"no-console": "warn",
			eqeqeq: ["error", "always"],
			curly: "error",
			"no-var": "error",
			"prefer-const": "error",
		},
	},
];
