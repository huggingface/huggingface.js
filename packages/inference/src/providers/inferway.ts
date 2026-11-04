import { BaseConversationalTask } from "./providerHelper.js";

const INFERWAY_API_BASE_URL = "https://api.inferway.ai";

export class InferwayConversationalTask extends BaseConversationalTask {
	constructor() {
		super("inferway", INFERWAY_API_BASE_URL);
	}
}
