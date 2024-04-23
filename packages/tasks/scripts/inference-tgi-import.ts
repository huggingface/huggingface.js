/*
 * Fetches TGI specs and generated JSON schema for input, output and stream_output of
 * text-generation and chat-completion tasks.
 * See https://huggingface.github.io/text-generation-inference/
 */
import fs from "fs/promises";
import fetch from "node-fetch";
import * as path from "node:path/posix";
import { existsSync as pathExists } from "node:fs";

const URL = "https://huggingface.github.io/text-generation-inference/openapi.json";

const rootDirFinder = function (): string {
	let currentPath = path.normalize(import.meta.url);

	while (currentPath !== "/") {
		if (pathExists(path.join(currentPath, "package.json"))) {
			return currentPath;
		}

		currentPath = path.normalize(path.join(currentPath, ".."));
	}

	return "/";
};

const rootDir = rootDirFinder();
const tasksDir = path.join(rootDir, "src", "tasks");

function toCamelCase(str: string, joiner = "") {
	return str
		.split(/[-_]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(joiner);
}

async function _extractAndAdapt(task: string, mainComponentName: string, type: "input" | "output" | "stream_output") {
	console.debug(`✨ Importing`, task, type);

	console.debug("   📥 Fetching TGI specs");
	const response = await fetch(URL);
	const openapi = await response.json();
	const components = openapi["components"]["schemas"];

	// e.g. TextGeneration
	const camelName = toCamelCase(task);
	// e.g. TextGenerationInput
	const camelFullName = camelName + toCamelCase(type);
	const mainComponent = components[mainComponentName];
	const filteredComponents = { [camelFullName]: mainComponent };

	function _scan(data: unknown) {
		if (typeof data === "object") {
			for (const key in data) {
				if (key === "$ref") {
					// Verify reference exists
					const ref = data[key].split("/").pop();
					if (!components[ref]) {
						throw new Error(`Reference not found in components: ${data[key]}`);
					}

					// Add reference to components to export (and scan it too)
					const newRef = camelFullName + ref.replace(camelName, "");
					if (!filteredComponents[newRef]) {
						components[ref]["title"] = newRef; // Rename title to avoid conflicts
						filteredComponents[newRef] = components[ref];
						_scan(components[ref]);
					}

					// Updating the reference to new format
					data[key] = `#/$defs/${newRef}`;
				} else {
					_scan(data[key]);
				}
			}
		} else if (Array.isArray(data)) {
			for (const item of data) {
				_scan(item);
			}
		}
	}

	console.debug("   📦 Packaging jsonschema");
	_scan(mainComponent);

	const prettyName = toCamelCase(task, " ") + " " + toCamelCase(type, " ");
	const inputSchema = {
		$id: `/inference/schemas/${task}/${type}.json`,
		$schema: "http://json-schema.org/draft-06/schema#",
		description:
			prettyName +
			".\n\nAuto-generated from TGI specs." +
			"\nFor more details, check out https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tgi-import.ts.",
		title: camelFullName,
		type: "object",
		required: mainComponent["required"],
		properties: mainComponent["properties"],
		$defs: filteredComponents,
	};

	const specPath = path.join(tasksDir, task, "spec", `${type}.json`);
	console.debug("   📂 Exporting", specPath);
	await fs.writeFile(specPath, JSON.stringify(inputSchema, null, 4));
}

await _extractAndAdapt("text-generation", "CompatGenerateRequest", "input");
await _extractAndAdapt("text-generation", "GenerateResponse", "output");
await _extractAndAdapt("text-generation", "StreamResponse", "stream_output");
await _extractAndAdapt("chat-completion", "ChatRequest", "input");
await _extractAndAdapt("chat-completion", "ChatCompletion", "output");
await _extractAndAdapt("chat-completion", "ChatCompletionChunk", "stream_output");
console.debug("✅ All done!");
