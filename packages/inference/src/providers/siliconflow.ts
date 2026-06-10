/**
 * SiliconFlow provider implementation
 *
 * API Documentation: https://docs.siliconflow.com
 *
 * SiliconFlow follows the OpenAI API standard for LLMs.
 */
import { BaseConversationalTask } from "./providerHelper.js";

const SILICONFLOW_API_BASE_URL = "https://api.siliconflow.com";

export class SiliconFlowConversationalTask extends BaseConversationalTask {
	constructor() {
		super("siliconflow", SILICONFLOW_API_BASE_URL);
	}
}
