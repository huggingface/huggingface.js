import type { HfInference } from "@huggingface/inference";

export type Data = string | Blob;

export interface Tool<Input, Output> {
	name: string;
	description: string;
	examples: Array<Example>;
	call: (input: Promise<Input>, inference: HfInference) => Promise<Output>;
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
