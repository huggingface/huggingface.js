import type { WidgetType } from "@huggingface/tasks";
import type { InferenceProvider, ModelId } from "../types";
import { HF_HUB_URL } from "../config";


export const inferenceProviderMappingCache = new Map<ModelId, InferenceProviderMapping>();

export type InferenceProviderMapping = Partial<
	Record<InferenceProvider, Omit<MappingInfo, "hfModelId" | "adapterWeightsPath">>
>;

export interface MappingInfo {
	adapter?: string;
	adapterWeightsPath?: string;
	hfModelId: ModelId;
	providerId: string;
	status: "live" | "staging";
	task: WidgetType;
}

export async function getInferenceProviderMapping(
	params: {
		accessToken?: string;
		modelId: ModelId,
		provider: InferenceProvider,
		task: WidgetType
	},
	options: {
		fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
	}
): Promise<MappingInfo | null> {
	let inferenceProviderMapping: InferenceProviderMapping | null;
	if (inferenceProviderMappingCache.has(params.modelId)) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		inferenceProviderMapping = inferenceProviderMappingCache.get(params.modelId)!;
	} else {
		inferenceProviderMapping = await (options?.fetch ?? fetch)(
			`${HF_HUB_URL}/api/models/${params.modelId}?expand[]=inferenceProviderMapping`,
			{
				headers: params.accessToken?.startsWith("hf_") ? { Authorization: `Bearer ${params.accessToken}` } : {},
			}
		)
			.then((resp) => resp.json())
			.then((json) => json.inferenceProviderMapping)
			.catch(() => null);
	}

	if (!inferenceProviderMapping) {
		throw new Error(`We have not been able to find inference provider information for model ${params.modelId}.`);
	}

	const providerMapping = inferenceProviderMapping[params.provider];
	if (providerMapping) {
		if (providerMapping.task !== params.task) {
			throw new Error(
				`Model ${params.modelId} is not supported for task ${params.task} and provider ${params.provider}. Supported task: ${providerMapping.task}.`
			);
		}
		if (providerMapping.status === "staging") {
			console.warn(
				`Model ${params.modelId} is in staging mode for provider ${params.provider}. Meant for test purposes only.`
			);
		}
		if (providerMapping.adapter === "lora") {
			const treeResp = await (options?.fetch ?? fetch)(`${HF_HUB_URL}/api/models/${params.modelId}/tree`);
			if (!treeResp.ok) {
				throw new Error(`Unable to fetch the model tree for ${params.modelId}.`);
			}
			const tree: Array<{ type: "file" | "directory"; path: string; }> = await treeResp.json();
			const adapterWeightsPath = tree.find(({ type, path }) => type === "file" && path.endsWith(".safetensors"))?.path;
			if (!adapterWeightsPath) {
				throw new Error(`No .safetensors file found in the model tree for ${params.modelId}.`);
			}
			return {
				...providerMapping,
				hfModelId: params.modelId,
				adapterWeightsPath,
			}
		}
		return { ...providerMapping, hfModelId: params.modelId };
	}
	return null;
}