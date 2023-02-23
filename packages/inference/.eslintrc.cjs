module.exports = {
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:typescript-sort-keys/recommended",
		"prettier",
	],
	parser:  "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prettier"],
	root:    true,
	env:     {
		browser: true,
		jest:    true,
		node:    true,
	},
	rules: {
		"@typescript-eslint/no-empty-function":              "off",
		"@typescript-eslint/explicit-module-boundary-types": "error",
		"@typescript-eslint/consistent-type-imports":        "error",
		"@typescript-eslint/key-spacing":                    ["error", { align: "value" }],
	},
};
