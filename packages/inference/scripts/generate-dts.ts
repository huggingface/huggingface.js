/** Dirty script to generate pretty .d.ts */

import { readFileSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";
import { TASKS_DATA } from "@huggingface/tasks";

const taskImports = new Set<string>();

const tasks = Object.keys(TASKS_DATA)
	.sort()
	.filter((task) => task !== "other");

let types = readFileSync("./src/types.ts", "utf-8");

types = types.replace(/import.* "@huggingface\/tasks";\n/g, "");
types = types.replace(' Exclude<PipelineType, "other">', ["", ...tasks.map((task) => `"${task}"`)].join("\n\t| "));

if (types.includes("PipelineType") || types.includes("@huggingface/tasks")) {
	console.log(types);
	console.error("Failed to parse types.ts");
	process.exit(1);
}

writeFileSync("./dist/index.d.ts", types + "\n");
appendFileSync("./dist/index.d.ts", "export class InferenceOutputError extends TypeError {}" + "\n");

const dirs = readdirSync("./src/tasks");

const fns: string[] = [];
for (const dir of dirs) {
	if (dir.endsWith(".ts")) {
		continue;
	}
	const files = readdirSync(`./src/tasks/${dir}`);
	for (const file of files) {
		if (!file.endsWith(".ts")) {
			continue;
		}

		const fileContent = readFileSync(`./src/tasks/${dir}/${file}`, "utf-8");

		// detect imports from @huggingface/tasks
		for (const imports of fileContent.matchAll(/import type {(.*)} from "@huggingface\/tasks";/g)) {
			// Convert A, B, C to ["A", "B", "C"]
			const imported = imports[1].split(",").map((x) => x.trim());

			for (const imp of imported) {
				taskImports.add(imp);
			}
		}

		for (const type of extractTypesAndInterfaces(fileContent)) {
			appendFileSync("./dist/index.d.ts", type + "\n");
		}

		for (const fn of extractAsyncFunctions(fileContent)) {
			appendFileSync("./dist/index.d.ts", fn + "\n");
			fns.push(fn);
		}
	}
}

appendFileSync(
	"./dist/index.d.ts",
	`export class HfInference {
\tconstructor(accessToken?: string, defaultOptions?: Options);
\t/**
\t * Returns copy of HfInference tied to a specified endpoint.
\t */
\tendpoint(endpointUrl: string): HfInferenceEndpoint;
` +
		fns
			.map(
				(fn) =>
					`${fn
						.replace(/args: [a-zA-Z]+/, (args) => `args: Omit<${args.slice("args: ".length)}, 'accessToken'>`)
						.replace("export function ", "")
						.split("\n")
						.map((line) => "\t" + line)
						.join("\n")}`
			)
			.join("\n") +
		"\n}\n"
);

appendFileSync(
	"./dist/index.d.ts",
	`export class HfInferenceEndpoint {\n\tconstructor(endpointUrl: string, accessToken?: string, defaultOptions?: Options);\n` +
		fns
			.map(
				(fn) =>
					`${fn
						.replace(/args: [a-zA-Z]+/, (args) => `args: Omit<${args.slice("args: ".length)}, 'accessToken' | 'model'>`)
						.replace("export function ", "")
						.split("\n")
						.map((line) => "\t" + line)
						.join("\n")}`
			)
			.join("\n") +
		"\n}\n"
);

// Prepend import from @huggingface/tasks
writeFileSync(
	"./dist/index.d.ts",
	`import type { ${[...taskImports].join(", ")} } from "@huggingface/tasks";\n` +
		readFileSync("./dist/index.d.ts", "utf-8")
);

function* extractTypesAndInterfaces(fileContent: string): Iterable<string> {
	let index = 0;

	for (const kind of ["type", "interface"]) {
		while (true) {
			index = fileContent.indexOf(`export ${kind} `, index);
			const initialIndex = index;
			if (index === -1) {
				break;
			}

			let bracketOpen = 0;

			dance: for (let i = index; i < fileContent.length; i++) {
				switch (fileContent[i]) {
					case "{":
						bracketOpen++;
						break;
					case "}":
						bracketOpen--;
						if (bracketOpen === 0 && kind === "interface") {
							// Add doc comment if present
							if (fileContent[index - 2] === "/" && fileContent[index - 3] === "*") {
								index = fileContent.lastIndexOf("/*", index);
							}
							yield fileContent.slice(index, i + 1);
							index = i + 1;
							break dance;
						}
						break;
					case ";":
						if (bracketOpen === 0) {
							// Add doc comment if present
							if (fileContent[index - 2] === "/" && fileContent[index - 3] === "*") {
								index = fileContent.lastIndexOf("/*", index);
							}
							yield fileContent.slice(index, i + 1);
							index = i + 1;
							break dance;
						}
						break;
				}
			}

			if (initialIndex === index) {
				console.error("Failed to parse fileContent", fileContent.slice(index, index + 100));
				process.exit(1);
			}
		}
	}
}

function* extractAsyncFunctions(fileContent: string): Iterable<string> {
	let index = 0;

	while (true) {
		index = fileContent.indexOf(`export async function`, index);
		if (index === -1) {
			break;
		}

		const typeBegin = fileContent.indexOf("): ", index);

		if (typeBegin === -1) {
			console.error("Failed to parse fileContent", fileContent.slice(index, index + 100));
			process.exit(1);
		}

		const typeEnd = fileContent.indexOf(" {", typeBegin);

		if (typeEnd === -1) {
			console.error("Failed to parse fileContent", fileContent.slice(index, index + 100));
			process.exit(1);
		}

		if (fileContent[index - 2] === "/" && fileContent[index - 3] === "*") {
			index = fileContent.lastIndexOf("/*", index);
		}
		yield fileContent
			.slice(index, typeEnd)
			.replace("export async ", "export ")
			.replace("export function*", "export function")
			.trim() + ";";
		index = typeEnd;
	}
}

for (const distPath of ["./dist/index.js", "./dist/index.cjs"]) {
	writeFileSync(distPath, '/// <reference path="./index.d.ts" />\n' + readFileSync(distPath, "utf-8"));
}
