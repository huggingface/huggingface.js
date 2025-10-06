#!/usr/bin/env node
import { join } from "node:path";
import { lstat, readFile } from "node:fs/promises";
import { downloadFileToCacheDir, type RepoDesignation } from "@huggingface/hub";
import type { TinyAgentConfig } from "./types";
import { debug, error } from "./utils";

const FILENAME_CONFIG = "agent.json";
const PROMPT_FILENAMES = ["AGENTS.md", "PROMPT.md"] as const;

const TINY_AGENTS_HUB_REPO: RepoDesignation = {
	name: "tiny-agents/tiny-agents",
	type: "dataset",
};

async function tryLoadFromFile(filePath: string): Promise<TinyAgentConfig | undefined> {
	try {
		const configJson = await readFile(filePath, { encoding: "utf8" });
		return { configJson };
	} catch {
		return undefined;
	}
}

async function tryLoadFromDirectory(dirPath: string): Promise<TinyAgentConfig | undefined> {
	const stats = await lstat(dirPath).catch(() => undefined);
	if (!stats?.isDirectory()) {
		return undefined;
	}

	let prompt: string | undefined;
	for (const filename of PROMPT_FILENAMES) {
		try {
			prompt = await readFile(join(dirPath, filename), { encoding: "utf8" });
			break;
		} catch {
			/* empty */
		}
	}
	if (undefined == prompt) {
		debug(
			`${PROMPT_FILENAMES.join(", ")} could not be loaded locally from ${dirPath}, continuing without prompt template`
		);
	}

	try {
		return {
			configJson: await readFile(join(dirPath, FILENAME_CONFIG), { encoding: "utf8" }),
			prompt,
		};
	} catch {
		error(`Config file not found in specified local directory.`);
		process.exit(1);
	}
}

async function tryLoadFromHub(agentId: string): Promise<TinyAgentConfig | undefined> {
	let configJson: string;
	try {
		const configPath = await downloadFileToCacheDir({
			repo: TINY_AGENTS_HUB_REPO,
			path: `${agentId}/${FILENAME_CONFIG}`,
			accessToken: process.env.HF_TOKEN,
		});
		configJson = await readFile(configPath, { encoding: "utf8" });
	} catch {
		return undefined;
	}

	let prompt: string | undefined;
	for (const filename of PROMPT_FILENAMES) {
		try {
			const promptPath = await downloadFileToCacheDir({
				repo: TINY_AGENTS_HUB_REPO,
				path: `${agentId}/${filename}`,
				accessToken: process.env.HF_TOKEN,
			});
			prompt = await readFile(promptPath, { encoding: "utf8" });
			break;
		} catch {
			/* empty */
		}
	}
	if (undefined == prompt) {
		debug(
			`${PROMPT_FILENAMES.join(
				", "
			)}  not found in https://huggingface.co/datasets/tiny-agents/tiny-agents/tree/main/${agentId}, continuing without prompt template`
		);
	}

	return {
		configJson,
		prompt,
	};
}

export async function loadConfigFrom(loadFrom: string): Promise<TinyAgentConfig> {
	// First try as a local file
	const fileConfig = await tryLoadFromFile(loadFrom);
	if (fileConfig) {
		return fileConfig;
	}

	// Then try as a local directory
	const dirConfig = await tryLoadFromDirectory(loadFrom);
	if (dirConfig) {
		return dirConfig;
	}

	// Finally try loading from repo
	const repoConfig = await tryLoadFromHub(loadFrom);
	if (repoConfig) {
		return repoConfig;
	}

	error(
		`Config file not found in tiny-agents! Please make sure it exists locally or in https://huggingface.co/datasets/tiny-agents/tiny-agents.`
	);
	process.exit(1);
}
