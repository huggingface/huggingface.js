import type { ChatCompletionInput, ChatCompletionStreamOutput } from "@huggingface/tasks";
import type { BaseArgs, Options } from "../../types";
import { innerStreamingRequest } from "../../utils/request";

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* chatCompletionStream(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): AsyncGenerator<ChatCompletionStreamOutput> {
	yield* innerStreamingRequest<ChatCompletionStreamOutput>(args, {
		...options,
		task: "conversational",
	});
}
