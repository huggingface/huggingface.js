import { BaseConversationalTask } from "./providerHelper.js";

export class BagelNetConversational extends BaseConversationalTask {
	constructor() {
		super("bagelnet", "https://api.bagel.net", false);
	}

	override makeRoute(): string {
		return "/v1/chat/completions";
	}

	override preparePayload(params: any) {
		return {
			model: params.model,
			messages: params.messages,
			max_tokens: params.max_tokens,
			temperature: params.temperature,
			stream: params.stream ?? false,
		};
	}

	override getResponse(r: any) {
		return r;
	}
} 