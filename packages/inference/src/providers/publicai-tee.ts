import { BaseConversationalTask } from "./providerHelper.js";

export class PublicAITeeConversationalTask extends BaseConversationalTask {
	constructor() {
		super("publicai-tee", "https://tee.publicai.io");
	}
}
