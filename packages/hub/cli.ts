#! /usr/bin/env node

import { parseArgs } from "node:util";
import { typedEntries } from "./src/utils/typedEntries";
import {
	createBranch,
	createRepo,
	deleteBranch,
	deleteRepo,
	getJob,
	listJobHardware,
	listJobs,
	repoExists,
	runJob,
	streamJobLogs,
	uploadFilesWithProgress,
	whoAmI,
	type SpaceHardwareFlavor,
} from "./src";
import { pathToFileURL } from "node:url";
import { stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { HUB_URL } from "./src/consts";
import { version } from "./package.json";
import type { CommitProgressEvent } from "./src/lib/commit";
import type { MultiBar, SingleBar } from "cli-progress";

// Progress bar manager for handling multiple file uploads
class UploadProgressManager {
	private multibar: MultiBar | null = null;
	private fileBars: Map<string, SingleBar> = new Map();
	private readonly isQuiet: boolean;
	private cliProgressAvailable: boolean = false;

	constructor(isQuiet: boolean = false) {
		this.isQuiet = isQuiet;
	}

	async initialize(): Promise<void> {
		if (this.isQuiet) return;

		try {
			const cliProgress = await import("cli-progress");
			this.cliProgressAvailable = true;
			this.multibar = new cliProgress.MultiBar(
				{
					clearOnComplete: false,
					hideCursor: true,
					format: " {bar} | {filename} | {percentage}% | {state}",
					barCompleteChar: "\u2588",
					barIncompleteChar: "\u2591",
				},
				cliProgress.Presets.shades_grey,
			);
		} catch (error) {
			// cli-progress is not available, fall back to simple logging
			this.cliProgressAvailable = false;
		}
	}

	handleEvent(event: CommitProgressEvent): void {
		if (this.isQuiet) return;

		if (event.event === "phase") {
			this.logPhase(event.phase);
		} else if (event.event === "fileProgress") {
			this.updateFileProgress(event.path, event.progress, event.state);
		}
	}

	private logPhase(phase: string): void {
		if (this.isQuiet) return;

		const phaseMessages = {
			preuploading: "📋 Preparing files for upload...",
			uploadingLargeFiles: "⬆️  Uploading files...",
			committing: "✨ Finalizing commit...",
		};

		console.log(`\n${phaseMessages[phase as keyof typeof phaseMessages] || phase}`);
	}

	private updateFileProgress(path: string, progress: number, state: string): void {
		if (this.isQuiet) return;

		if (this.cliProgressAvailable && this.multibar) {
			// Use progress bars
			let bar = this.fileBars.get(path);

			if (!bar) {
				bar = this.multibar.create(100, 0, {
					filename: this.truncateFilename(path, 100),
					state: state,
				});
				this.fileBars.set(path, bar);
			}

			if (progress >= 1) {
				// If complete, mark it as done
				bar.update(100, { state: state === "hashing" ? "✓ hashed" : "✓ uploaded" });
			} else {
				// Update the progress (convert 0-1 to 0-100)
				const percentage = Math.round(progress * 100);
				bar.update(percentage, { state: state });
			}
		} else {
			// Fall back to simple console logging
			const percentage = Math.round(progress * 100);
			const truncatedPath = this.truncateFilename(path, 100);

			if (progress >= 1) {
				const statusIcon = state === "hashing" ? "✓ hashed" : "✓ uploaded";
				console.log(`${statusIcon}: ${truncatedPath}`);
			} else if (percentage % 25 === 0) {
				// Only log every 25% to avoid spam
				console.log(`${state}: ${truncatedPath} (${percentage}%)`);
			}
		}
	}

	private truncateFilename(filename: string, maxLength: number): string {
		if (filename.length <= maxLength) return filename;
		return "..." + filename.slice(-(maxLength - 3));
	}

	stop(): void {
		if (!this.isQuiet && this.cliProgressAvailable && this.multibar) {
			this.multibar.stop();
		}
	}
}

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
						description:
							"The type of the repo to create the branch into. Defaults to model. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
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
	repo: {
		description: "Manage repositories on the Hub",
		subcommands: {
			delete: {
				description: "Delete a repository from the Hub",
				args: [
					{
						name: "repo-name" as const,
						description:
							"The name of the repo to delete. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
						positional: true,
						required: true,
					},
					{
						name: "repo-type" as const,
						enum: ["dataset", "model", "space"],
						description:
							"The type of the repo to delete. Defaults to model. You can also prefix the repo name with the type, e.g. datasets/username/repo-name",
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
	jobs: {
		description: "Manage jobs on the Hub",
		subcommands: {
			run: {
				description: "Run a new job",
				args: [
					{
						name: "docker-image-or-space" as const,
						description:
							"The Docker image to run (e.g., python:3.12) or Space ID (e.g., hf.co/spaces/username/space-name or username/space-name)",
						positional: true,
						required: true,
					},
					{
						name: "command" as const,
						description:
							'The command to run (should be quoted if it contains flags like -c, e.g., \'python -c "print(\\"hello\\")"\' or "python -c \'print(\\"hello\\")\'")',
						positional: true,
					},
					{
						name: "env" as const,
						short: "e",
						description: "Environment variable in the format KEY=VALUE (can be specified multiple times)",
					},
					{
						name: "flavor" as const,
						description: "Hardware flavor to use (defaults to cpu-basic)",
						default: "cpu-basic",
					},
					{
						name: "name" as const,
						description: "Optional name for the job",
					},
					{
						name: "attempts" as const,
						description: "Maximum number of attempts (defaults to 1)",
					},
					{
						name: "namespace" as const,
						description: "The namespace (username or organization name). Defaults to the current user's username.",
					},
					{
						name: "token" as const,
						description:
							"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
						default: process.env.HF_TOKEN,
					},
				] as const,
			},
			ps: {
				description: "List jobs",
				args: [
					{
						name: "all" as const,
						short: "a",
						description: "List all jobs (not just running ones)",
						boolean: true,
					},
					{
						name: "namespace" as const,
						description: "The namespace (username or organization name). Defaults to the current user's username.",
					},
					{
						name: "token" as const,
						description:
							"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
						default: process.env.HF_TOKEN,
					},
				] as const,
			},
			hardware: {
				description: "List available hardware options for jobs",
				args: [
					{
						name: "token" as const,
						description:
							"The access token to use for authentication. If not provided, the HF_TOKEN environment variable will be used.",
						default: process.env.HF_TOKEN,
					},
				] as const,
			},
			logs: {
				description: "Show logs for a job",
				args: [
					{
						name: "job-id" as const,
						description: "The job ID",
						positional: true,
						required: true,
					},
					{
						name: "namespace" as const,
						description: "The namespace (username or organization name). Defaults to the current user's username.",
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
							.join("\n"),
				);
				console.log("\nTo get help on a specific command, run `hfjs help <command>` or `hfjs <command> --help`");
				console.log(
					"For commands with subcommands (like 'branch'), run `hfjs help <command> <subcommand>` or `hfjs <command> <subcommand> --help`",
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

			const progressManager = new UploadProgressManager(!!quiet);
			await progressManager.initialize();

			try {
				for await (const event of uploadFilesWithProgress({
					repo: repoId,
					files,
					branch: revision,
					accessToken: token,
					commitTitle: commitMessage?.trim().split("\n")[0],
					commitDescription: commitMessage?.trim().split("\n").slice(1).join("\n").trim(),
					hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					useXet: true,
				})) {
					progressManager.handleEvent(event);
				}

				if (!quiet) {
					console.log("\n✅ Upload completed successfully!");
				}
			} catch (error) {
				progressManager.stop();
				throw error;
			} finally {
				progressManager.stop();
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
		case "repo": {
			const repoCommandGroup = commands.repo;
			const currentSubCommandName = subCommandName as keyof typeof repoCommandGroup.subcommands | undefined;

			if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
				if (currentSubCommandName && repoCommandGroup.subcommands[currentSubCommandName]) {
					console.log(detailedUsageForSubcommand("repo", currentSubCommandName));
				} else {
					console.log(listSubcommands("repo", repoCommandGroup));
				}
				break;
			}

			if (!currentSubCommandName || !repoCommandGroup.subcommands[currentSubCommandName]) {
				console.error(`Error: Missing or invalid subcommand for 'repo'.`);
				console.log(listSubcommands("repo", repoCommandGroup));
				process.exitCode = 1;
				break;
			}

			const subCmdDef = repoCommandGroup.subcommands[currentSubCommandName];

			switch (currentSubCommandName) {
				case "delete": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, `repo ${currentSubCommandName}`);
					const { repoName, repoType, token } = parsedArgs;

					const repoDesignation: Parameters<typeof deleteRepo>[0]["repo"] = repoType
						? { type: repoType as "model" | "dataset" | "space", name: repoName }
						: repoName;

					await deleteRepo({
						repo: repoDesignation,
						accessToken: token,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					});
					console.log(`Repository '${repoName}' deleted successfully.`);
					break;
				}
				default:
					// This case should ideally be caught by the check above
					console.error(`Error: Unknown subcommand '${currentSubCommandName}' for 'repo'.`);
					console.log(listSubcommands("repo", repoCommandGroup));
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
		case "jobs": {
			const jobsCommandGroup = commands.jobs;
			const currentSubCommandName = subCommandName as keyof typeof jobsCommandGroup.subcommands | undefined;

			if (cliArgs[0] === "--help" || cliArgs[0] === "-h") {
				if (currentSubCommandName && jobsCommandGroup.subcommands[currentSubCommandName]) {
					console.log(detailedUsageForSubcommand("jobs", currentSubCommandName));
				} else {
					console.log(listSubcommands("jobs", jobsCommandGroup));
				}
				break;
			}

			if (!currentSubCommandName || !jobsCommandGroup.subcommands[currentSubCommandName]) {
				console.error(`Error: Missing or invalid subcommand for 'jobs'.`);
				console.log(listSubcommands("jobs", jobsCommandGroup));
				process.exitCode = 1;
				break;
			}

			const subCmdDef = jobsCommandGroup.subcommands[currentSubCommandName];

			switch (currentSubCommandName) {
				case "run": {
					// Handle multiple -e flags manually since parseArgs doesn't support multiple values for the same option
					const envVars: string[] = [];
					const filteredArgs: string[] = [];
					let i = 0;
					while (i < cliArgs.length) {
						if (cliArgs[i] === "-e" || cliArgs[i] === "--env") {
							if (i + 1 < cliArgs.length) {
								envVars.push(cliArgs[i + 1]);
								i += 2;
							} else {
								throw new Error("Missing value for -e/--env option");
							}
						} else {
							filteredArgs.push(cliArgs[i]);
							i++;
						}
					}

					// Parse non-positional arguments first
					const { tokens } = parseArgs({
						options: {
							flavor: { type: "string", default: "cpu-basic" },
							name: { type: "string" },
							attempts: { type: "string" },
							namespace: { type: "string" },
							token: { type: "string", default: process.env.HF_TOKEN },
						},
						args: filteredArgs,
						allowPositionals: true,
						strict: false,
						tokens: true,
					});

					const flavor =
						(tokens.find((t) => t.kind === "option" && t.name === "flavor") as OptionToken | undefined)?.value ||
						"cpu-basic";
					const name = (tokens.find((t) => t.kind === "option" && t.name === "name") as OptionToken | undefined)?.value;
					const attemptsStr = (
						tokens.find((t) => t.kind === "option" && t.name === "attempts") as OptionToken | undefined
					)?.value;
					let attempts: number | undefined;
					if (attemptsStr) {
						const parsed = parseInt(attemptsStr, 10);
						if (isNaN(parsed) || parsed < 1) {
							throw new Error("Attempts must be a positive integer");
						}
						attempts = parsed;
					}
					const namespace = (
						tokens.find((t) => t.kind === "option" && t.name === "namespace") as OptionToken | undefined
					)?.value;
					const token =
						(tokens.find((t) => t.kind === "option" && t.name === "token") as OptionToken | undefined)?.value ||
						process.env.HF_TOKEN;

					// Get positional arguments - first is docker image or space ID, rest is command
					const positionals = tokens.filter((t) => t.kind === "positional").map((t) => t.value);
					if (positionals.length === 0) {
						throw new Error("Missing required argument: docker-image or space-id");
					}
					const firstArg = positionals[0];
					// If there's only one command argument, it might be a quoted string that needs parsing
					// Otherwise, use all arguments as-is
					let commandArray: string[] = [];
					if (positionals.length > 1) {
						if (positionals.length === 2 && positionals[1].includes(" ") && !positionals[1].startsWith("-")) {
							// Likely a quoted command string, parse it
							commandArray = parseShellCommand(positionals[1]);
						} else {
							// Multiple arguments, use as-is
							commandArray = positionals.slice(1);
						}
					}

					// Detect if first argument is a space ID (format: hf.co/spaces/namespace/space-name or namespace/space-name)
					let dockerImage: string | undefined;
					let spaceId: string | undefined;

					// Check for hf.co/spaces/... format
					const hfCoSpacesMatch = firstArg.match(/^hf\.co\/spaces\/(.+)$/);
					if (hfCoSpacesMatch) {
						spaceId = hfCoSpacesMatch[1];
					} else if (firstArg.includes("/") && !firstArg.includes(":")) {
						// If it contains a slash but no colon, assume it's a space ID (namespace/space-name)
						// Docker images typically have colons (e.g., python:3.12)
						spaceId = firstArg;
					} else {
						// Otherwise, treat it as a docker image
						dockerImage = firstArg;
					}

					// Get namespace from whoAmI if not provided
					let finalNamespace = namespace;
					if (!finalNamespace) {
						if (!token) {
							throw new Error(
								"Cannot determine namespace without authentication. Please provide --namespace or --token.",
							);
						}
						const userInfo = await whoAmI({
							accessToken: token as string,
							hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						});
						if (userInfo.type !== "user") {
							throw new Error("Cannot determine namespace. Please provide --namespace explicitly.");
						}
						finalNamespace = userInfo.name;
					}

					// Parse environment variables
					const environment: Record<string, string> = {};
					for (const envVar of envVars) {
						const equalIndex = envVar.indexOf("=");
						if (equalIndex === -1) {
							throw new Error(`Invalid environment variable format: ${envVar}. Expected KEY=VALUE`);
						}
						const key = envVar.slice(0, equalIndex);
						const value = envVar.slice(equalIndex + 1);
						environment[key] = value;
					}

					const jobParams = {
						namespace: finalNamespace,
						...(name ? { name } : {}),
						...(dockerImage ? { dockerImage } : {}),
						...(spaceId ? { spaceId } : {}),
						flavor: flavor as SpaceHardwareFlavor,
						command: commandArray.length > 0 ? commandArray : undefined,
						environment: Object.keys(environment).length > 0 ? environment : {},
						...(attempts !== undefined ? { attempts } : {}),
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						...(token ? { accessToken: token } : {}),
					} as Parameters<typeof runJob>[0];

					const job = await runJob(jobParams);

					console.log(`Job created: ${job.id}`);
					console.log(`Status: ${job.status.stage}`);
					break;
				}
				case "ps": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, "jobs ps");
					const { all, namespace, token } = parsedArgs;

					// Get namespace from whoAmI if not provided
					let finalNamespace = namespace;
					if (!finalNamespace) {
						if (!token) {
							throw new Error(
								"Cannot determine namespace without authentication. Please provide --namespace or --token.",
							);
						}
						const userInfo = await whoAmI({
							accessToken: token as string,
							hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						});
						if (userInfo.type !== "user") {
							throw new Error("Cannot determine namespace. Please provide --namespace explicitly.");
						}
						finalNamespace = userInfo.name;
					}

					const jobs = await listJobs({
						namespace: finalNamespace,
						accessToken: token,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					});

					// Filter by status if not showing all
					const filteredJobs = all ? jobs : jobs.filter((job) => job.status.stage === "RUNNING");

					if (filteredJobs.length === 0) {
						console.log(all ? "No jobs found." : "No running jobs found.");
						break;
					}

					// Display jobs in a table-like format
					console.log(
						`${"ID".padEnd(40)} ${"NAME".padEnd(20)} ${"STATUS".padEnd(12)} ${"CREATED".padEnd(20)} ${"DOCKER IMAGE"}`,
					);
					console.log("-".repeat(120));
					for (const job of filteredJobs) {
						const createdAt = new Date(job.createdAt).toLocaleString();
						const dockerImage = job.dockerImage || job.spaceId || "N/A";
						const jobName = job.name || "N/A";
						const status = job.status.stage;
						console.log(
							`${job.id.padEnd(40)} ${jobName.padEnd(20)} ${status.padEnd(12)} ${createdAt.padEnd(20)} ${dockerImage}`,
						);
					}
					break;
				}
				case "hardware": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, "jobs hardware");
					const { token } = parsedArgs;

					const hardwareParams: {
						hubUrl?: string;
						accessToken?: string;
					} = {
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
					};
					if (token) {
						hardwareParams.accessToken = token;
					}

					const hardware = await listJobHardware(hardwareParams);

					// Format and display the hardware list
					console.log(
						`${"NAME".padEnd(15)} ${"PRETTY NAME".padEnd(22)} ${"CPU".padEnd(8)} ${"RAM".padEnd(7)} ${"ACCELERATOR".padEnd(16)} ${"COST/MIN".padEnd(9)} ${"COST/HOUR"}`,
					);
					console.log("-".repeat(100));

					for (const hw of hardware) {
						// Format accelerator
						let accelerator = "N/A";
						if (hw.accelerator) {
							accelerator = `${hw.accelerator.quantity}x ${hw.accelerator.model} (${hw.accelerator.vram})`;
						}

						// Format costs - unitCostMicroUSD is in microUSD (divide by 1,000,000 to get USD)
						// unitCostUSD appears to be per minute based on the example
						const costPerMin = (hw.unitCostMicroUSD / 1_000_000).toFixed(4);
						const costPerHour = ((hw.unitCostMicroUSD / 1_000_000) * 60).toFixed(2);

						console.log(
							`${hw.name.padEnd(15)} ${hw.prettyName.padEnd(22)} ${hw.cpu.padEnd(8)} ${hw.ram.padEnd(7)} ${accelerator.padEnd(16)} $${costPerMin.padStart(8)} $${costPerHour.padStart(9)}`,
						);
					}
					break;
				}
				case "logs": {
					const parsedArgs = advParseArgs(cliArgs, subCmdDef.args, "jobs logs");
					const { jobId, namespace, token } = parsedArgs;

					// Get namespace from whoAmI if not provided
					let finalNamespace = namespace;
					if (!finalNamespace) {
						if (!token) {
							throw new Error(
								"Cannot determine namespace without authentication. Please provide --namespace or --token.",
							);
						}
						const userInfo = await whoAmI({
							accessToken: token as string,
							hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						});
						if (userInfo.type !== "user") {
							throw new Error("Cannot determine namespace. Please provide --namespace explicitly.");
						}
						finalNamespace = userInfo.name;
					}

					const logsParams = {
						namespace: finalNamespace,
						jobId,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						...(token ? { accessToken: token } : {}),
					} as Parameters<typeof streamJobLogs>[0];

					// Get job info to check for error messages
					const jobInfoParams = {
						namespace: finalNamespace,
						jobId,
						hubUrl: process.env.HF_ENDPOINT ?? HUB_URL,
						...(token ? { accessToken: token } : {}),
					} as Parameters<typeof getJob>[0];
					const jobInfo = await getJob(jobInfoParams);

					// Show error message if job failed (check both FAILED stage and message field)
					if (jobInfo.status.stage === "ERROR" && jobInfo.status.message) {
						console.error(`\n❌ Job failed: ${jobInfo.status.message}\n`);
					}

					// Display logs with proper line breaks
					// The stream itself may include the header, so we'll let it handle that
					for await (const logChunk of streamJobLogs(logsParams)) {
						try {
							// Try to parse as JSON (SSE format)
							const parsed = JSON.parse(logChunk);
							if (parsed.data) {
								// Ensure the data ends with a newline if it doesn't already
								const data = parsed.data;
								process.stdout.write(data.endsWith("\n") ? data : data + "\n");
							}
						} catch {
							// If not JSON, write as-is with newline if needed
							const chunk = logChunk;
							// Check if it's already the header line (which includes newline)
							if (chunk.includes("===== Job started")) {
								process.stdout.write(chunk.endsWith("\n") ? chunk : chunk + "\n");
							} else {
								// For other chunks, ensure newline
								process.stdout.write(chunk.endsWith("\n") ? chunk : chunk + "\n");
							}
						}
					}
					break;
				}
				default:
					// Should be caught by the check above
					console.error(`Error: Unknown subcommand '${currentSubCommandName}' for 'jobs'.`);
					console.log(listSubcommands("jobs", jobsCommandGroup));
					process.exitCode = 1;
					break;
			}
			break;
		}
		default:
			console.error("Command not found: " + mainCommandName);
			// Print general help
			console.log(
				`\nAvailable commands:\n\n` +
					typedEntries(commands)
						.map(([name, def]) => `  ${usage(name)}: ${def.description}`)
						.join("\n"),
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
			const subCmd = commandEntry.subcommands[subCommandName as keyof typeof commandEntry.subcommands] as SingleCommand;
			cmdArgs = subCmd.args;
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
	subCommandName: keyof CommandGroup["subcommands"],
): string {
	const commandGroup = commands[commandName];
	if (!("subcommands" in commandGroup)) {
		throw new Error(`Command ${commandName} does not have subcommands`);
	}
	if (!(subCommandName in commandGroup.subcommands)) {
		throw new Error(`Subcommand ${subCommandName as string} not found for ${commandName}`);
	}
	const subCommandDef = (commandGroup.subcommands as Record<string, SingleCommand>)[subCommandName];
	return _detailedUsage(subCommandDef.args, usage(commandName, subCommandName as string), subCommandDef.description);
}

function listSubcommands(commandName: TopLevelCommandName, commandGroup: CommandGroup): string {
	let ret = `usage: hfjs ${commandName} <subcommand> [options]\n\n`;
	ret += `${commandGroup.description}\n\n`;
	ret += `Available subcommands for '${commandName}':\n`;
	ret += typedEntries(commandGroup.subcommands)
		.map(([subName, subDef]) => `  ${subName}\t${subDef.description}`)
		.join("\n");
	if (commandName === "jobs") {
		ret +=
			'\n\nExample:\n  hfjs jobs run -e FOO=foo -e BAR=bar python:3.12 "python -c \'import os; print(os.environ[\\"FOO\\"], os.environ[\\"BAR\\"])\'"';
	}
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
	commandNameForError: string,
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
				}),
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
				commandNameForError.split(" ")[1],
			)}`,
		);
	}

	if (providedPositionalTokens.length > expectedPositionals.length) {
		throw new Error(
			`Command '${commandNameForError}': Too many positional arguments. Usage: hfjs ${usage(
				commandNameForError.split(" ")[0] as TopLevelCommandName,
				commandNameForError.split(" ")[1],
			)}`,
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
						}. Expected one of: ${argDef.enum.join(", ")}`,
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
		Object.entries(result).map(([name, val]) => [kebabToCamelCase(name), val]),
	) as ParsedArgsResult<TArgsDef>;
}

function kebabToCamelCase(str: string) {
	return str.replace(/-./g, (match) => match[1].toUpperCase());
}

/**
 * Parse a shell command string into an array of arguments, respecting quotes.
 * Handles both single and double quotes, and escaped quotes.
 */
function parseShellCommand(cmd: string): string[] {
	const args: string[] = [];
	let current = "";
	let inSingleQuote = false;
	let inDoubleQuote = false;
	let i = 0;

	while (i < cmd.length) {
		const char = cmd[i];
		const nextChar = cmd[i + 1];

		if (char === "\\" && (nextChar === '"' || nextChar === "'" || nextChar === "\\")) {
			// Escaped quote or backslash
			current += nextChar;
			i += 2;
		} else if (char === "'" && !inDoubleQuote) {
			// Toggle single quote
			inSingleQuote = !inSingleQuote;
			i++;
		} else if (char === '"' && !inSingleQuote) {
			// Toggle double quote
			inDoubleQuote = !inDoubleQuote;
			i++;
		} else if ((char === " " || char === "\t") && !inSingleQuote && !inDoubleQuote) {
			// Whitespace outside quotes - end of argument
			if (current.length > 0) {
				args.push(current);
				current = "";
			}
			i++;
		} else {
			current += char;
			i++;
		}
	}

	// Add the last argument if any
	if (current.length > 0) {
		args.push(current);
	}

	return args;
}
