import { get, writable } from "svelte/store";
import type { ModelData } from "@huggingface/tasks";
import type { ModelLoadInfo, WidgetState } from "./shared/types.js";

export const modelLoadStates = writable<Record<ModelData["id"], ModelLoadInfo>>({});

export const widgetNoInference = writable<Record<ModelData["id"], boolean>>({});

export const isLoggedIn = writable<boolean>(false);

export const widgetStates = writable<Record<ModelData["id"], WidgetState>>({});

const tgiSupportedModels = writable<Set<string> | undefined>(undefined);

export async function getTgiSupportedModels(url: string): Promise<typeof tgiSupportedModels> {
	if (!get(tgiSupportedModels)) {
		const response = await fetch(`${url}/framework/text-generation-inference`);
		const output = await response.json();
		if (response.ok) {
			tgiSupportedModels.set(
				new Set(
					(output as { model_id: string; task: string }[])
						.filter(({ task }) => task === "text-generation")
						.map(({ model_id }) => model_id)
				)
			);
		} else {
			console.warn(response.status, output.error);
		}
	}
	return tgiSupportedModels;
}

export function updateWidgetState(modelId: ModelData["id"], key: keyof WidgetState, val: boolean): void {
	widgetStates.update((states) => {
		// Check if the modelId exists, if not initialize it
		if (!states[modelId]) {
			states[modelId] = {};
		}
		// Update the specific property for the given modelId
		states[modelId][key] = val;
		return states;
	});
}
