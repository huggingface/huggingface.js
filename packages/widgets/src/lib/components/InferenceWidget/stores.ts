import { writable } from "svelte/store";
import type { ModelLoadInfo } from "./shared/types.js";

export const modelLoadStates = writable<Record<string, ModelLoadInfo>>({});
