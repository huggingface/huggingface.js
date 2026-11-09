/**
 * See the registered mapping of Hugging Face model IDs to InferCrane model IDs here:
 *
 * https://huggingface.co/api/partners/infercrane/models
 *
 * InferCrane exposes an OpenAI-compatible conversational API. The production
 * provider endpoint is stable while qualified model execution targets can be
 * replaced behind it.
 */
import { BaseConversationalTask } from "./providerHelper.js";

const INFERCRANE_API_BASE_URL = "https://provider.infercrane.com";

export class InferCraneConversationalTask extends BaseConversationalTask {
	constructor() {
		super("infercrane", INFERCRANE_API_BASE_URL);
	}
}
