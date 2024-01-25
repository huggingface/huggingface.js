import type { SerializedRenderResult } from "quicktype-core";
import { quicktype, InputData, JSONSchemaInput, FetchingJSONSchemaStore } from "quicktype-core";
import * as fs from "fs/promises";
import { existsSync as pathExists } from "fs";
import * as path from "path";

const TYPESCRIPT_HEADER_FILE = `
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */

`;

const rootDirFinder = function (): string {
	const parts = __dirname.split("/");
	let level = parts.length - 1;
	while (level > 0) {
		const currentPath = parts.slice(0, level).join("/");
		console.debug(currentPath);
		try {
			require(`${currentPath}/package.json`);
			return path.normalize(currentPath);
		} catch (err) {
			/// noop
		}
		level--;
	}
	return "";
};

/**
 *
 * @param taskId The ID of the task for which we are generating code
 * @param taskSpecDir The path to the directory where the input.json & output.json files are
 * @param allSpecFiles An array of paths to all the tasks specs. Allows resolving cross-file references ($ref).
 */
async function buildInputData(taskId: string, taskSpecDir: string, allSpecFiles: string[]): Promise<InputData> {
	const schema = new JSONSchemaInput(new FetchingJSONSchemaStore(), [], allSpecFiles);
	await schema.addSource({
		name: `${taskId}-input`,
		schema: await fs.readFile(`${taskSpecDir}/input.json`, { encoding: "utf-8" }),
	});
	await schema.addSource({
		name: `${taskId}-output`,
		schema: await fs.readFile(`${taskSpecDir}/output.json`, { encoding: "utf-8" }),
	});
	const inputData = new InputData();
	inputData.addInput(schema);
	return inputData;
}

async function generateTypescript(inputData: InputData): Promise<SerializedRenderResult> {
	return await quicktype({
		inputData,
		lang: "typescript",
		alphabetizeProperties: true,
		rendererOptions: {
			"just-types": true,
			"nice-property-names": true,
			"prefer-unions": true,
			"prefer-const-values": true,
			"prefer-unknown": true,
			"explicit-unions": true,
		},
	});
}

async function main() {
	const rootDir = rootDirFinder();
	const tasksDir = path.join(rootDir, "src", "tasks");
	const allTasks = await Promise.all(
		(await fs.readdir(tasksDir, { withFileTypes: true }))
			.filter((entry) => entry.isDirectory())
			.filter((entry) => entry.name !== "placeholder")
			.map(async (entry) => ({ task: entry.name, dirPath: path.join(entry.path, entry.name) }))
	);
	const allSpecFiles = allTasks
		.flatMap(({ dirPath }) => [path.join(dirPath, "spec", "input.json"), path.join(dirPath, "spec", "output.json")])
		.filter((filepath) => pathExists(filepath));

	for (const { task, dirPath } of allTasks) {
		const taskSpecDir = path.join(dirPath, "spec");
		if (!(pathExists(path.join(taskSpecDir, "input.json")) && pathExists(path.join(taskSpecDir, "output.json")))) {
			console.debug(`No spec found for task ${task} - skipping`);
			continue;
		}
		console.debug(`✨ Generating types for task`, task);

		console.debug("   📦 Building input data");
		const inputData = await buildInputData(task, taskSpecDir, allSpecFiles);

		console.debug("   🏭 Generating typescript code");
		{
			const { lines } = await generateTypescript(inputData);
			await fs.writeFile(`${dirPath}/inference.ts`, [TYPESCRIPT_HEADER_FILE, ...lines].join(`\n`), {
				flag: "w+",
				encoding: "utf-8",
			});
		}
	}
	console.debug("✅ All done!");
}

let exit = 0;
main()
	.catch((err) => {
		console.error("Failure", err);
		exit = 1;
	})
	.finally(() => process.exit(exit));
