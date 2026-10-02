/**
 * See the registered mapping of HF model ID => BaliLLM model ID here:
 *
 * https://huggingface.co/api/partners/balillm/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at BaliLLM and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to BaliLLM, please open an issue on the present repo
 * and we will tag BaliLLM team members.
 *
 * Thanks!
 */
import { BaseConversationalTask } from "./providerHelper.js";

// BaliLLM serves Hugging Face traffic under the /hf prefix; the client appends v1/chat/completions.
const BALILLM_API_BASE_URL = "https://api.balillm.ai/hf";

export class BaliLLMConversationalTask extends BaseConversationalTask {
	constructor() {
		super("balillm", BALILLM_API_BASE_URL);
	}
}
