import type { TextToImageInput, TextToImageOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { omit } from "../../utils/omit";
import { request } from "../custom/request";
import { delay } from "../../utils/delay";
import { randomUUID } from "crypto";

export type TextToImageArgs = BaseArgs & TextToImageInput;

interface Base64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}
interface OutputUrlImageGeneration {
	output: string[];
}
interface BlackForestLabsResponse {
	id: string;
	polling_url: string;
}

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(args: TextToImageArgs, options?: Options): Promise<Blob> {
	const payload =
		args.provider === "together" ||
		args.provider === "fal-ai" ||
		args.provider === "replicate" ||
		args.provider === "black-forest-labs"
			? {
					...omit(args, ["inputs", "parameters"]),
					...args.parameters,
					...(args.provider !== "replicate" ? { response_format: "base64" } : undefined),
					prompt: args.inputs,
			  }
			: args;
	const res = await request<
		TextToImageOutput | Base64ImageGeneration | OutputUrlImageGeneration | BlackForestLabsResponse
	>(payload, {
		...options,
		taskHint: "text-to-image",
	});
	if (res && typeof res === "object") {
		if (args.provider === "black-forest-labs" && "polling_url" in res && typeof res.polling_url === "string") {
			return await pollBflResponse(res.polling_url);
		}
		if (args.provider === "fal-ai" && "images" in res && Array.isArray(res.images) && res.images[0].url) {
			const image = await fetch(res.images[0].url);
			return await image.blob();
		}
		if ("data" in res && Array.isArray(res.data) && res.data[0].b64_json) {
			const base64Data = res.data[0].b64_json;
			const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
			const blob = await base64Response.blob();
			return blob;
		}
		if ("output" in res && Array.isArray(res.output)) {
			const urlResponse = await fetch(res.output[0]);
			const blob = await urlResponse.blob();
			return blob;
		}
	}
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return res;
}

async function pollBflResponse(url: string): Promise<Blob> {
	const urlObj = new URL(url);
	for (let step = 0; step < 5; step++) {
		await delay(1000);
		console.debug(`Polling Black Forest Labs API for the result... ${step + 1}/5`);
		urlObj.searchParams.set("uuid", randomUUID());
		const resp = await fetch(urlObj, { headers: { "Content-Type": "application/json" } });
		if (!resp.ok) {
			throw new InferenceOutputError("Failed to fetch result from black forest labs API");
		}
		const payload = await resp.json();
		if (
			typeof payload === "object" &&
			payload &&
			"status" in payload &&
			typeof payload.status === "string" &&
			payload.status === "Ready" &&
			"result" in payload &&
			typeof payload.result === "object" &&
			payload.result &&
			"sample" in payload.result &&
			typeof payload.result.sample === "string"
		) {
			const image = await fetch(payload.result.sample);
			return await image.blob();
		}
	}
	throw new InferenceOutputError("Failed to fetch result from black forest labs API");
}
