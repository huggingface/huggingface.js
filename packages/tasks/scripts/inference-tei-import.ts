/*
 * Fetches TEI specs and generates JSON schema for input and output of
 * text-embeddings (called feature-extraction).
 * See https://huggingface.github.io/text-embeddings-inference/
 */
import fs from "fs/promises";
import * as path from "node:path/posix";
import { existsSync as pathExists } from "node:fs";
import type { JsonObject, JsonValue } from "type-fest";

const URL = "https://huggingface.github.io/text-embeddings-inference/openapi.json";

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

	console.debug("   📥 Fetching TEI specs");
	const response = await fetch(URL);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const openapi = (await response.json()) as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const components: Record<string, any> = openapi["components"]["schemas"];

	// e.g. TextGeneration
	const camelName = toCamelCase(task);
	// e.g. TextGenerationInput
	const camelFullName = camelName + toCamelCase(type);
	const mainComponent = components[mainComponentName];
	const filteredComponents: Record<string, JsonObject> = {};

	function _scan(data: JsonValue) {
		if (Array.isArray(data) || data instanceof Array) {
			for (const item of data) {
				_scan(item);
			}
		} else if (data && typeof data === "object") {
			for (const key of Object.keys(data)) {
				if (key === "$ref" && data[key] === "#/components/schemas/Input") {
					// Special case: keep input as string or string[]
					// but not Union[List[Union[List[int], int, str]], str]
					// data.delete(key);
					delete data[key];
					data["type"] = "string";
					data["description"] = "The text to embed.";
				} else if (key === "$ref" && typeof data[key] === "string") {
					// Verify reference exists
					const ref = (data[key] as string).split("/").pop() ?? "";
					if (!components[ref]) {
						throw new Error(`Reference not found in components: ${data[key]}`);
					}

					// Add reference to components to export (and scan it too)
					let newRef = camelFullName + ref.replace(camelName, "");
					// remove duplicated InputInput or OutputOutput in naming
					newRef = newRef.replace("InputInput", "Input").replace("OutputOutput", "Output");
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
			".\n\nAuto-generated from TEI specs." +
			"\nFor more details, check out https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-tei-import.ts.",
		title: camelFullName,
		type: mainComponent["type"],
		required: mainComponent["required"],
		properties: mainComponent["properties"],
		$defs: filteredComponents,
		items: mainComponent["items"],
	};

	const specPath = path.join(tasksDir, task, "spec", `${type}.json`);
	console.debug("   📂 Exporting", specPath);
	await fs.writeFile(specPath, JSON.stringify(inputSchema, null, 4));
}

await _extractAndAdapt("feature-extraction", "EmbedRequest", "input");
await _extractAndAdapt("feature-extraction", "EmbedResponse", "output");
console.debug("✅ All done!");
