#! /usr/bin/env node

import { parseArgs } from "node:util";
import { typedEntries } from "./src/utils/typedEntries";
import { createBranch, createRepo, deleteBranch, repoExists, uploadFilesWithProgress } from "./src";
import { pathToFileURL } from "node:url";
import { stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { HUB_URL } from "./src/consts";
import { version } from "./package.json";

// Didn't find the import from "node:util", so duplicated it here
type OptionToken =
	| { kind: "option"; index: number; name: string; rawName: string; value: string; inlineValue: boolean }
	| {
			kind: "option";
			index: number;
			name: string;
			rawName: string;
			value: undefined;
			inlineValue: undefined;
	  };

// const command = process.argv[2]; // Replaced by mainCommandName and subCommandName
// const args = process.argv.slice(3); // Replaced by cliArgs

type Camelize<T extends string> = T extends `${infer A}-${infer B}` ? `${A}${Camelize<Capitalize<B>>}` : T;

interface ArgDef {
	name: string;
	short?: string;
	positional?: boolean;
	description?: string;
	required?: boolean;
	boolean?: boolean;
	enum?: Array<string>;
	default?: string | boolean | (() => string | boolean); // Allow boolean defaults
}

interface SingleCommand {
	description: string;
	args: readonly ArgDef[];
}

interface CommandGroup {
	description: string;
	subcommands: Record<string, SingleCommand>;
}

const commands = {
	upload: {
		description: "Upload a folder to a repo on the Hub",
		args: [
			{
				name: "repo-name" as const,
				description: "The name of the repo to upload to",
				positional: true,
				required: true,
			},
			{
				name: "local-folder" as const,
				description: "The local folder to upload. Defaults to the current working directory",
				positional: true,
				default: () => process.cwd(),
			},
			{
				name: "path-in-repo" as const,
				description: "The path in the repo to upload the folder to. Defaults to the root of the repo",
				positional: true,
				default: ".",
			},
			{
				name: "quiet" as const,
				short: "q",
				description: "Suppress all output",
				boolean: true,
			},
			{
				name: "repo-type" as const,
				enum: ["dataset", "model", "space"],
				default: "model",
				description:
					"The type of repo to upload to. Defaults to model. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
			},
			{
				name: "revision" as const,
				description: "The revision to upload to. Defaults to the main branch",
				default: "main",
			},
			{
				name: "commit-message" as const,
				description: "The commit message to use. Defaults to 'Upload files using @huggingface/hub'",
				default: "Upload files using @huggingface/hub",
			},
			{
				name: "private" as const,
				description: "If creating a new repo, make it private",
				boolean: true,
			},
			{
				name: "token" as const,
				description:
					"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
				default: process.env.HF_TOKEN,
			},
		] as const,
	} satisfies SingleCommand,
	branch: {
		description: "Manage repository branches",
		subcommands: {
			create: {
				description: "Create a new branch in a repo, or update an existing one",
				args: [
					{
						name: "repo-name" as const,
						description: "The name of the repo to create the branch in",
						positional: true,
						required: true,
					},
					{
						name: "branch" as const,
						description: "The name of the branch to create",
						positional: true,
						required: true,
					},
					{
						name: "repo-type" as const,
						enum: ["dataset", "model", "space"],
						default: "model",
						description:
							"The type of repo to create. Defaults to model. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
					},
					{
						name: "revision" as const,
						description:
							"The revision to create the branch from. Defaults to the main branch, or existing branch if it exists.",
					},
					{
						name: "empty" as const,
						boolean: true,
						description: "Create an empty branch. This will erase all previous commits on the branch if it exists.",
					},
					{
						name: "force" as const,
						short: "f",
						boolean: true,
						description:
							"Overwrite the branch if it already exists. Otherwise, throws an error if the branch already exists. No-ops if no revision is provided and the branch exists.",
					},
					{
						name: "token" as const,
						description:
							"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
						default: process.env.HF_TOKEN,
					},
				] as const,
			},
			delete: {
				description: "Delete a branch in a repo",
				args: [
					{
						name: "repo-name" as const,
						description: "The name of the repo to delete the branch from",
						positional: true,
						required: true,
					},
					{
						name: "branch" as const,
						description: "The name of the branch to delete",
						positional: true,
						required: true,
					},
					{
						name: "repo-type" as const,
						enum: ["dataset", "model", "space"],
						default: "model",
						description:
							"The type of repo to delete the branch from. Defaults to model. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
					},
					{
						name: "token" as const,
						description:
							"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
						default: process.env.HF_TOKEN,
					},
				] as const,
			},
		},
	} satisfies CommandGroup,
	version: {
		description: "Print the version of the CLI",
		args: [] as const,
	} satisfies SingleCommand,
} satisfies Record<string, SingleCommand | CommandGroup>;

type TopLevelCommandName = keyof typeof commands;

const mainCommandName = process.argv[2];
let subCommandName: string | undefined;
let cliArgs: string[];

if (
	mainCommandName &&
	mainCommandName in commands &&
	commands[mainCommandName as keyof typeof commands] &&
	"subcommands" in commands[mainCommandName as keyof typeof commands]
) {
	subCommandName = process.argv[3];
	cliArgs = process.argv.slice(4);
} else {
	cliArgs = process.argv.slice(3);
}

async function run() {
	switch (mainCommandName) {
		case undefined:
		case "--help":
		case "help": {
			const helpArgs = mainCommandName === "help" ? process.argv.slice(3) : [];

			if (helpArgs.length > 0) {
				const cmdName = helpArgs[0] as TopLevelCommandName;
				if (cmdName && commands[cmdName]) {
					const cmdDef = commands[cmdName];
					if ("subcommands" in cmdDef) {
						if (helpArgs.length > 1) {
							const subCmdName = helpArgs[1];
							if (
								subCmdName in cmdDef.subcommands &&
								cmdDef.subcommands[subCmdName as keyof typeof cmdDef.subcommands]
							) {
								console.log(detailedUsageForSubcommand(cmdName, subCmdName as keyof typeof cmdDef.subcommands));
								break;
							} else {
								console.error(`Error: Unknown subcommand '${subCmdName}' for command '${cmdName}'.`);
								console.log(listSubcommands(cmdName, cmdDef));
								process.exitCode = 1;
								break;
							}
						} else {
							console.log(listSubcommands(cmdName, cmdDef));
							break;
						}
					} else {
						console.log(detailedUsageForCommand(cmdName));
						break;
					}
				} else {
					console.error(`Error: Unknown command '${cmdName}' for help.`);
					process.exitCode = 1;
				}
			} else {
				// General help
				console.log(
					`Hugging Face CLI Tools (hfjs)\n\nAvailable commands:\n\n` +
						typedEntries(commands)
							.map(([name, def]) => `  ${usage(name)}: ${def.description}`)
							.join("\n")
				);
				console.log("\nTo get help on a specific command, run `hfjs help <command>` or `hfjs <command> --help`");
				console.log(
					"For commands with subcommands (like 'branch'), run `hfjs help <command> <subcommand>` or `hfjs <command> <subcommand> --help`"
				);
				if (mainCommandName === undefined) {
					process.exitCode = 1;
				}
			}
			break;
		}

		case "upload": {
			const cmdDef = commands.upload;
			if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
				console.log(detailedUsageForCommand("upload"));
				break;
			}
			const parsedArgs = advParseArgs(cliArgs, cmdDef.args, "upload");
			const {
				repoName,
				localFolder,
				repoType,
				revision,
				token,
				quiet,
				commitMessage,
				pathInRepo,
				private: isPrivate,
			} = parsedArgs;

			const repoId = repoType ? { type: repoType as "model" | "dataset" | "space", name: repoName } : repoName;

			if (
				!(await repoExists({ repo: repoId, revision, accessToken: token, hubUrl: process.env.HF_ENDPOINT ?? HUB_URL }))
			) {
				if (!quiet) {
					console.log(`Repo ${repoName} does not exist. Creating it...`);
				}
				await createRepo({
					repo: repoId,
					accessToken: token,
					private: !!isPrivate,
					hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
				});
			}

			const isFile = (await stat(localFolder)).isFile();
			const files = isFile
				? [
						{
							content: pathToFileURL(localFolder),
							path: join(pathInRepo, `${basename(localFolder)}`).replace(/^[.]?\//, ""),
						},
				  ]
				: [{ content: pathToFileURL(localFolder), path: pathInRepo.replace(/^[.]?\//, "") }];

			for await (const event of uploadFilesWithProgress({
				repo: repoId,
				files,
				branch: revision,
				accessToken: token,
				commitTitle: commitMessage?.trim().split("\n")[0],
				commitDescription: commitMessage?.trim().split("\n").slice(1).join("\n").trim(),
				hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
			})) {
				if (!quiet) {
					console.log(event);
				}
			}
			break;
		}
		case "branch": {
			const branchCommandGroup = commands.branch;
			const currentSubCommandName = subCommandName as keyof typeof branchCommandGroup.subcommands | undefined;

			if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
				if (currentSubCommandName && branchCommandGroup.subcommands[currentSubCommandName]) {
					console.log(detailedUsageForSubcommand("branch", currentSubCommandName));
				} else {
					console.log(listSubcommands("branch", branchCommandGroup));
				}
				break;
			}

			if (!currentSubCommandName || !branchCommandGroup.subcommands[currentSubCommandName]) {
				console.error(`Error: Missing or invalid subcommand for 'branch'.`);
				console.log(listSubcommands("branch", branchCommandGroup));
				process.exitCode = 1;
				break;
			}

			const subCmdDef = branchCommandGroup.subcommands[currentSubCommandName];

			switch (currentSubCommandName) {
				case "create": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, "branch create");
					const { repoName, branch, revision, empty, repoType, token, force } = parsedArgs;

					await createBranch({
						repo: repoType ? { type: repoType as "model" | "dataset" | "space", name: repoName } : repoName,
						branch,
						accessToken: token,
						revision,
						empty: empty ?? undefined,
						overwrite: force ?? undefined,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					});
					console.log(`Branch '${branch}' created successfully in repo '${repoName}'.`);
					break;
				}
				case "delete": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, "branch delete");
					const { repoName, branch, repoType, token } = parsedArgs;

					await deleteBranch({
						repo: repoType ? { type: repoType as "model" | "dataset" | "space", name: repoName } : repoName,
						branch,
						accessToken: token,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					});
					console.log(`Branch '${branch}' deleted successfully from repo '${repoName}'.`);
					break;
				}
				default:
					// Should be caught by the check above
					console.error(`Error: Unknown subcommand '${currentSubCommandName}' for 'branch'.`);
					console.log(listSubcommands("branch", branchCommandGroup));
					process.exitCode = 1;
					break;
			}
			break;
		}
		case "version": {
			if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
				console.log(detailedUsageForCommand("version"));
				break;
			}
			console.log(`hfjs version: ${version}`);
			break;
		}
		default:
			console.error("Command not found: " + mainCommandName);
			// Print general help
			console.log(
				`\nAvailable commands:\n\n` +
					typedEntries(commands)
						.map(([name, def]) => `  ${usage(name)}: ${def.description}`)
						.join("\n")
			);
			console.log("\nTo get help on a specific command, run `hfjs help <command>` or `hfjs <command> --help`");
			process.exitCode = 1;
			break;
	}
}
run().catch((err) => {
	console.error("\x1b[31mError:\x1b[0m", err.message);
	//if (process.env.DEBUG) {
	console.error(err);
	// }
	process.exitCode = 1;
});

function usage(commandName: TopLevelCommandName, subCommandName?: string): string {
	const commandEntry = commands[commandName];

	let cmdArgs: readonly ArgDef[];
	let fullCommandName = commandName as string;

	if ("subcommands" in commandEntry) {
		if (subCommandName && subCommandName in commandEntry.subcommands) {
			cmdArgs = commandEntry.subcommands[subCommandName as keyof typeof commandEntry.subcommands].args;
			fullCommandName = `${commandName} ${subCommandName}`;
		} else {
			return `${commandName} <subcommand>`;
		}
	} else {
		cmdArgs = commandEntry.args;
	}

	return `${fullCommandName} ${(cmdArgs || [])
		.map((arg) => {
			if (arg.positional) {
				return arg.required ? `<${arg.name}>` : `[${arg.name}]`;
			}
			return `[--${arg.name}${arg.short ? `|-${arg.short}` : ""}${
				arg.enum ? ` {${arg.enum.join("|")}}` : arg.boolean ? "" : ` <${arg.name.toUpperCase().replace(/-/g, "_")}>`
			}]`;
		})
		.join(" ")}`.trim();
}

function _detailedUsage(args: readonly ArgDef[], usageLine: string, commandDescription?: string): string {
	let ret = `usage: hfjs ${usageLine}\n`;
	if (commandDescription) {
		ret += `\n${commandDescription}\n`;
	}

	const positionals = args.filter((p) => p.positional);
	const options = args.filter((p) => !p.positional);

	if (positionals.length > 0) {
		ret += `\nPositional arguments:\n`;
		for (const arg of positionals) {
			ret += `  ${arg.name}\t${arg.description}${
				arg.default ? ` (default: ${typeof arg.default === "function" ? arg.default() : arg.default})` : ""
			}\n`;
		}
	}

	if (options.length > 0) {
		ret += `\nOptions:\n`;
		for (const arg of options) {
			const nameAndAlias = `--${arg.name}${arg.short ? `, -${arg.short}` : ""}`;
			const valueHint = arg.enum
				? `{${arg.enum.join("|")}}`
				: arg.boolean
				  ? ""
				  : `<${arg.name.toUpperCase().replace(/-/g, "_")}>`;
			ret += `  ${nameAndAlias}${valueHint ? " " + valueHint : ""}\t${arg.description}${
				arg.default !== undefined
					? ` (default: ${typeof arg.default === "function" ? arg.default() : arg.default})`
					: ""
			}\n`;
		}
	}
	ret += `\n`;
	return ret;
}

function detailedUsageForCommand(commandName: TopLevelCommandName): string {
	const commandDef = commands[commandName];
	if ("subcommands" in commandDef) {
		return listSubcommands(commandName, commandDef);
	}
	return _detailedUsage(commandDef.args, usage(commandName), commandDef.description);
}

function detailedUsageForSubcommand(
	commandName: TopLevelCommandName,
	subCommandName: keyof CommandGroup["subcommands"]
): string {
	const commandGroup = commands[commandName];
	if (!("subcommands" in commandGroup) || !(subCommandName in commandGroup.subcommands)) {
		throw new Error(`Subcommand ${subCommandName as string} not found for ${commandName}`);
	}
	const subCommandDef = commandGroup.subcommands[subCommandName as keyof typeof commandGroup.subcommands];
	return _detailedUsage(subCommandDef.args, usage(commandName, subCommandName as string), subCommandDef.description);
}

function listSubcommands(commandName: TopLevelCommandName, commandGroup: CommandGroup): string {
	let ret = `usage: hfjs ${commandName} <subcommand> [options]\n\n`;
	ret += `${commandGroup.description}\n\n`;
	ret += `Available subcommands for '${commandName}':\n`;
	ret += typedEntries(commandGroup.subcommands)
		.map(([subName, subDef]) => `  ${subName}\t${subDef.description}`)
		.join("\n");
	ret += `\n\nRun \`hfjs help ${commandName} <subcommand>\` for more information on a specific subcommand.`;
	return ret;
}

type ParsedArgsResult<TArgsDef extends readonly ArgDef[]> = {
	[K in TArgsDef[number] as Camelize<K["name"]>]: K["boolean"] extends true
		? boolean
		: K["required"] extends true
		  ? string
		  : K["default"] extends undefined
		    ? string | undefined // Optional strings without default can be undefined
		    : string; // Strings with default or required are strings
};

function advParseArgs<TArgsDef extends readonly ArgDef[]>(
	args: string[],
	argDefs: TArgsDef,
	commandNameForError: string
): ParsedArgsResult<TArgsDef> {
	const { tokens } = parseArgs({
		options: Object.fromEntries(
			argDefs
				.filter((arg) => !arg.positional)
				.map((arg) => {
					const optionConfig = {
						type: arg.boolean ? ("boolean" as const) : ("string" as const),
						...(arg.short && { short: arg.short }),
						...(arg.default !== undefined && {
							default: typeof arg.default === "function" ? arg.default() : arg.default,
						}),
					};
					return [arg.name, optionConfig];
				})
		),
		args,
		allowPositionals: true,
		strict: false, // We do custom validation based on tokens and argDefs
		tokens: true,
	});

	const expectedPositionals = argDefs.filter((arg) => arg.positional);
	const providedPositionalTokens = tokens.filter((token) => token.kind === "positional");

	if (providedPositionalTokens.length < expectedPositionals.filter((arg) => arg.required).length) {
		throw new Error(
			`Command '${commandNameForError}': Missing required positional arguments. Usage: hfjs ${usage(
				commandNameForError.split(" ")[0] as TopLevelCommandName,
				commandNameForError.split(" ")[1]
			)}`
		);
	}

	if (providedPositionalTokens.length > expectedPositionals.length) {
		throw new Error(
			`Command '${commandNameForError}': Too many positional arguments. Usage: hfjs ${usage(
				commandNameForError.split(" ")[0] as TopLevelCommandName,
				commandNameForError.split(" ")[1]
			)}`
		);
	}

	const result: Record<string, string | boolean> = {};

	// Populate from defaults first
	for (const argDef of argDefs) {
		if (argDef.default !== undefined) {
			result[argDef.name] = typeof argDef.default === "function" ? argDef.default() : argDef.default;
		} else if (argDef.boolean) {
			result[argDef.name] = false; // Booleans default to false if no other default
		}
	}

	// Populate positionals
	providedPositionalTokens.forEach((token, i) => {
		if (expectedPositionals[i]) {
			result[expectedPositionals[i].name] = token.value;
		}
	});

	// Populate options from tokens, overriding defaults
	tokens
		.filter((token): token is OptionToken => token.kind === "option")
		.forEach((token) => {
			const argDef = argDefs.find((def) => def.name === token.name || def.short === token.name);
			if (!argDef) {
				throw new Error(`Command '${commandNameForError}': Unknown option: ${token.rawName}`);
			}

			if (argDef.boolean) {
				result[argDef.name] = true;
			} else {
				if (token.value === undefined) {
					throw new Error(`Command '${commandNameForError}': Missing value for option: ${token.rawName}`);
				}
				if (argDef.enum && !argDef.enum.includes(token.value)) {
					throw new Error(
						`Command '${commandNameForError}': Invalid value '${token.value}' for option ${
							token.rawName
						}. Expected one of: ${argDef.enum.join(", ")}`
					);
				}
				result[argDef.name] = token.value;
			}
		});

	// Final check for required arguments
	for (const argDef of argDefs) {
		if (argDef.required && result[argDef.name] === undefined) {
			throw new Error(`Command '${commandNameForError}': Missing required argument: ${argDef.name}`);
		}
	}

	return Object.fromEntries(
		Object.entries(result).map(([name, val]) => [kebabToCamelCase(name), val])
	) as ParsedArgsResult<TArgsDef>;
}

function kebabToCamelCase(str: string) {
	return str.replace(/-./g, (match) => match[1].toUpperCase());
}
