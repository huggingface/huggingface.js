import type { InferenceProvider, InferenceProviderMappingEntry } from "../types.js";
import { type ModelId } from "../types.js";

/**
 * If you want to try to run inference for a new model locally before it's registered on huggingface.co
 * for a given Inference Provider,
 * you can add it to the following dictionary, for dev purposes.
 *
 * We also inject into this dictionary from tests.
 */
export const HARDCODED_MODEL_INFERENCE_MAPPING: Record<
	InferenceProvider,
	Record<ModelId, InferenceProviderMappingEntry>
> = {
	/**
	 * "HF model ID" => "Model ID on Inference Provider's side"
	 *
	 * Example:
	 * "Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen2.5-Coder-32B-Instruct",
	 */
	baseten: {},
	"black-forest-labs": {},
	cerebras: {},
	clarifai: {},
	cohere: {},
	deepinfra: {},
	"fal-ai": {
		// Dev mappings until these are registered for fal-ai on huggingface.co.
		"nvidia/nemotron-3.5-asr-streaming-0.6b": {
			provider: "fal-ai",
			hfModelId: "nvidia/nemotron-3.5-asr-streaming-0.6b",
			providerId: "nvidia/nemotron-asr-multilingual/asr",
			status: "live",
			task: "automatic-speech-recognition",
		},
		// PersonaPlex (pipeline_tag: audio-to-audio). The batch endpoint takes audio in and
		// returns { audio: { url }, text } — handled by FalAIAudioToAudioTask. Note: this is the
		// one-shot speech-to-speech turn; the real-time full-duplex mode is WebSocket-only and
		// not reachable through this HTTP/queue client.
		"nvidia/personaplex-7b-v1": {
			provider: "fal-ai",
			hfModelId: "nvidia/personaplex-7b-v1",
			providerId: "fal-ai/personaplex",
			status: "live",
			task: "audio-to-audio",
		},
	},
	"featherless-ai": {},
	"fireworks-ai": {},
	groq: {},
	"hf-inference": {},
	hyperbolic: {},
	nebius: {},
	novita: {},
	nscale: {},
	nvidia: {},
	openai: {},
	publicai: {},
	ovhcloud: {},
	replicate: {},
	sambanova: {},
	scaleway: {},
	together: {},
	wavespeed: {},
	"zai-org": {},
};
