import type { HfInference } from "../../../inference/src";

export type Data = string | Blob | ArrayBuffer;

export interface Tool {
	name: string;
	description: string;
	examples: Array<Example>;
	call?: (input: Promise<Data>, inference: HfInference) => Promise<Data>;
}

export interface Example {
	prompt: string;
	code: string;
	tools: string[];
	input?: "audio" | "image" | "document";
}

export interface Update {
	message: string;
	data: undefined | string | Blob;
}
