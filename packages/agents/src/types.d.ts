import type { HfInference } from "@huggingface/inference";

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
	inputs?: Inputs;
}

export interface Update {
	message: string;
	data: undefined | string | Blob;
}

export type Inputs = Partial<Record<"audio" | "image" | "text", boolean>>;

export type LLM = (prompt: string) => Promise<string>;
