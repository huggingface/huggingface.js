export interface Space {
	id: string;
	likes: number;
	author: string;
}

export interface User {
	avatarUrl: string;
}

export interface Options {
	target?: HTMLElement | null | undefined;
}
