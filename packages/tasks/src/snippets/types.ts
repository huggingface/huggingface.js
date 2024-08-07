import type { ModelData } from "../model-data";

/**
 * Minimal model data required for snippets.
 *
 * Add more fields as needed.
 */
export type ModelDataMinimal = Pick<ModelData, "id" | "pipeline_tag" | "mask_token" | "library_name" | "config">;
