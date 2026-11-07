import { BaseConversationalTask } from "./providerHelper.js";

export class NagameConversationalTask extends BaseConversationalTask {
	constructor() {
		super("nagame", "https://api.nagame.ai");
	}
}
