import type { WidgetType } from "@huggingface/tasks";
import type { ModelId } from "../types";

export type ProviderMapping<ProviderId extends string> = Partial<
	Record<WidgetType, Partial<Record<ModelId, ProviderId>>>
>;
