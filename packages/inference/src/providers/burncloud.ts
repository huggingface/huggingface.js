/**
 * Special case: provider configuration for a private models provider (Burncloud in this case).
 */
import { BaseConversationalTask } from "./providerHelper.js";

const BURNCLOUD_API_BASE_URL = "https://ai.burncloud.com/v1";

export class BurncloudConversationalTask extends BaseConversationalTask {
	constructor() {
		// Pass clientSideRoutingOnly: true to the constructor
		super("burncloud", BURNCLOUD_API_BASE_URL, true);
	}

	override makeRoute(): string {
		return "chat/completions";
	}
}