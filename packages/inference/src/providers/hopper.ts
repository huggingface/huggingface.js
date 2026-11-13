import { BaseConversationalTask } from "./providerHelper.js";

export class HopperConversationalTask extends BaseConversationalTask {
	constructor() {
		super("hopper", "https://api.withhopper.com");
	}
}
