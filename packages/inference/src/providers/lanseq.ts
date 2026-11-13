import { BaseConversationalTask } from "./providerHelper.js";

const LANSEQ_API_BASE_URL = "https://api.lanseq.cloud";

export class LanseqConversationalTask extends BaseConversationalTask {
	constructor() {
		super("lanseq", LANSEQ_API_BASE_URL);
	}
}
