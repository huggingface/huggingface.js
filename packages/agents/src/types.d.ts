import type { HfInference } from "@huggingface/inference";

export type Data = string | Blob;

export interface Tool {
	name: string;
	description: string;
	examples: Array<Example>;
	call?: (input: Promise<Data> | Data, inference: HfInference) => Promise<Data>;
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

export interface Message {
	from: "user" | "assistant";
	content: string;
	scratchpad?: Message[];
	image?: Blob;
	audio?: Blob;
}

export type Chat = Message[];

export type Template<T> = (inputs: T, options?: RuntimeOptions) => string;
