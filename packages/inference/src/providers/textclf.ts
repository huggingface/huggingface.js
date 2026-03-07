import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper.js";

/**
 * See the registered mapping of HF model ID => TextCLF model ID here:
 *
 * https://huggingface.co/api/partners/textclf/models
 *
 * This is a publicly available mapping.
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 *
 * - If you work at TextCLF and want to update this mapping, please use the model mapping API we provide on huggingface.co
 * - If you're a community member and want to add a new supported HF model to TextCLF, please open an issue on the present repo
 * and we will tag TextCLF team members.
 *
 * Thanks!
 */

const TEXTCLF_API_BASE_URL = "https://api.textclf.com";

export class TextCLFTextGenerationTask extends BaseTextGenerationTask {
	constructor() {
		super("textclf", TEXTCLF_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v1/chat/completions";
	}
}

export class TextCLFConversationalTask extends BaseConversationalTask {
	constructor() {
		super("textclf", TEXTCLF_API_BASE_URL);
	}

	override makeRoute(): string {
		return "/v1/chat/completions";
	}
}
