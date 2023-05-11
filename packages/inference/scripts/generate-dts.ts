/** Dirty script to generate pretty .d.ts */

import { readFileSync, writeFileSync, appendFileSync, readdirSync } from "node:fs";

writeFileSync("./dist/index.d.ts", readFileSync("./src/types.ts", "utf-8") + "\n");
appendFileSync("./dist/index.d.ts", "export class InferenceOutputError extends TypeError {}" + "\n");

const dirs = readdirSync("./src/tasks");

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

		for (const type of extractTypesAndInterfaces(fileContent)) {
			appendFileSync("./dist/index.d.ts", type + "\n");
		}

		const fns: string[] = [];
		for (const fn of extractAsyncFunctions(fileContent)) {
			appendFileSync("./dist/index.d.ts", fn + "\n");
			fns.push(fn);
		}

		for (const fn of fns) {
			// ...
		}

		// appendFileSync("./dist/index.d.ts", readFileSync(`./src/tasks/${dir}/${file}`, "utf-8"));
	}
}

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
