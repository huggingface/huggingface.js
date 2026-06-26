
import { BaseConversationalTask } from "./providerHelper.js";

const HYPERFUSION_API_BASE_URL = "https://api.hyperfusion.io";

export class HyperfusionConversationalTask extends BaseConversationalTask  {
    constructor() {
        super("hyperfusion", HYPERFUSION_API_BASE_URL);
    }
}