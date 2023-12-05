import { writable } from "svelte/store";
import type { ModelData } from "@huggingface/tasks";
import type { ModelLoadInfo } from "./shared/types.js";

export const modelLoadStates = writable<Record<ModelData["id"], ModelLoadInfo>>({});

export const widgetNoInference = writable<Record<ModelData["id"], boolean>>({});
