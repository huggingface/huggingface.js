import { BaseConversationalTask } from "./providerHelper.js";

export class OpenRouterConversationalTask extends BaseConversationalTask {
	constructor() {
		super("openrouter", "https://openrouter.ai");
	}
	override makeRoute(): string {
		return "/api/v1/chat/completions";
	}
}
