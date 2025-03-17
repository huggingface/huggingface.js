import type { BaseArgs, InferenceProvider, Options } from "../../types";
import type { TextToVideoInput } from "@huggingface/tasks";
import { request } from "../custom/request";
import { omit } from "../../utils/omit";
import { isUrl } from "../../lib/isUrl";
import { InferenceOutputError } from "../../lib/InferenceOutputError";
import { typedInclude } from "../../utils/typedInclude";
import { makeRequestOptions } from "../../lib/makeRequestOptions";
import { delay } from "../../utils/delay";

export type TextToVideoArgs = BaseArgs & TextToVideoInput;

export type TextToVideoOutput = Blob;

interface FalAiOutput {
	request_id: string;
	status: string;
}

interface ReplicateOutput {
	output: string;
}

interface NovitaOutput {
	video: {
		video_url: string;
	};
}

const SUPPORTED_PROVIDERS = ["fal-ai", "novita", "replicate"] as const satisfies readonly InferenceProvider[];

export async function textToVideo(args: TextToVideoArgs, options?: Options): Promise<TextToVideoOutput> {
	if (!args.provider || !typedInclude(SUPPORTED_PROVIDERS, args.provider)) {
		throw new Error(
			`textToVideo inference is only supported for the following providers: ${SUPPORTED_PROVIDERS.join(", ")}`
		);
	}

	const payload =
		args.provider === "fal-ai" || args.provider === "replicate" || args.provider === "novita"
			? { ...omit(args, ["inputs", "parameters"]), ...args.parameters, prompt: args.inputs }
			: args;
	const res = await request<FalAiOutput | ReplicateOutput | NovitaOutput>(payload, {
		...options,
		task: "text-to-video",
	});
	if (args.provider === "fal-ai") {
		return await pollFalResponse(res as FalAiOutput, args, options);
	} else if (args.provider === "novita") {
		const isValidOutput =
			typeof res === "object" &&
			!!res &&
			"video" in res &&
			typeof res.video === "object" &&
			!!res.video &&
			"video_url" in res.video &&
			typeof res.video.video_url === "string" &&
			isUrl(res.video.video_url);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { video: { video_url: string } }");
		}
		const urlResponse = await fetch((res as NovitaOutput).video.video_url);
		return await urlResponse.blob();
	} else {
		/// TODO: Replicate: handle the case where the generation request "times out" / is async (ie output is null)
		/// https://replicate.com/docs/topics/predictions/create-a-prediction
		const isValidOutput =
			typeof res === "object" && !!res && "output" in res && typeof res.output === "string" && isUrl(res.output);
		if (!isValidOutput) {
			throw new InferenceOutputError("Expected { output: string }");
		}
		const urlResponse = await fetch(res.output);
		return await urlResponse.blob();
	}
}

async function pollFalResponse(res: FalAiOutput, args: TextToVideoArgs, options?: Options): Promise<Blob> {
	const requestId = res.request_id;
	if (!requestId) {
		throw new InferenceOutputError("No request ID found in the response");
	}
	let status = res.status;
	const { url, info } = await makeRequestOptions(args, { ...options, task: "text-to-video" });
	const baseUrl = url?.split("?")[0] || "";
	const query = url?.includes("_subdomain=queue") ? "?_subdomain=queue" : "";

	const statusUrl = `${baseUrl}/requests/${requestId}/status${query}`;
	const resultUrl = `${baseUrl}/requests/${requestId}${query}`;

	while (status !== "COMPLETED") {
		await delay(1000);
		const statusResponse = await fetch(statusUrl, { headers: info.headers });

		if (!statusResponse.ok) {
			throw new Error(`HTTP error! status: ${statusResponse.status}`);
		}
		status = (await statusResponse.json()).status;
	}

	const resultResponse = await fetch(resultUrl, { headers: info.headers });
	const result = await resultResponse.json();
	const isValidOutput =
		typeof result === "object" &&
		!!result &&
		"video" in result &&
		typeof result.video === "object" &&
		!!result.video &&
		"url" in result.video &&
		typeof result.video.url === "string" &&
		isUrl(result.video.url);
	if (!isValidOutput) {
		throw new InferenceOutputError("Expected { video: { url: string } }");
	}
	const urlResponse = await fetch(result.video.url);
	return await urlResponse.blob();
}
