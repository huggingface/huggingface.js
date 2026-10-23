/**
 * See the registered mapping of HF model ID => InfraXsky model ID here:
 *
 * https://huggingface.co/api/partners/infraxsky/models
 *
 * This is a publicly available mapping.
 *
 * InfraXsky serves an OpenAI-compatible chat-completions API, so the base
 * conversational task needs no overrides.
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class InfraxskyConversationalTask extends BaseConversationalTask {
	constructor() {
		super("infraxsky", "https://kencloudapi.duckdns.org/hf");
	}
}
