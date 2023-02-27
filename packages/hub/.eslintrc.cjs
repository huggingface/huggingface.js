module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	parser:  "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prettier"],
	root:    true,
	env:     {
		browser: true,
		amd:     true,
		node:    true,
	},
	rules: {
		"no-constant-condition":                             "off",
		"@typescript-eslint/no-empty-function":              "off",
		"@typescript-eslint/explicit-module-boundary-types": "error",
		"@typescript-eslint/consistent-type-imports":        "error",
		"@typescript-eslint/key-spacing":                    ["error", { align: "value" }],
	},
};
