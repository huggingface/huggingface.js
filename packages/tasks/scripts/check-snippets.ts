/*
 * Generates inference snippets as they would be shown on the Hub for Curl, JS and Python.
 * Snippets will only be printed to the terminal to make it easier to debug when making changes to the snippets.
 *
 * Usage:
 *   pnpm run check-snippets --pipeline-tag="text-generation" --tags="conversational"
 *   pnpm run check-snippets --pipeline-tag="image-text-to-text" --tags="conversational"
 *   pnpm run check-snippets --pipeline-tag="text-to-image"
 *
 * This script is meant only for debug purposes.
 */
import { python, curl, js } from "../src/snippets/index";
import type { InferenceSnippet, ModelDataMinimal } from "../src/snippets/types";
import type { PipelineType } from "../src/pipelines";

// Parse command-line arguments
const args = process.argv.slice(2).reduce(
	(acc, arg) => {
		const [key, value] = arg.split("=");
		acc[key.replace("--", "")] = value;
		return acc;
	},
	{} as { [key: string]: string }
);

const accessToken = "hf_**********";
const pipelineTag = (args["pipeline-tag"] || "text-generation") as PipelineType;
const tags = (args["tags"] ?? "").split(",");

const modelMinimal: ModelDataMinimal = {
	id: "llama-6-1720B-Instruct",
	pipeline_tag: pipelineTag,
	tags: tags,
	inference: "****",
};

const printSnippets = (snippets: InferenceSnippet | InferenceSnippet[], language: string) => {
	const snippetArray = Array.isArray(snippets) ? snippets : [snippets];
	snippetArray.forEach((snippet) => {
		console.log(`\n\x1b[33m${language} ${snippet.client}\x1b[0m`);
		console.log(`\n\`\`\`${language.toLowerCase()}\n${snippet.content}\n\`\`\`\n`);
	});
};

const generateAndPrintSnippets = (
	generator: (model: ModelDataMinimal, token: string) => InferenceSnippet | InferenceSnippet[],
	language: string
) => {
	const snippets = generator(modelMinimal, accessToken);
	printSnippets(snippets, language);
};

generateAndPrintSnippets(curl.getCurlInferenceSnippet, "Curl");
generateAndPrintSnippets(python.getPythonInferenceSnippet, "Python");
generateAndPrintSnippets(js.getJsInferenceSnippet, "JS");
