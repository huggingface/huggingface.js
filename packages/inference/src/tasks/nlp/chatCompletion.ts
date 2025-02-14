import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { request } from "../custom/request";
import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";

export type CohereTextGenerationOutputFinishReason =
	| "COMPLETE"
	| "STOP_SEQUENCE"
	| "MAX_TOKENS"
	| "TOOL_CALL"
	| "ERROR";

interface CohereChatCompletionOutput {
	id: string;
	finish_reason: CohereTextGenerationOutputFinishReason;
	message: CohereMessage;
	usage: CohereChatCompletionOutputUsage;
	logprobs?: CohereLogprob[]; // Optional field for log probabilities
}

interface CohereMessage {
	role: string;
	content: Array<{
		type: string;
		text: string;
	}>;
	tool_calls?: CohereToolCall[]; // Optional field for tool calls
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

function convertCohereToChatCompletionOutput(res: CohereChatCompletionOutput): ChatCompletionOutput {
	// Create a ChatCompletionOutput object from the CohereChatCompletionOutput
	return {
		id: res.id,
		created: Date.now(),
		model: "cohere-model",
		system_fingerprint: "cohere-fingerprint",
		usage: {
			completion_tokens: res.usage.tokens.output_tokens,
			prompt_tokens: res.usage.tokens.input_tokens,
			total_tokens: res.usage.tokens.input_tokens + res.usage.tokens.output_tokens,
		},
		choices: [
			{
				finish_reason: res.finish_reason,
				index: 0,
				message: {
					role: res.message.role,
					content: res.message.content.map((c) => c.text).join(" "),
					tool_calls: res.message.tool_calls?.map((toolCall) => ({
						function: {
							arguments: toolCall.function.arguments,
							description: toolCall.function.description,
							name: toolCall.function.name,
						},
						id: toolCall.id,
						type: toolCall.type,
					})),
				},
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
 * Use the chat completion endpoint to generate a response to a prompt, using OpenAI message completion API no stream
 */
export async function chatCompletion(
	args: BaseArgs & ChatCompletionInput,
	options?: Options
): Promise<ChatCompletionOutput> {
	const res = await request<ChatCompletionOutput>(args, {
		...options,
		task: "text-generation",
		chatCompletion: true,
	});

	const isValidOutput =
		typeof res === "object" &&
		Array.isArray(res?.choices) &&
		typeof res?.created === "number" &&
		typeof res?.id === "string" &&
		typeof res?.model === "string" &&
		/// Together.ai and Nebius do not output a system_fingerprint
		(res.system_fingerprint === undefined ||
			res.system_fingerprint === null ||
			typeof res.system_fingerprint === "string") &&
		typeof res?.usage === "object";

	if (!isValidOutput) {
		throw new InferenceOutputError("Expected ChatCompletionOutput");
	}
}
