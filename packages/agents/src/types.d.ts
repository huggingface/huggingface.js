import type { HfInference, TextGenerationStreamOutput } from "@huggingface/inference";
import type { AgentScratchpad } from "./AgentScratchpad";

export type Data = string | Blob;

export interface Tool {
	name: string;
	description: string;
	examples: Array<Example>;
	model?: string;
	mime?: string;
	call?: (input: Promise<Data> | Data, inference: HfInference) => Promise<Data>;
}

export interface Example {
	prompt: string;
	code: string;
	tools: string[];
	inputs?: Inputs;
}

export type StepType = "toolCheck" | "plan" | "toolInput" | "finalAnswer";
export interface Update {
	stepType: StepType;
	message: boolean | Data;
}

export type Inputs = Partial<Record<"audio" | "image" | "text", boolean>>;

export type LLM = (prompt: string) => AsyncGenerator<TextGenerationStreamOutput>;

export interface Message {
	from: "user" | "assistant";
	content: string;
	scratchpad?: AgentScratchpad;
}

export type Chat = Message[];

export type Template<T> = (inputs: T, options?: RuntimeOptions) => string;

export type Files = Record<string, Data>;
