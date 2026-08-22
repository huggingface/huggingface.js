import { BaseConversationalTask } from "./providerHelper.js";

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
