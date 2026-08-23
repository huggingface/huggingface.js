/**
 * See the registered mapping of HF model ID => LLM Tech model ID here:
 *
 * https://huggingface.co/api/partners/llmtech/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at LLM Tech and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to LLM Tech, please open an issue on the present repo
 * and we will tag LLM Tech team members.
 *
 * Thanks!
 */

import { BaseConversationalTask } from "./providerHelper.js";

export class LLMTechConversationalTask extends BaseConversationalTask {
	constructor() {
		super("llmtech", "https://api.llmtech.eu");
	}
}
