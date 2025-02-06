import type { TextToImageInput, TextToImageOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
import { omit } from "../../utils/omit";
import { request } from "../custom/request";

export type TextToImageArgs = BaseArgs & TextToImageInput;

interface Base64ImageGeneration {
	data: Array<{
		b64_json: string;
	}>;
}
interface OutputUrlImageGeneration {
	output: string[];
}

/**
 * This task reads some text input and outputs an image.
 * Recommended model: stabilityai/stable-diffusion-2
 */
export async function textToImage(args: TextToImageArgs, options?: Options): Promise<Blob> {
	const payload =
		args.provider === "together" || args.provider === "fal-ai" || args.provider === "replicate"
			? {
					...omit(args, ["inputs", "parameters"]),
					...args.parameters,
					...(args.provider !== "replicate" ? { response_format: "base64" } : undefined),
					prompt: args.inputs,
			  }
			: args;
	const res = await request<TextToImageOutput | Base64ImageGeneration | OutputUrlImageGeneration>(payload, {
		...options,
		taskHint: "text-to-image",
	});
	if (res && typeof res === "object") {
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
