module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:svelte/recommended", "prettier"],
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prettier"],
	root: true,
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 2020,
		extraFileExtensions: [".svelte"],
	},
	rules: {
		"no-constant-condition": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/explicit-module-boundary-types": "error",
		"@typescript-eslint/consistent-type-imports": "error",
		"@typescript-eslint/no-unused-vars": "error",
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/no-explicit-any": "error",
		"@typescript-eslint/no-empty-interfaces": "off",
		// For doc purposes, prefer interfaces
		"@typescript-eslint/consistent-type-definitions": ["error", "interface"],
	},
	overrides: [
		{
			files: ["*.svelte"],
			parser: "svelte-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},
	],
	// TODO: Remove these eslint rules
	// Disable eslint for JS files (and TS declaration files, generated with JSDoc)
	ignorePatterns: ["packages/templates/src/**/*.js", "packages/templates/types/**/*.d.ts", "packages/templates/dist/*"],
};
