import type { SerializedRenderResult } from "quicktype-core";
import { quicktype, InputData, JSONSchemaInput, FetchingJSONSchemaStore } from "quicktype-core";
import * as fs from "node:fs/promises";
import { existsSync as pathExists } from "node:fs";
import * as path from "node:path/posix";
import ts from "typescript";

const TYPESCRIPT_HEADER_FILE = `
/**
 * Inference code generated from the JSON schema spec in ./spec
 * 
 * Using src/scripts/inference-codegen
 */

`;

const PYTHON_HEADER_FILE = `
# Inference code generated from the JSON schema spec in @huggingface/tasks.
#
# See:
#   - script: https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/scripts/inference-codegen.ts
#   - specs:  https://github.com/huggingface/huggingface.js/tree/main/packages/tasks/src/tasks.
`;

const PYTHON_DIR = "./.python_generated";

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
	if (taskId === "text-generation" || taskId === "chat-completion") {
		await schema.addSource({
			name: `${taskId}-stream-output`,
			schema: await fs.readFile(`${taskSpecDir}/output_stream.json`, { encoding: "utf-8" }),
		});
	}
	const inputData = new InputData();
	inputData.addInput(schema);
	return inputData;
}

async function generateTypescript(inputData: InputData): Promise<SerializedRenderResult> {
	return await quicktype({
		inputData,
		lang: "typescript",
		alphabetizeProperties: true,
		indentation: "\t",
		rendererOptions: {
			"just-types": true,
			"nice-property-names": false,
			"prefer-unions": true,
			"prefer-const-values": true,
			"prefer-unknown": true,
			"explicit-unions": true,
			"runtime-typecheck": false,
		},
	});
}

async function generatePython(inputData: InputData): Promise<SerializedRenderResult> {
	return await quicktype({
		inputData,
		lang: "python",
		alphabetizeProperties: true,
		rendererOptions: {
			"just-types": true,
			"nice-property-names": true,
			"python-version": "3.7",
		},
	});
}

/**
 * quicktype is unable to generate "top-level array types" that are defined in the output spec: https://github.com/glideapps/quicktype/issues/2481
 * We have to use the TypeScript API to generate those types when required.
 * This hacky function:
 *   - looks for the generated interface for output types
 *   - renames it with a `Element` suffix
 *   - generates  type alias in the form `export type <OutputType> = <OutputType>Element[];
 *
 * And writes that to the `inference.ts` file
 *
 */
async function postProcessOutput(path2generated: string, outputSpec: Record<string, unknown>): Promise<void> {
	const source = ts.createSourceFile(
		path.basename(path2generated),
		await fs.readFile(path2generated, { encoding: "utf-8" }),
		ts.ScriptTarget.ES2022
	);
	const exportedName = outputSpec.title;
	if (outputSpec.type !== "array" || typeof exportedName !== "string") {
		console.log("      Nothing to do");
		return;
	}
	const topLevelNodes = source.getChildAt(0).getChildren();
	const hasTypeAlias = topLevelNodes.some(
		(node) =>
			node.kind === ts.SyntaxKind.TypeAliasDeclaration &&
			(node as ts.TypeAliasDeclaration).name.escapedText === exportedName
	);
	if (hasTypeAlias) {
		return;
	}

	const interfaceDeclaration = topLevelNodes.find((node): node is ts.InterfaceDeclaration => {
		if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
			return (node as ts.InterfaceDeclaration).name.getText(source) === exportedName;
		}
		return false;
	});
	if (!interfaceDeclaration) {
		console.log("      Nothing to do");
		return;
	}

	console.log("      Inserting top-level array type alias...");

	const updatedInterface = ts.factory.updateInterfaceDeclaration(
		interfaceDeclaration,
		interfaceDeclaration.modifiers,
		ts.factory.createIdentifier(interfaceDeclaration.name.getText(source) + "Element"),
		interfaceDeclaration.typeParameters,
		interfaceDeclaration.heritageClauses,
		interfaceDeclaration.members
	);
	const arrayDeclaration = ts.factory.createTypeAliasDeclaration(
		[ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
		exportedName,
		undefined,
		ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode(updatedInterface.name))
	);

	const printer = ts.createPrinter();

	const newNodes = ts.factory.createNodeArray([
		...topLevelNodes.filter((node) => node !== interfaceDeclaration),
		arrayDeclaration,
		updatedInterface,
	]);

	await fs.writeFile(path2generated, printer.printList(ts.ListFormat.MultiLine, newNodes, source), {
		flag: "w+",
		encoding: "utf-8",
	});

	return;
}

const rootDir = rootDirFinder();
const tasksDir = path.join(rootDir, "src", "tasks");
const allTasks = await Promise.all(
	(await fs.readdir(tasksDir, { withFileTypes: true }))
		.filter((entry) => entry.isDirectory())
		.filter((entry) => entry.name !== "placeholder")
		.map(async (entry) => ({ task: entry.name, dirPath: path.join(entry.path, entry.name) }))
);
const allSpecFiles = [
	path.join(tasksDir, "common-definitions.json"),
	...allTasks
		.flatMap(({ dirPath }) => [path.join(dirPath, "spec", "input.json"), path.join(dirPath, "spec", "output.json")])
		.filter((filepath) => pathExists(filepath)),
];

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

	const outputSpec = JSON.parse(await fs.readFile(`${taskSpecDir}/output.json`, { encoding: "utf-8" }));

	console.log("   🩹 Post-processing the generated code");
	await postProcessOutput(`${dirPath}/inference.ts`, outputSpec);

	console.debug("   🏭 Generating Python code");
	{
		const { lines } = await generatePython(inputData);
		const pythonFilename = `${task}.py`.replace(/-/g, "_");
		const pythonPath = `${PYTHON_DIR}/${pythonFilename}`;
		await fs.mkdir(PYTHON_DIR, { recursive: true });
		await fs.writeFile(pythonPath, [PYTHON_HEADER_FILE, ...lines].join(`\n`), {
			flag: "w+",
			encoding: "utf-8",
		});
	}
}
console.debug("✅ All done!");
