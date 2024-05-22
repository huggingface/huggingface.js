import type { ModelDataMinimal } from "../types";

export default (model: ModelDataMinimal): string => `"The answer to the universe is ${model.mask_token}."`;
