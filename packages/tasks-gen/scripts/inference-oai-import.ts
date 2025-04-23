/*
 * Fetches OAI specs and generates JSON schema for input, output and stream_output of
 * text-generation and chat-completion tasks.
 * See https://platform.openai.com/docs/api-reference/chat/create
 */
import fs from "fs/promises";
import yaml from "js-yaml";
import { existsSync as pathExists } from "node:fs";
import * as path from "node:path/posix";
import type { JsonObject, JsonValue } from "type-fest";

const URL = "https://raw.githubusercontent.com/openai/openai-openapi/refs/heads/master/openapi.yaml";

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

const rootDir = path.join(rootDirFinder(), "..", "tasks");
const tasksDir = path.join(rootDir, "src", "tasks");

function toCamelCase(str: string, joiner = "") {
	return str
		.split(/[-_]/)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(joiner);
}

function nameNestedObjects(schema: JsonValue, parentName: string, parentKey?: string): void {
	if (!schema || typeof schema !== "object") {
		return;
	}

	if (Array.isArray(schema)) {
		for (const item of schema) {
			nameNestedObjects(item, parentName);
		}
		return;
	}

	// Process object properties
	for (const [key, value] of Object.entries(schema)) {
		if (!value || typeof value !== "object") {
			continue;
		}

		if (key === "properties" && typeof value === "object" && !Array.isArray(value)) {
			// Process each property that has a nested object type
			for (const [propKey, propValue] of Object.entries(value)) {
				if (propValue && typeof propValue === "object" && !Array.isArray(propValue)) {
					const propObj = propValue as JsonObject;

					// For object types without a title or a ref
					if (propObj.type === "object" && !propObj.title && !propObj.$ref) {
						const typeName = `${parentName}${toCamelCase(propKey)}`;
						propObj.title = typeName;
					}

					nameNestedObjects(propValue, parentName, propKey);
				}
			}
		} else if (key === "items" && typeof value === "object") {
			const itemObj = value as JsonObject;
			if (itemObj.type === "object" && !itemObj.title && !itemObj.$ref) {
				const typeName = `${parentName}${parentKey ? toCamelCase(parentKey) : ""}Item`;
				itemObj.title = typeName;
			}
			nameNestedObjects(value, parentName, parentKey);
		} else {
			const nextParentName =
				key === "definitions" || key === "$defs"
					? parentName
					: key === "properties"
					  ? parentName
					  : ((value as JsonObject).title as string) || parentName;

			nameNestedObjects(value, nextParentName, key);
		}
	}
}

async function _extractAndAdapt(task: string, mainComponentName: string, type: "input" | "output" | "stream_output") {
	console.debug(`✨ Importing`, task, type);

	console.debug("   📥 Fetching OpenAI specs");
	const response = await fetch(URL);

	const openapi = yaml.load(await response.text()) as any;
	const components: Record<string, any> = openapi["components"]["schemas"];

	const camelName = toCamelCase(task);
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
				// Only process external $refs pointing to components
				if (key === "$ref" && typeof data[key] === "string" && !(data[key] as string).startsWith("#/$defs/")) {
					const ref = (data[key] as string).split("/").pop() ?? "";
					if (!components[ref]) {
						// If the ref doesn't exist in the original components, it might be a mistake or an internal ref we should ignore
						console.warn(`   ⚠️ Reference not found in original components, skipping: ${data[key]}`);
						continue;
					}

					// Add reference to components to export (and scan it too)
					let newRef = camelFullName + ref.replace(camelName, "");
					newRef = newRef.replace("InputInput", "Input").replace("OutputOutput", "Output");
					if (!filteredComponents[newRef]) {
						const componentCopy = JSON.parse(JSON.stringify(components[ref]));
						componentCopy["title"] = newRef;
						filteredComponents[newRef] = componentCopy;
						_scan(componentCopy);
					}

					// Updating the reference to new format
					data[key] = `#/$defs/${newRef}`;
				} else if (key !== "$ref") {
					_scan(data[key]);
				}
			}
		}
	}

	console.debug("   🏗️ Merging component definitions");
	const mergedProperties: Record<string, JsonValue> = {};
	const mergedRequired = new Set<string>();

	if (mainComponent.allOf && Array.isArray(mainComponent.allOf)) {
		for (const part of mainComponent.allOf) {
			let componentPart: JsonObject | undefined;
			if (part.$ref && typeof part.$ref === "string") {
				const ref = part.$ref.split("/").pop() ?? "";
				if (!components[ref]) {
					throw new Error(`Reference not found in components during allOf merge: ${part.$ref}`);
				}
				componentPart = components[ref];
			} else {
				componentPart = part;
			}

			if (componentPart?.properties && typeof componentPart.properties === "object") {
				Object.assign(mergedProperties, componentPart.properties);
			}
			// Merge required fields
			if (componentPart?.required && Array.isArray(componentPart.required)) {
				// Ensure req is treated as string, as required fields should be strings
				componentPart.required.forEach((req: JsonValue) => {
					if (typeof req === "string") {
						mergedRequired.add(req);
					}
				});
			}
		}
	} else {
		// Fallback if no allOf
		if (mainComponent.properties) {
			Object.assign(mergedProperties, mainComponent.properties);
		}
		if (mainComponent.required && Array.isArray(mainComponent.required)) {
			mainComponent.required.forEach((req: string) => mergedRequired.add(req));
		}
	}

	console.debug("   📦 Packaging jsonschema and scanning final properties");
	const inputSchema: JsonObject = {
		$id: `/inference/schemas/${task}/${type}.json`,
		$schema: "http://json-schema.org/draft-06/schema#",
		description: `${toCamelCase(task, " ")} ${toCamelCase(
			type,
			" "
		)}.\n\nAuto-generated from OAI specs.\nFor more details, check out https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-oai-import.ts.`,
		title: camelFullName,
		type: "object",
		required: Array.from(mergedRequired),
		properties: mergedProperties,
		$defs: filteredComponents,
	};

	_scan(inputSchema.properties);

	console.debug("   🧩 Naming nested objects to avoid random prefixes");
	nameNestedObjects(inputSchema, camelFullName);

	const specPath = path.join(tasksDir, task, "spec-oai", `${type}.json`);
	console.debug("   📂 Exporting", specPath);
	await fs.writeFile(specPath, JSON.stringify(inputSchema, null, 4));
}

await _extractAndAdapt("chat-completion", "CreateChatCompletionRequest", "input");
await _extractAndAdapt("chat-completion", "CreateChatCompletionResponse", "output");
await _extractAndAdapt("chat-completion", "CreateChatCompletionStreamResponse", "stream_output");
console.debug("✅ All done!");
