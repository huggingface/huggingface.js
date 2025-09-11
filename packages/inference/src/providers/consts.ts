import type { InferenceProvider, ModelId, InferenceProviderMappingEntry } from "../types.js";

export const HARDCODED_MODEL_INFERENCE_MAPPING: Record<
  InferenceProvider,
  Record<ModelId, InferenceProviderMappingEntry>
> = {
  "black-forest-labs": {},
  cerebras: {},
  cohere: {},
  "fal-ai": {},
  "featherless-ai": {},
  "fireworks-ai": {},
  groq: {},
  "hf-inference": {},
  hyperbolic: {},
  nebius: {},
  novita: {},
  nscale: {},
  openai: {},
  ovhcloud: {},
  replicate: {},
  sambanova: {},
  scaleway: {},
  together: {},
  // 👇 add this line
  corvex: {
    tinyllama: {
      hfModelId: "tinyllama",
      provider: "corvex",
      providerId: "tinyllama",
      status: "staging",
      task: "conversational"
    },
  },
};
