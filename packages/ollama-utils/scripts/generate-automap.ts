/**
 * Script for generating llm.ts
 * The source data is taken from llama.cpp
 */

import type { GGUFParseOutput } from "../../gguf/src/gguf";
import { gguf } from "../../gguf/src/gguf";
import { appendFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const DEBUG = process.env.DEBUG;
const RE_SPECIAL_TOKEN = /<[|_A-Za-z0-9]+>|\[[A-Z]+\]|<\uFF5C[\u2581A-Za-z]+\uFF5C>/g;
const MAX_NUMBER_OF_TAGS_PER_MODEL = 5;
const N_WORKERS = 16;
const OUTPUT_FILE = path.join(__dirname, "../src/chat-template-automap.ts");
const BLACKLISTED_MODELS = (model: string, tag: string) => {
	// some models are know to give ServiceUnavailable
	return model === "library/deepseek-r1" && tag === "7b";
};

interface OutputItem {
	model: string;
	gguf: string;
	ollama: {
		template: string;
		tokens: string[];
		// eslint-disable-next-line
		params?: any;
	};
}

interface OllamaManifestLayer {
	digest: string;
	mediaType: string;
	size: number;
}

interface OllamaManifest {
	layers: OllamaManifestLayer[];
}

const getSpecialTokens = (tmpl: string): string[] => {
	const matched = tmpl.match(RE_SPECIAL_TOKEN);
	const tokens = Array.from(matched || []);
	return Array.from(new Set(tokens)); // deduplicate
};

(async () => {
	if (DEBUG) writeFileSync("ollama_tmp.jsonl", ""); // clear the file

	const models: string[] = [];
	const output: OutputItem[] = [];

	const html = await (await fetch("https://ollama.com/library")).text();
	const matched = html.match(/href="\/library\/[^"]+/g);
	if (!matched) {
		throw new Error("cannot find any model url");
	}
	for (let i = 0; i < matched.length; i++) {
		models.push(matched[i].replace('href="/', ""));
	}
	console.log({ models });

	//////// Get tags ////////

	let nDoing = 0;
	let nAll = models.length;
	const modelsWithTag: string[] = [];
	const workerGetTags = async () => {
		while (true) {
			const model = models.shift();
			if (!model) return;
			nDoing++;
			console.log(`Getting tags ${nDoing} / ${nAll}`);
			const html = await (await fetch(`https://ollama.com/${model}`)).text();
			const matched = html.match(/href="\/library\/[^"]+/g);
			if (!matched) {
				throw new Error("cannot find any tag url");
			}
			for (let i = 0; i < matched.length && i < MAX_NUMBER_OF_TAGS_PER_MODEL; i++) {
				const midAndTag: string = matched[i].replace('href="/', "");
				if (midAndTag.match(/:/) && !midAndTag.match(/\/blobs/)) {
					modelsWithTag.push(midAndTag);
				}
			}
		}
	};
	await Promise.all(
		Array(N_WORKERS)
			.fill(null)
			.map(() => workerGetTags())
	);
	console.log({ modelsWithTag });

	//////// merging with old file if necessary ////////

	const seenGGUFTemplate = new Set<string>();
	if (existsSync(OUTPUT_FILE)) {
		const oldOutput = await import(OUTPUT_FILE);
		oldOutput.OLLAMA_CHAT_TEMPLATE_MAPPING.forEach((item: OutputItem) => {
			seenGGUFTemplate.add(item.gguf);
			output.push(item);
		});
	}

	//////// Get template ////////

	nDoing = 0;
	nAll = modelsWithTag.length;
	const workerGetTemplate = async () => {
		while (true) {
			const modelWithTag = modelsWithTag.shift();
			if (!modelWithTag) return;

			nDoing++;
			const [model, tag] = modelWithTag.split(":");
			console.log(`Fetch template ${nDoing} / ${nAll} | model=${model} tag=${tag}`);
			const getBlobUrl = (digest: string) => `https://registry.ollama.com/v2/${model}/blobs/${digest}`;
			const manifest: OllamaManifest = await (
				await fetch(`https://registry.ollama.com/v2/${model}/manifests/${tag}`)
			).json();
			if (!manifest.layers) {
				console.log(" --> [X] No layers");
				continue;
			}
			const layerModelUrl = manifest.layers.find((l) => l.mediaType.match(/\.model/));
			if (!layerModelUrl) {
				console.log(" --> [X] No model is found");
				continue;
			}
			const modelUrl = getBlobUrl(layerModelUrl.digest);
			let ggufData: GGUFParseOutput;
			if (BLACKLISTED_MODELS(model, tag)) {
				console.log(" --> [X] Blacklisted model, skip");
				continue;
			}
			try {
				ggufData = await gguf(modelUrl);
			} catch (e) {
				console.log(" --> [X] FATAL: GGUF error", { model, tag, modelUrl });
				throw e; // rethrow
			}
			const { metadata } = ggufData;
			const ggufTmpl = metadata["tokenizer.chat_template"];
			if (ggufTmpl) {
				if (seenGGUFTemplate.has(ggufTmpl)) {
					console.log(" --> Already seen this GGUF template, skip...");
					continue;
				}
				seenGGUFTemplate.add(ggufTmpl);
				console.log(" --> GGUF chat template OK");
				const tmplBlob = manifest.layers.find((l) => l.mediaType.match(/\.template/));
				if (!tmplBlob) continue;
				const ollamaTmplUrl = getBlobUrl(tmplBlob.digest);
				if (!ollamaTmplUrl) {
					console.log(" --> [X] No ollama template");
					continue;
				}
				const ollamaTmpl = await (await fetch(ollamaTmplUrl)).text();
				console.log(" --> All OK");
				const record: OutputItem = {
					model: modelWithTag,
					gguf: ggufTmpl,
					ollama: {
						template: ollamaTmpl,
						tokens: getSpecialTokens(ggufTmpl),
					},
				};
				// get params
				const ollamaParamsBlob = manifest.layers.find((l) => l.mediaType.match(/\.params/));
				const ollamaParamsUrl = ollamaParamsBlob ? getBlobUrl(ollamaParamsBlob.digest) : null;
				if (ollamaParamsUrl) {
					console.log(" --> Got params");
					record.ollama.params = await (await fetch(ollamaParamsUrl)).json();
				}
				output.push(record);
				if (DEBUG) appendFileSync("ollama_tmp.jsonl", JSON.stringify(record) + "\n");
			} else {
				console.log(" --> [X] No GGUF template");
				continue;
			}
			//console.log({modelUrl, ggufData});
			//break;
		}
	};

	await Promise.all(
		Array(N_WORKERS)
			.fill(null)
			.map(() => workerGetTemplate())
	);

	console.log("DONE");
	output.sort((a, b) => a.model.localeCompare(b.model));

	writeFileSync(
		OUTPUT_FILE,
		`
// This file is auto generated, please do not modify manually
// To update it, run "pnpm run build:automap"

import { OllamaChatTemplateMapEntry } from "./types";

export const OLLAMA_CHAT_TEMPLATE_MAPPING: OllamaChatTemplateMapEntry[] = ${JSON.stringify(output, null, "\t")};
  `.trim()
	);
})();
