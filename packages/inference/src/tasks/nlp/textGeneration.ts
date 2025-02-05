import type {
	ChatCompletionOutput,
	TextGenerationInput,
	TextGenerationOutput,
	TextGenerationOutputFinishReason,
} from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { omit } from "../../utils/omit";
import { toArray } from "../../utils/toArray";
import { request } from "../custom/request";

export type { TextGenerationInput, TextGenerationOutput };

interface ReplicateTextCompletionOutput {
	status: string;
	output?: string[];
}

interface TogeteherTextCompletionOutput extends Omit<ChatCompletionOutput, "choices"> {
	choices: Array<{
		text: string;
		finish_reason: TextGenerationOutputFinishReason;
		seed: number;
		logprobs: unknown;
		index: number;
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
			taskHint: "text-generation",
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
	} else if (args.provider === "replicate") {
		const payload = {
			...omit(args, ["inputs", "parameters"]),
			...args.parameters,
			prompt: args.inputs,
		};

		const raw = await request<ReplicateTextCompletionOutput>(payload, {
			...options,
			taskHint: "text-generation",
		});

		if (typeof raw !== "object" || !("status" in raw)) {
			throw new InferenceOutputError("Incomplete response");
		}

		const status = raw.status;
		if (status === "starting") {
			throw new InferenceOutputError("Replicate server-side time out");
		}

		if (!("output" in raw && Array.isArray(raw?.output))) {
			throw new InferenceOutputError("Invalid response: no output");
		}

		const joined_output = raw.output.join("");

		return {
			generated_text: joined_output,
		};
	} else {
		const res = toArray(
			await request<TextGenerationOutput | TextGenerationOutput[]>(args, {
				...options,
				taskHint: "text-generation",
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
