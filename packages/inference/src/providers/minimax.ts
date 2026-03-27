/**
 * MiniMax AI provider integration.
 *
 * MiniMax provides OpenAI-compatible chat completions API.
 *
 * API docs: https://platform.minimax.io/docs/api-reference/text-openai-api
 *
 * Supported models:
 * - MiniMax-M2.7: Peak Performance, Ultimate Value
 * - MiniMax-M2.7-highspeed: Same performance, faster and more agile
 *
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co,
 * you can add it to the dictionary "HARDCODED_MODEL_ID_MAPPING" in consts.ts, for dev purposes.
 */

import type { ChatCompletionInput, TextToSpeechInput } from "@huggingface/tasks";
import { InferenceClientProviderOutputError } from "../errors.js";
import type { BaseArgs, BodyParams } from "../types.js";
import { BaseConversationalTask, TaskProviderHelper, type TextToSpeechTaskHelper } from "./providerHelper.js";

const MINIMAX_API_BASE_URL = "https://api.minimax.io";

export class MiniMaxConversationalTask extends BaseConversationalTask {
	constructor() {
		super("minimax", MINIMAX_API_BASE_URL, true);
	}

	override preparePayload(params: BodyParams<ChatCompletionInput>): Record<string, unknown> {
		const payload = super.preparePayload(params) as Record<string, unknown>;

		// MiniMax requires temperature in range (0.0, 1.0] — cannot be 0
		if (typeof payload.temperature === "number" && payload.temperature <= 0) {
			payload.temperature = 0.01;
		}

		// MiniMax does not support response_format
		delete payload.response_format;

		return payload;
	}
}

interface MiniMaxTextToSpeechResponse {
	data?: {
		audio?: string;
	};
	base_resp?: {
		status_code?: number;
		status_msg?: string;
	};
}

export class MiniMaxTextToSpeechTask extends TaskProviderHelper implements TextToSpeechTaskHelper {
	constructor() {
		super("minimax", MINIMAX_API_BASE_URL, true);
	}

	override makeRoute(): string {
		return "v1/t2a_v2";
	}

	override preparePayload(params: BodyParams<TextToSpeechInput & BaseArgs>): Record<string, unknown> {
		return {
			model: params.model || "speech-2.8-hd",
			text: params.args.inputs,
			voice_setting: {
				voice_id: "English_Graceful_Lady",
			},
			audio_setting: {
				format: "mp3",
			},
		};
	}

	override async getResponse(response: unknown): Promise<Blob> {
		const res = response as MiniMaxTextToSpeechResponse;

		if (res?.base_resp?.status_code && res.base_resp.status_code !== 0) {
			throw new InferenceClientProviderOutputError(
				`MiniMax TTS API error: ${res.base_resp.status_msg || "unknown error"}`
			);
		}

		if (typeof res?.data?.audio !== "string" || !res.data.audio) {
			throw new InferenceClientProviderOutputError(
				`Received malformed response from MiniMax TTS API: expected { data: { audio: string } } format`
			);
		}

		// MiniMax returns hex-encoded audio data
		const hexString = res.data.audio;
		const bytes = new Uint8Array(hexString.length / 2);
		for (let i = 0; i < hexString.length; i += 2) {
			bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
		}

		return new Blob([bytes], { type: "audio/mpeg" });
	}
}
