import type { Options, TextGenerationArgs, TextGenerationStreamReturn } from "../types";
import { streamingRequest } from "./streamingRequest";

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* textGenerationStream(
	args: TextGenerationArgs,
	options?: Options
): AsyncGenerator<TextGenerationStreamReturn> {
	yield* streamingRequest<TextGenerationStreamReturn>(args, options);
}
