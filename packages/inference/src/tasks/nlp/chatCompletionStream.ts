import type { BaseArgs, Options } from "../../types";
import { streamingRequest } from "../custom/streamingRequest";
import type { ChatCompletionInput, ChatCompletionStreamOutput } from "@huggingface/tasks";

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* chatCompletionStream(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): AsyncGenerator<ChatCompletionStreamOutput> {
	yield* streamingRequest<ChatCompletionStreamOutput>(args, {
		...options,
		taskHint: "text-generation",
		chatCompletion: true,
	});
}
