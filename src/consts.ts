export const HUB_URL = process.env.NODE_ENV === "test" ? "https://hub-ci.huggingface.co/" : "https://huggingface.co";
export const HUB_API_URL = `${HUB_URL}/api`;
export const TEST_USER = "huggingface-hub.js";
export const TEST_ACCESS_TOKEN = "hf_huggingface-hub.js";
