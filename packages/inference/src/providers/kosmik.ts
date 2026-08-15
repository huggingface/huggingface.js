import {
	BaseConversationalTask,
	TaskProviderHelper,
} from "./providerHelper.js";
import type {
	BodyParams,
	UrlParams,
	HeaderParams,
	RequestArgs,
} from "../types.js";
import type { ChatCompletionInput, ChatCompletionOutput } from "@huggingface/tasks";

/**
 * Kosmik Compute provider helper.
 *
 * OpenAI-compatible conversational endpoint serving Qwen models.
 * Supports streaming, tools, structured output, vision, and reasoning.
 */
export class KosmikConversationalTask extends BaseConversationalTask {
	constructor() {
		super("kosmik", "https://api.koscompute.com", false);
	}
}

export const kosmik = new KosmikConversationalTask();
