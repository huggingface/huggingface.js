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

import { snippets } from "@huggingface/inference";
import type { SnippetInferenceProvider, InferenceSnippet, ModelDataMinimal } from "@huggingface/tasks";

const LANGUAGES = ["js", "python", "sh"] as const;
type Language = (typeof LANGUAGES)[number];
const EXTENSIONS: Record<Language, string> = { sh: "sh", js: "js", python: "py" };

const TEST_CASES: {
	testName: string;
	model: ModelDataMinimal;
	languages: Language[];
	providers: SnippetInferenceProvider[];
	opts?: Record<string, unknown>;
}[] = [
	{
		testName: "automatic-speech-recognition",
		model: {
			id: "openai/whisper-large-v3-turbo",
			pipeline_tag: "automatic-speech-recognition",
			tags: [],
			inference: "",
		},
		languages: ["js", "python", "sh"],
		providers: ["hf-inference"],
	},
	{
		testName: "conversational-llm-non-stream",
		model: {
			id: "meta-llama/Llama-3.1-8B-Instruct",
			pipeline_tag: "text-generation",
			tags: ["conversational"],
			inference: "",
		},
		languages: ["js", "python", "sh"],
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
		languages: ["js", "python", "sh"],
		providers: ["hf-inference", "together"],
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
		languages: ["js", "python", "sh"],
		providers: ["hf-inference", "fireworks-ai"],
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
		languages: ["js", "python", "sh"],
		providers: ["hf-inference", "fireworks-ai"],
		opts: { streaming: true },
	},
	{
		testName: "document-question-answering",
		model: {
			id: "impira/layoutlm-invoices",
			pipeline_tag: "document-question-answering",
			tags: [],
			inference: "",
		},
		languages: ["python"],
		providers: ["hf-inference"],
	},
	{
		testName: "image-classification",
		model: {
			id: "Falconsai/nsfw_image_detection",
			pipeline_tag: "image-classification",
			tags: [],
			inference: "",
		},
		languages: ["js", "python", "sh"],
		providers: ["hf-inference"],
	},
	{
		testName: "image-to-image",
		model: {
			id: "stabilityai/stable-diffusion-xl-refiner-1.0",
			pipeline_tag: "image-to-image",
			tags: [],
			inference: "",
		},
		languages: ["python"],
		providers: ["hf-inference"],
	},
	{
		testName: "tabular",
		model: {
			id: "templates/tabular-classification",
			pipeline_tag: "tabular-classification",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["python"],
	},
	{
		testName: "text-to-audio-transformers",
		model: {
			id: "facebook/musicgen-small",
			pipeline_tag: "text-to-audio",
			tags: ["transformers"],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["python"],
	},
	{
		testName: "text-to-image",
		model: {
			id: "black-forest-labs/FLUX.1-schnell",
			pipeline_tag: "text-to-image",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference", "fal-ai"],
		languages: ["js", "python", "sh"],
	},
	{
		testName: "text-to-video",
		model: {
			id: "tencent/HunyuanVideo",
			pipeline_tag: "text-to-video",
			tags: [],
			inference: "",
		},
		providers: ["replicate", "fal-ai"],
		languages: ["js", "python"],
	},
	{
		testName: "text-classification",
		model: {
			id: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
			pipeline_tag: "text-classification",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["js", "python", "sh"],
	},
	{
		testName: "basic-snippet--token-classification",
		model: {
			id: "FacebookAI/xlm-roberta-large-finetuned-conll03-english",
			pipeline_tag: "token-classification",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["python"],
	},
	{
		testName: "zero-shot-classification",
		model: {
			id: "facebook/bart-large-mnli",
			pipeline_tag: "zero-shot-classification",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["js", "python", "sh"],
	},
	{
		testName: "zero-shot-image-classification",
		model: {
			id: "openai/clip-vit-large-patch14",
			pipeline_tag: "zero-shot-image-classification",
			tags: [],
			inference: "",
		},
		providers: ["hf-inference"],
		languages: ["python"],
	},
] as const;

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
	model: ModelDataMinimal,
	language: Language,
	provider: SnippetInferenceProvider,
	opts?: Record<string, unknown>
): InferenceSnippet[] {
	const providerModelId = provider === "hf-inference" ? model.id : `<${provider} alias for ${model.id}>`;

	const allSnippets = snippets.getInferenceSnippet(model, "api_token", provider, providerModelId, opts);

	// const snippets = GET_SNIPPET_FN[language](model, "api_token", provider, providerModelId, opts) as InferenceSnippet[];
	return allSnippets
		.filter((snippet) => snippet.language == language)
		.sort((snippetA, snippetB) => snippetA.client.localeCompare(snippetB.client));
}

async function getExpectedInferenceSnippet(
	testName: string,
	language: Language,
	provider: SnippetInferenceProvider
): Promise<InferenceSnippet[]> {
	const fixtureFolder = getFixtureFolder(testName);
	const languageFolder = path.join(fixtureFolder, language);
	const files = await fs.readdir(languageFolder, { recursive: true });

	const expectedSnippets: InferenceSnippet[] = [];
	for (const file of files.filter((file) => file.includes(`.${provider}.`)).sort()) {
		const client = file.split("/")[0]; // e.g. fal_client/1.fal-ai.python => fal_client
		const content = await fs.readFile(path.join(languageFolder, file), { encoding: "utf-8" });
		expectedSnippets.push({ client, content });
	}
	return expectedSnippets;
}

async function saveExpectedInferenceSnippet(
	testName: string,
	language: Language,
	provider: SnippetInferenceProvider,
	snippets: InferenceSnippet[]
) {
	const fixtureFolder = getFixtureFolder(testName);
	await fs.mkdir(fixtureFolder, { recursive: true });

	const indexPerClient = new Map<string, number>();
	for (const snippet of snippets) {
		const extension = EXTENSIONS[language];
		const client = snippet.client;
		const index = indexPerClient.get(client) ?? 0;
		indexPerClient.set(client, index + 1);

		const file = path.join(fixtureFolder, language, snippet.client, `${index}.${provider}.${extension}`);
		await fs.mkdir(path.dirname(file), { recursive: true });
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
