import { writable } from "svelte/store";
import type { ModelData } from "@huggingface/tasks";
import type { ModelLoadInfo, WidgetState } from "./shared/types.js";

export const modelLoadStates = writable<Record<ModelData["id"], ModelLoadInfo>>({});

export const widgetNoInference = writable<Record<ModelData["id"], boolean>>({});

export const widgetStates = writable<Record<ModelData["id"], WidgetState>>({});

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
