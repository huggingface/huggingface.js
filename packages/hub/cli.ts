#! /usr/bin/env node

import { parseArgs } from "node:util";
import { typedEntries } from "./src/utils/typedEntries";
import { createBranch, uploadFilesWithProgress } from "./src";
import { pathToFileURL } from "node:url";

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

const command = process.argv[2];
const args = process.argv.slice(3);

type Camelize<T extends string> = T extends `${infer A}-${infer B}` ? `${A}${Camelize<Capitalize<B>>}` : T;

const commands = {
	upload: {
		description: "Upload a folder to a repo on the Hub",
		args: [
			{
				name: "repo-name" as const,
				description: "The name of the repo to create",
				positional: true,
				required: true,
			},
			{
				name: "local-folder" as const,
				description: "The local folder to upload. Defaults to the current working directory",
				positional: true,
				default: () => process.cwd(),
			},
			// {
			// 	name: "path-in-repo" as const,
			// 	description: "The path in the repo to upload the folder to. Defaults to the root of the repo",
			// 	positional: true,
			// 	default: "/",
			// },
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
				name: "from-revision" as const,
				description:
					"The revision to upload from. Defaults to the latest commit on main or on the branch if it exists.",
			},
			{
				name: "from-empty" as const,
				boolean: true,
				description:
					"This will create an empty branch and upload the files to it. This will erase all previous commits on the branch if it exists.",
			},
			{
				name: "commit-message" as const,
				description: "The commit message to use. Defaults to 'Add [x] files'",
			},
			{
				name: "token" as const,
				description:
					"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
				default: process.env.HF_TOKEN,
			},
		],
	},
} satisfies Record<
	string,
	{
		description: string;
		args?: Array<{
			name: string;
			short?: string;
			positional?: boolean;
			description?: string;
			required?: boolean;
			boolean?: boolean;
			enum?: Array<string>;
			default?: string | (() => string);
		}>;
	}
>;

type Command = keyof typeof commands;

async function run() {
	switch (command) {
		case undefined:
		case "--help":
		case "help": {
			const positionals = parseArgs({ allowPositionals: true, args }).positionals;

			if (positionals.length > 0 && positionals[0] in commands) {
				const commandName = positionals[0] as Command;
				console.log(detailedUsage(commandName));
				break;
			}

			console.log(
				`Available commands\n\n` +
					typedEntries(commands)
						.map(([name, { description }]) => `- ${usage(name)}: ${description}`)
						.join("\n")
			);

			console.log("\nTo get help on a specific command, run `hfjs help <command>` or `hfjs <command> --help`");

			if (command === undefined) {
				process.exitCode = 1;
			}
			break;
		}

		case "upload": {
			if (args[0] === "--help" || args[0] === "-h") {
				console.log(usage("upload"));
				break;
			}
			const parsedArgs = advParseArgs(args, "upload");
			const { repoName, localFolder, repoType, revision, fromEmpty, fromRevision, token, quiet, commitMessage } =
				parsedArgs;

			if (revision && (fromEmpty || fromRevision)) {
				await createBranch({
					branch: revision,
					repo: repoType ? { type: repoType as "model" | "dataset" | "space", name: repoName } : repoName,
					accessToken: token,
					revision: fromRevision,
					empty: fromEmpty ? true : undefined,
					overwrite: true,
				});
			}

			for await (const event of uploadFilesWithProgress({
				repo: repoType ? { type: repoType as "model" | "dataset" | "space", name: repoName } : repoName,
				files: [pathToFileURL(localFolder)],
				branch: revision,
				accessToken: token,
				commitTitle: commitMessage?.trim().split("\n")[0],
				commitDescription: commitMessage?.trim().split("\n").slice(1).join("\n").trim(),
			})) {
				if (!quiet) {
					console.log(event);
				}
			}
			break;
		}
		default:
			throw new Error("Command not found: " + command);
	}
}
run();

function usage(commandName: Command) {
	const command = commands[commandName];

	return `${commandName} ${(command.args || [])
		.map((arg) => {
			if (arg.positional) {
				if (arg.required) {
					return `<${arg.name}>`;
				} else {
					return `[${arg.name}]`;
				}
			}
			return `[--${arg.name} ${arg.enum ? `{${arg.enum.join(",")}}` : arg.name.toLocaleUpperCase()}]`;
		})
		.join(" ")}`.trim();
}

function detailedUsage(commandName: Command) {
	let ret = `usage: ${usage(commandName)}\n\n`;
	const command = commands[commandName];

	if (command.args.some((p) => p.positional)) {
		ret += `Positional arguments:\n`;

		for (const arg of command.args) {
			if (arg.positional) {
				ret += `  ${arg.name}: ${arg.description}\n`;
			}
		}

		ret += `\n`;
	}

	if (command.args.some((p) => !p.positional)) {
		ret += `Options:\n`;

		for (const arg of command.args) {
			if (!arg.positional) {
				ret += `  --${arg.name}${arg.short ? `, -${arg.short}` : ""}: ${arg.description}\n`;
			}
		}

		ret += `\n`;
	}

	return ret;
}

function advParseArgs<C extends Command>(
	args: string[],
	commandName: C
): {
	// Todo : better typing
	[key in Camelize<(typeof commands)[C]["args"][number]["name"]>]: string;
} {
	const { tokens } = parseArgs({
		options: Object.fromEntries(
			commands[commandName].args
				.filter((arg) => !arg.positional)
				.map((arg) => {
					const option = {
						name: arg.name,
						...(arg.short && { short: arg.short }),
						type: arg.boolean ? "boolean" : "string",
						default: typeof arg.default === "function" ? arg.default() : arg.default,
					} as const;
					return [arg.name, option];
				})
		),
		args,
		allowPositionals: true,
		strict: false,
		tokens: true,
	});

	const command = commands[commandName];
	const expectedPositionals = command.args.filter((arg) => arg.positional);
	const requiredPositionals = expectedPositionals.filter((arg) => arg.required).length;
	const providedPositionals = tokens.filter((token) => token.kind === "positional").length;

	if (providedPositionals < requiredPositionals) {
		throw new Error(
			`Missing required positional arguments. Expected: ${requiredPositionals}, Provided: ${providedPositionals}`
		);
	}

	if (providedPositionals > expectedPositionals.length) {
		throw new Error(
			`Too many positional arguments. Expected: ${expectedPositionals.length}, Provided: ${providedPositionals}`
		);
	}

	const positionals = Object.fromEntries(
		tokens
			.filter((token): token is { kind: "positional"; index: number; value: string } => token.kind === "positional")
			.map((token, i) => [expectedPositionals[i].name, token.value])
	);

	const options = Object.fromEntries(
		tokens
			.filter((token): token is OptionToken => token.kind === "option")
			.map((token) => {
				const arg = command.args.find((arg) => arg.name === token.name || arg.short === token.name);
				if (!arg) {
					throw new Error(`Unknown option: ${token.name}`);
				}

				if (!arg.boolean) {
					if (!token.value) {
						throw new Error(`Missing value for option: ${token.name}: ${JSON.stringify(token)}`);
					}

					if (arg.enum && !arg.enum.includes(token.value)) {
						throw new Error(`Invalid value for option ${token.name}. Expected one of: ${arg.enum.join(", ")}`);
					}
				}

				return [arg.name, arg.boolean ? true : token.value];
			})
	);
	const defaults = Object.fromEntries(
		command.args
			.filter((arg) => arg.default)
			.map((arg) => {
				const value = typeof arg.default === "function" ? arg.default() : arg.default;
				return [arg.name, value];
			})
	);
	return Object.fromEntries(
		Object.entries({ ...defaults, ...positionals, ...options }).map(([name, val]) => [kebabToCamelCase(name), val])
	) as {
		[key in Camelize<(typeof commands)[C]["args"][number]["name"]>]: string;
	};
}

function kebabToCamelCase(str: string) {
	return str.replace(/-./g, (match) => match[1].toUpperCase());
}
