import { BaseConversationalTask } from "./providerHelper.js";

export class RuvilabConversationalTask extends BaseConversationalTask {
	constructor() {
		super("ruvilab", "https://api.ruvilab.com");
	}
}
