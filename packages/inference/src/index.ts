export { InferenceClient, InferenceClientEndpoint, HfInference } from "./InferenceClient";
export { InferenceOutputError } from "./lib/InferenceOutputError";
export * from "./types";
export * from "./tasks";

let snippets = {};
if (typeof window === "undefined") {
	snippets = import("./snippets").then((mod) => mod.default);
}
export { snippets };
