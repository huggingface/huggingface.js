import { BaseConversationalTask } from "./providerHelper.js";
import type { BodyParams, HeaderParams } from "../types.js";
import type { ChatCompletionInput } from "../../../tasks/dist/commonjs/index.js";

// Allow override for dev (raw IP), default to prod domain
const CORVEX_API_BASE_URL =
  (typeof process !== "undefined" && (process as any)?.env?.CORVEX_API_BASE_URL) ||
  "https://api.corvex.ai";

export class CorvexConversationalTask extends BaseConversationalTask {
  private _apiKey?: string;

  constructor() {
    super("corvex", CORVEX_API_BASE_URL);
  }

  override makeBaseUrl(_params: any): string {
    return CORVEX_API_BASE_URL;
  }

  override makeRoute(): string {
    return "v1/chat/completions";
  }

  // Grab key from args (router-style), scrub router-only fields, and build OpenAI-style body
  override preparePayload(params: BodyParams<ChatCompletionInput>): Record<string, unknown> {
    const args: any = { ...(params.args as any) };

    // capture any way the key might be passed
    this._apiKey = args.apiKey ?? args.providerApiKey ?? args.accessToken ?? this._apiKey;

    // remove router-only / sensitive fields so they don't hit your API
    delete args.apiKey;
    delete args.providerApiKey;
    delete args.accessToken;
    delete args.task;

    return {
      model: params.model, // required by your API
      ...args,             // messages, temperature, max_tokens, stream, etc.
    };
  }

  // Authorize with Bearer using the captured key
  override prepareHeaders(_params: HeaderParams, isBinary: boolean): Record<string, string> {
    const headers: Record<string, string> = {};
    if (!isBinary) headers["content-type"] = "application/json";
    if (this._apiKey) headers["authorization"] = `Bearer ${this._apiKey}`;
    return headers;
  }
}
