export const HUB_URL =
	typeof process !== undefined && process.env.NODE_ENV === "test"
		? "https://hub-ci.huggingface.co"
		: "https://huggingface.co";
export const TEST_USER = "hub.js";
export const TEST_ACCESS_TOKEN = "hf_hub.js";
