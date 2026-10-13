import { BaseConversationalTask } from "./providerHelper.js";

const SCITIX_API_BASE_URL = "https://api.scitix.ai/model-api";

export class ScitixConversationalTask extends BaseConversationalTask {
	constructor() {
		super("scitix", SCITIX_API_BASE_URL);
	}
}
