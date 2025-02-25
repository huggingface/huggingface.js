import type { TextToImageInput, TextToImageOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, InferenceProvider, Options } from "../../types";
import { omit } from "../../utils/omit";
import { request } from "../custom/request";
import { delay } from "../../utils/delay";

export type TextToImageArgs = BaseArgs & TextToImageInput;

interface Base64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}
interface OutputUrlImageGeneration {
	output: string[];
}
interface HyperbolicTextToImageOutput {
	images: Array<{ image: string }>;
}

interface BlackForestLabsResponse {
	id: string;
	polling_url: string;
}

interface TextToImageOptions extends Options {
	outputType?: "url" | "blob";
}

function getResponseFormatArg(provider: InferenceProvider) {
	switch (provider) {
		case "fal-ai":
			return { sync_mode: true };
		case "nebius":
			return { response_format: "b64_json" };
		case "replicate":
			return undefined;
		case "together":
			return { response_format: "base64" };
		default:
			return undefined;
	}
}

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(
	args: TextToImageArgs,
	options?: TextToImageOptions & { outputType: "url" }
): Promise<string>;
export async function textToImage(
	args: TextToImageArgs,
	options?: TextToImageOptions & { outputType?: undefined | "blob" }
): Promise<Blob>;
export async function textToImage(args: TextToImageArgs, options?: TextToImageOptions): Promise<Blob | string> {
	const payload =
		!args.provider || args.provider === "hf-inference" || args.provider === "sambanova"
			? args
			: {
					...omit(args, ["inputs", "parameters"]),
					...args.parameters,
					...getResponseFormatArg(args.provider),
					prompt: args.inputs,
			  };
	const res = await request<
		| TextToImageOutput
		| Base64ImageGeneration
		| OutputUrlImageGeneration
		| BlackForestLabsResponse
		| HyperbolicTextToImageOutput
	>(payload, {
		...options,
		task: "text-to-image",
	});

	if (res && typeof res === "object") {
		if (args.provider === "black-forest-labs" && "polling_url" in res && typeof res.polling_url === "string") {
			return await pollBflResponse(res.polling_url, options?.outputType);
		}
		if (args.provider === "fal-ai" && "images" in res && Array.isArray(res.images) && res.images[0].url) {
			if (options?.outputType === "url") {
				return res.images[0].url;
			} else {
				const image = await fetch(res.images[0].url);
				return await image.blob();
			}
		}
		if (
			args.provider === "hyperbolic" &&
			"images" in res &&
			Array.isArray(res.images) &&
			res.images[0] &&
			typeof res.images[0].image === "string"
		) {
			if (options?.outputType === "url") {
				return `data:image/jpeg;base64,${res.images[0].image}`;
			}
			const base64Response = await fetch(`data:image/jpeg;base64,${res.images[0].image}`);
			return await base64Response.blob();
		}
		if ("data" in res && Array.isArray(res.data) && res.data[0].b64_json) {
			const base64Data = res.data[0].b64_json;
			if (options?.outputType === "url") {
				return `data:image/jpeg;base64,${base64Data}`;
			}
			const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
			return await base64Response.blob();
		}
		if ("output" in res && Array.isArray(res.output)) {
			if (options?.outputType === "url") {
				return res.output[0];
			}
			const urlResponse = await fetch(res.output[0]);
			const blob = await urlResponse.blob();
			return blob;
		}
	}
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	if (options?.outputType === "url") {
		const b64 = await res.arrayBuffer().then((buf) => Buffer.from(buf).toString("base64"));
		return `data:image/jpeg;base64,${b64}`;
	}
	return res;
}

async function pollBflResponse(url: string, outputType?: "url" | "blob"): Promise<Blob> {
	const urlObj = new URL(url);
	for (let step = 0; step < 5; step++) {
		await delay(1000);
		console.debug(`Polling Black Forest Labs API for the result... ${step + 1}/5`);
		urlObj.searchParams.set("attempt", step.toString(10));
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
			if (outputType === "url") {
				return payload.result.sample;
			}
			const image = await fetch(payload.result.sample);
			return await image.blob();
		}
	}
	throw new InferenceOutputError("Failed to fetch result from black forest labs API");
}
