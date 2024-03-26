// eslint-disable-next-line @typescript-eslint/no-namespace, @typescript-eslint/no-unused-vars
declare namespace svelteHTML {
	// enhance attributes
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface HTMLAttributes<T> {
		// If you want to use on:beforeinstallprompt
		"on:cmdEnter"?: () => void;
	}
}
