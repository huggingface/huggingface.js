import { BaseConversationalTask } from "./providerHelper.js";

export class GMICloudConversationalTask extends BaseConversationalTask {
	constructor() {
		super("gmicloud", "https://api.gmi-serving.com");
	}
}