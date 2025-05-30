
import { BaseConversationalTask } from "./providerHelper.js";

const HYPERFUSION_API_BASE_URL = "https://api.dev.hfnet.re";

export class HyperfusionConversationalTask extends BaseConversationalTask  {
    constructor() {
        super("hyperfusion", HYPERFUSION_API_BASE_URL, true);
    }
}