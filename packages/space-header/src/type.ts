export interface Space {
	id: string;
	likes: number;
	author: string;
	type?: "user" | "org" | "unknown";
}

export interface User {
	avatarUrl: string;
}

export interface Options {
	target?: HTMLElement | null | undefined;
}

export interface Header {
	element: HTMLElement;
}
