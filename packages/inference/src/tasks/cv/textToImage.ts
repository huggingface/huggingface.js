import type { TextToImageInput, TextToImageOutput } from "@huggingface/tasks";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import type { BaseArgs, Options } from "../../types";
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
export async function textToImage(args: TextToImageArgs, options?: Options): Promise<TextToImageOutput> {
	if (args.provider === "together" || args.provider === "fal-ai") {
		args.prompt = args.inputs;
		args.inputs = "";
		args.response_format = "base64";
	} else if (args.provider === "replicate") {
		args.input = { prompt: args.inputs };
		delete (args as unknown as { inputs: unknown }).inputs;
	}
	const res = await request<TextToImageOutput | Base64ImageGeneration | OutputUrlImageGeneration>(args, {
		...options,
		taskHint: "text-to-image",
	});
	console.log(res);
	if (res && typeof res === "object") {
		if (args.provider === "fal-ai" && "images" in res && Array.isArray(res.images) && res.images[0].url) {
			const image = await fetch(res.images[0].url);
			return { image: await image.blob() };
		}
		if ("data" in res && Array.isArray(res.data) && res.data[0].b64_json) {
			const base64Data = res.data[0].b64_json;
			const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
			const blob = await base64Response.blob();
			return { image: blob };
		}
		if ("output" in res && Array.isArray(res.output)) {
			const urlResponse = await fetch(res.output[0]);
			const blob = await urlResponse.blob();
			return { image: blob };
		}
	}
	const isValidOutput = res && res instanceof Blob;
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected Blob");
	}
	return { image: res };
}
