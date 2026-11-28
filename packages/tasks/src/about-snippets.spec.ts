import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const TASKS_DIR = join(process.cwd(), "src/tasks");
const INFERENCE_TASKS_INDEX = join(process.cwd(), "../inference/src/tasks/index.ts");

const JS_FENCE = /```(?:javascript|js|typescript|ts)\n([\s\S]*?)```/g;
const INFERENCE_CALL = /\binference\.(\w+)\s*\(/g;
const TASK_EXPORT = /export \* from "\.\/(?:[^"]+\/)*([^/"]+)\.js"/g;

function inferenceClientMethods(): Set<string> {
	const source = readFileSync(INFERENCE_TASKS_INDEX, "utf8");
	const methods = new Set<string>();
	for (const match of source.matchAll(TASK_EXPORT)) {
		methods.add(match[1]);
	}
	return methods;
}

function jsSnippets(markdown: string): string[] {
	return [...markdown.matchAll(JS_FENCE)].map((match) => match[1]);
}

describe("about.md huggingface.js snippets", () => {
	it("call methods that exist on InferenceClient", () => {
		const methods = inferenceClientMethods();
		expect(methods.has("textGeneration")).toBe(true);
		expect(methods.has("textClassification")).toBe(true);
		expect(methods.has("conversational")).toBe(false);

		const unknownCalls: string[] = [];

		for (const entry of readdirSync(TASKS_DIR, { withFileTypes: true })) {
			if (!entry.isDirectory()) {
				continue;
			}

			const aboutPath = join(TASKS_DIR, entry.name, "about.md");
			if (!existsSync(aboutPath)) {
				continue;
			}

			const markdown = readFileSync(aboutPath, "utf8");
			for (const snippet of jsSnippets(markdown)) {
				for (const call of snippet.matchAll(INFERENCE_CALL)) {
					const method = call[1];
					if (!methods.has(method)) {
						unknownCalls.push(`${entry.name}: inference.${method}()`);
					}
				}
			}
		}

		expect(unknownCalls).toEqual([]);
	});
});
