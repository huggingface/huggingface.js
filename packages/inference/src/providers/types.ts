import type { InferenceTask, ModelId } from "../types";

export type ProviderMapping<ProviderId extends string> = Partial<
	Record<InferenceTask | "conversational", Partial<Record<ModelId, ProviderId>>>
>;
