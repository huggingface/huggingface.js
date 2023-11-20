// eslint-disable-next-line @typescript-eslint/no-var-requires
const defaultTheme = require("tailwindcss/defaultTheme");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const colors = require("tailwindcss/colors");

module.exports = {
	content: ["./src/**/*.{html,js,svelte,ts}"],
	darkMode: "class",
	theme: {
		container: {
			center: true,
			padding: { DEFAULT: "1rem" },
		},
		extend: {
			colors: {
				green: colors.emerald,
				yellow: colors.amber,
				purple: colors.violet,
				gray: {
					350: "#b3bcc9",
					// Dark blue
					// 925: '#131f3d',
					// 950: '#0a1226',
					// Darker
					850: "#141c2e",
					925: "#101623",
					950: "#0b0f19",
					// Darkest
					// 925: '#081122',
					// 950: '#000511',
				},
			},
			gridTemplateRows: {
				full: "100%",
			},
			fontFamily: {
				sans: ["Source Sans Pro", ...defaultTheme.fontFamily.sans],
				mono: ["IBM Plex Mono", ...defaultTheme.fontFamily.mono],
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
