import { writable } from "svelte/store";
import type { ModelLoadInfo } from "./shared/types";

export const modelLoadStates = writable<Record<string, ModelLoadInfo>>({});
