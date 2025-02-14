import type { BaseArgs, Options } from "../../types";
import { streamingRequest } from "../custom/streamingRequest";
import type { ChatCompletionInput, ChatCompletionStreamOutput } from "@huggingface/tasks";

export type CohereTextGenerationOutputFinishReason =
	| "COMPLETE"
	| "STOP_SEQUENCE"
	| "MAX_TOKENS"
	| "TOOL_CALL"
	| "ERROR";

interface CohereChatCompletionStreamOutput {
	id: string;
	finish_reason?: CohereTextGenerationOutputFinishReason;
	delta: CohereMessageDelta;
	usage?: CohereChatCompletionOutputUsage;
	logprobs?: CohereLogprob[];
}

interface CohereMessage {
	role: string;
	content: {
		type: string;
		text: string;
	};
	tool_calls?: CohereToolCall[];
}

interface CohereMessageDelta {
	message: CohereMessage;
}

interface CohereChatCompletionOutputUsage {
	billed_units: CohereInputOutputTokens;
	tokens: CohereInputOutputTokens;
}

interface CohereInputOutputTokens {
	input_tokens: number;
	output_tokens: number;
}

interface CohereLogprob {
	logprob: number;
	token: string;
	top_logprobs: CohereTopLogprob[];
}

interface CohereTopLogprob {
	logprob: number;
	token: string;
}

interface CohereToolCall {
	function: CohereFunctionDefinition;
	id: string;
	type: string;
}

interface CohereFunctionDefinition {
	arguments: unknown;
	description?: string;
	name: string;
}

function convertCohereToChatCompletionStreamOutput(res: CohereChatCompletionStreamOutput): ChatCompletionStreamOutput {
	return {
		id: res.id,
		created: Date.now(), // Assuming the current timestamp as created time
		model: "cohere-model", // Assuming a placeholder model name
		system_fingerprint: "cohere-fingerprint", // Assuming a placeholder fingerprint
		usage: res.usage
			? {
					completion_tokens: res.usage.tokens.output_tokens,
					prompt_tokens: res.usage.tokens.input_tokens,
					total_tokens: res.usage.tokens.input_tokens + res.usage.tokens.output_tokens,
			  }
			: undefined,
		choices: [
			{
				delta: {
					role: res.delta?.message?.role,
					content: res.delta?.message?.content?.text,
					tool_calls: res.delta?.message?.tool_calls
						? {
								function: {
									arguments: JSON.stringify(res.delta?.message?.tool_calls[0]?.function.arguments), // Convert arguments to string
									description: res.delta?.message?.tool_calls[0]?.function.description,
									name: res.delta?.message?.tool_calls[0]?.function.name,
								},
								id: res.delta?.message?.tool_calls[0]?.id,
								index: 0, // Assuming a single tool call with index 0
								type: res.delta?.message?.tool_calls[0]?.type,
						  }
						: undefined,
				},
				finish_reason: res.finish_reason,
				index: 0, // Assuming a single choice with index 0
				logprobs: res.logprobs
					? {
							content: res.logprobs.map((logprob) => ({
								logprob: logprob.logprob,
								token: logprob.token,
								top_logprobs: logprob.top_logprobs.map((topLogprob) => ({
									logprob: topLogprob.logprob,
									token: topLogprob.token,
								})),
							})),
					  }
					: undefined,
			},
		],
	};
}

/**
 * Use to continue text from a prompt. Same as `textGeneration` but returns generator that can be read one token at a time
 */
export async function* chatCompletionStream(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): AsyncGenerator<ChatCompletionStreamOutput> {
	yield* streamingRequest<ChatCompletionStreamOutput>(args, {
		...options,
		task: "text-generation",
		chatCompletion: true,
	});
}
