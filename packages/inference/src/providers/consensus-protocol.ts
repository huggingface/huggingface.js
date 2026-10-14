import { BaseConversationalTask } from "./providerHelper.js";

export class ConsensusProtocolConversationalTask extends BaseConversationalTask {
	constructor() {
		super("consensus-protocol", "https://api.consensusprotocol.org");
	}
}
