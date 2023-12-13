// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	export interface Session {
		access_token?: string;
	}
}

declare module "@auth/core/types" {
	export interface Session {
		access_token?: string;
	}

	export interface User {
		username: string;
	}
}

export {};
