import { BaseConversationalTask } from "./providerHelper.js";

const HUMAIN_API_BASE_URL = "https://api.node.humain.com";

export class HumainAIConversationalTask extends BaseConversationalTask {
	constructor() {
		super("humain-ai", HUMAIN_API_BASE_URL);
	}
}
