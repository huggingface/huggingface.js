/**
 * CentML provider implementation for serverless inference.
 * This provider supports chat completions and text generation through CentML's serverless endpoints.
 */
import { BaseConversationalTask, BaseTextGenerationTask } from "./providerHelper";

const CENTML_API_BASE_URL = "https://api.centml.com";

export class CentMLConversationalTask extends BaseConversationalTask {
	constructor() {
		super("centml", CENTML_API_BASE_URL);
	}

	override makeRoute(): string {
		return "openai/v1/chat/completions";
	}
}
