/*
 * Generates Inference API snippets using @huggingface/tasks snippets.
 *
 * If used in test mode ("pnpm test"), it compares the generated snippets with the expected ones.
 * If used in generation mode ("pnpm generate-snippets-fixtures"), it generates the expected snippets.
 *
 * Expected snippets are saved under ./snippets-fixtures and are meant to be versioned on GitHub.
 * Each snippet is saved in a separate file placed under "./{test-name}/{index}.{client}.{language}":
 *   - test-name: the name of the test (e.g. "text-to-image", "conversational-llm", etc.)
 *   - index: the order of the snippet in the array of snippets (0 if not an array)
 *   - client: the client name (e.g. "requests", "huggingface_hub", "openai", etc.). Default to "default" if client is not specified.
 *   - language: the language of the snippet (e.g. "sh", "js", "py", etc.)
 *
 * Example:
 *   ./packages/tasks-gen/snippets-fixtures/text-to-image/0.huggingface_hub.py
 */

import { existsSync as pathExists } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path/posix";

import type { InferenceProvider, InferenceSnippet } from "@huggingface/tasks";
import { snippets } from "@huggingface/tasks";

type LANGUAGE = "sh" | "js" | "py";

const TEST_CASES: {
	testName: string;
	model: snippets.ModelDataMinimal;
	languages: LANGUAGE[];
	providers: InferenceProvider[];
	opts?: Record<string, unknown>;
}[] = [
	{
		testName: "conversational-llm-non-stream",
		model: {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		},
		languages: ["sh", "js", "py"],
		providers: ["hf-inference", "together"],
		opts: { streaming: false },
	},
	{
		testName: "conversational-llm-stream",
		model: {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		},
		languages: ["sh", "js", "py"],
		providers: ["hf-inference"],
		opts: { streaming: true },
	},
	{
		testName: "conversational-vlm-non-stream",
		model: {
			id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
			pipeline_tag: "image-text-to-text",
			tags: ["conversational"],
			inference: "",
		},
		languages: ["sh", "js", "py"],
		providers: ["hf-inference"],
		opts: { streaming: false },
	},
	{
		testName: "conversational-vlm-stream",
		model: {
			id: "meta-llama/Llama-3.2-11B-Vision-Instruct",
			pipeline_tag: "image-text-to-text",
			tags: ["conversational"],
			inference: "",
		},
		languages: ["sh", "js", "py"],
		providers: ["hf-inference"],
		opts: { streaming: true },
	},
	{
		testName: "text-to-image",
		model: {
			id: "black-forest-labs/FLUX.1-schnell",
			pipeline_tag: "text-to-image",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["sh", "js", "py"],
	},
] as const;

const GET_SNIPPET_FN = {
	sh: snippets.curl.getCurlInferenceSnippet,
	js: snippets.js.getJsInferenceSnippet,
	py: snippets.python.getPythonInferenceSnippet,
} as const;

const rootDirFinder = (): string => {
	let currentPath = path.normalize(import.meta.url).replace("file:", "");

	while (currentPath !== "/") {
		if (pathExists(path.join(currentPath, "package.json"))) {
			return currentPath;
		}

		currentPath = path.normalize(path.join(currentPath, ".."));
	}

	return "/";
};

function getFixtureFolder(testName: string): string {
	return path.join(rootDirFinder(), "snippets-fixtures", testName);
}

function generateInferenceSnippet(
	model: snippets.ModelDataMinimal,
	language: LANGUAGE,
	provider: InferenceProvider,
	opts?: Record<string, unknown>
): InferenceSnippet[] {
	const generatedSnippets = GET_SNIPPET_FN[language](model, "api_token", provider, opts);
	return Array.isArray(generatedSnippets) ? generatedSnippets : [generatedSnippets];
}

async function getExpectedInferenceSnippet(
	testName: string,
	language: LANGUAGE,
	provider: InferenceProvider
): Promise<InferenceSnippet[]> {
	const fixtureFolder = getFixtureFolder(testName);
	const files = await fs.readdir(fixtureFolder);

	const expectedSnippets: InferenceSnippet[] = [];
	for (const file of files.filter((file) => file.endsWith("." + language) && file.includes(`.${provider}.`)).sort()) {
		const client = path.basename(file).split(".").slice(1, -2).join("."); // e.g. '0.huggingface.js.replicate.js' => "huggingface.js"
		const content = await fs.readFile(path.join(fixtureFolder, file), { encoding: "utf-8" });
		expectedSnippets.push(client === "default" ? { content } : { client, content });
	}
	return expectedSnippets;
}

async function saveExpectedInferenceSnippet(
	testName: string,
	language: LANGUAGE,
	provider: InferenceProvider,
	snippets: InferenceSnippet[]
) {
	const fixtureFolder = getFixtureFolder(testName);
	await fs.mkdir(fixtureFolder, { recursive: true });

	for (const [index, snippet] of snippets.entries()) {
		const file = path.join(fixtureFolder, `${index}.${snippet.client ?? "default"}.${provider}.${language}`);
		await fs.writeFile(file, snippet.content);
	}
}

if (import.meta.vitest) {
	// Run test if in test mode
	const { describe, expect, it } = import.meta.vitest;

	describe("inference API snippets", () => {
		TEST_CASES.forEach(({ testName, model, languages, providers, opts }) => {
			describe(testName, () => {
				languages.forEach((language) => {
					providers.forEach((provider) => {
						it(language, async () => {
							const generatedSnippets = generateInferenceSnippet(model, language, provider, opts);
							const expectedSnippets = await getExpectedInferenceSnippet(testName, language, provider);
							expect(generatedSnippets).toEqual(expectedSnippets);
						});
					});
				});
			});
		});
	});
} else {
	// Otherwise, generate the fixtures
	console.log("✨ Re-generating snippets");
	console.debug("  🚜 Removing existing fixtures...");
	await fs.rm(path.join(rootDirFinder(), "snippets-fixtures"), { recursive: true, force: true });

	console.debug("  🏭 Generating new fixtures...");
	TEST_CASES.forEach(({ testName, model, languages, providers, opts }) => {
		console.debug(`      ${testName} (${languages.join(", ")}) (${providers.join(", ")})`);
		languages.forEach(async (language) => {
			providers.forEach(async (provider) => {
				const generatedSnippets = generateInferenceSnippet(model, language, provider, opts);
				await saveExpectedInferenceSnippet(testName, language, provider, generatedSnippets);
			});
		});
	});
	console.log("✅ All done!");
	console.log("👉 Please check the generated fixtures before committing them.");
}
