import type {
	ChatCompletionOutput,
	TextGenerationInput,
	TextGenerationOutput,
	TextGenerationOutputFinishReason,
} from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";

export type { TextGenerationInput, TextGenerationOutput };

interface TogeteherTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
	}>;
}

interface HyperbolicTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		message: { content: string };
	}>;
}

/**
 * Use to continue text from a prompt. This is a very generic task. Recommended model: gpt2 (it’s a simple model, but fun to play with).
 */
export async function textGeneration(
	args: BaseArgs & TextGenerationInput,
	options?: Options
): Promise<TextGenerationOutput> {
	if (args.provider === "together") {
		args.prompt = args.inputs;
		const raw = await request<TogeteherTextCompletionOutput>(args, {
			...options,
			task: "text-generation",
		});
		const isValidOutput =
			typeof raw === "object" && "choices" in raw && Array.isArray(raw?.choices) && typeof raw?.model === "string";
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected ChatCompletionOutput");
		}
		const completion = raw.choices[0];
		return {
			generated_text: completion.text,
		};
	} else if (args.provider === "hyperbolic") {
		const payload = {
			messages: [{ content: args.inputs, role: "user" }],
			...(args.parameters
				? {
						max_tokens: args.parameters.max_new_tokens,
						...omit(args.parameters, "max_new_tokens"),
				  }
				: undefined),
			...omit(args, ["inputs", "parameters"]),
		};
		const raw = await request<HyperbolicTextCompletionOutput>(payload, {
			...options,
			task: "text-generation",
		});
		const isValidOutput =
			typeof raw === "object" && "choices" in raw && Array.isArray(raw?.choices) && typeof raw?.model === "string";
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected ChatCompletionOutput");
		}
		const completion = raw.choices[0];
		return {
			generated_text: completion.message.content,
		};
	} else {
		const res = toArray(
			await request<TextGenerationOutput | TextGenerationOutput[]>(args, {
				...options,
				task: "text-generation",
			})
		);

		const isValidOutput =
			Array.isArray(res) && res.every((x) => "generated_text" in x && typeof x?.generated_text === "string");
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected Array<{generated_text: string}>");
		}
		return (res as TextGenerationOutput[])?.[0];
	}
}
