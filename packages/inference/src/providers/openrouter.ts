import { BaseConversationalTask } from "./providerHelper.js";

export class OpenRouterConversationalTask extends BaseConversationalTask {
	constructor() {
		super("openrouter", "https://openrouter.ai/api");
	}
}
