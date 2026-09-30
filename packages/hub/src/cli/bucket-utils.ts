import { readFile, readdir, stat } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { join, relative, sep } from "node:path";
import type { ListFileEntry } from "../lib/list-files";
import { listFiles } from "../lib/list-files";
import { fnmatch } from "../utils/fnmatch";

export interface CommonOptions {
	token: string;
	hubUrl: string;
	quiet?: boolean;
}

export const repoOf = (bucket: string): { type: "bucket"; name: string } => ({ type: "bucket", name: bucket });

export const stripSlashes = (path: string): string => path.replace(/^\/+|\/+$/g, "");
export const joinRemote = (...parts: string[]): string => parts.map(stripSlashes).filter(Boolean).join("/");

export async function listRemote(
	bucket: string,
	prefix: string,
	opts: CommonOptions & { recursive: boolean },
): Promise<ListFileEntry[]> {
	const entries: ListFileEntry[] = [];
	for await (const entry of listFiles({
		repo: repoOf(bucket),
		path: stripSlashes(prefix) || undefined,
		recursive: opts.recursive,
		accessToken: opts.token,
		hubUrl: opts.hubUrl,
	})) {
		entries.push(entry);
	}
	return entries;
}

export async function walkLocal(dir: string): Promise<Array<{ rel: string; abs: string }>> {
	const files: Array<{ rel: string; abs: string }> = [];
	const walk = async (current: string) => {
		for (const entry of await readdir(current, { withFileTypes: true })) {
			const abs = join(current, entry.name);
			if (entry.isDirectory()) {
				await walk(abs);
			} else if (entry.isFile()) {
				files.push({ rel: relative(dir, abs).split(sep).join("/"), abs });
			}
		}
	};
	await walk(dir);
	return files;
}

/** Returns size and mtime (ms) of a regular file, or `null` if the path is missing or is a directory. */
export async function statLocal(path: string): Promise<{ size: number; mtime: number } | null> {
	const info = await stat(path).catch(() => null);
	return info && !info.isDirectory() ? { size: info.size, mtime: info.mtimeMs } : null;
}

/** Port of huggingface_hub's `FilterMatcher`. */
export class FilterMatcher {
	constructor(
		private readonly include: string[] = [],
		private readonly exclude: string[] = [],
		private readonly rules: Array<["+" | "-", string]> = [],
	) {}

	matches(path: string): boolean {
		for (const [sign, pattern] of this.rules) {
			if (fnmatch(path, pattern)) {
				return sign === "+";
			}
		}
		if (this.exclude.some((pattern) => fnmatch(path, pattern))) {
			return false;
		}
		if (this.include.some((pattern) => fnmatch(path, pattern))) {
			return true;
		}
		return this.include.length === 0;
	}
}

export async function parseFilterFile(path: string): Promise<Array<["+" | "-", string]>> {
	const rules: Array<["+" | "-", string]> = [];
	for (const rawLine of (await readFile(path, "utf-8")).split("\n")) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}
		if (line.startsWith("+")) {
			rules.push(["+", line.slice(1).trim()]);
		} else if (line.startsWith("-")) {
			rules.push(["-", line.slice(1).trim()]);
		} else {
			rules.push(["+", line]);
		}
	}
	return rules;
}

export async function confirm(message: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		return /^y(es)?$/i.test((await rl.question(`${message} [y/N]: `)).trim());
	} finally {
		rl.close();
	}
}

export function formatSize(size: number, humanReadable?: boolean): string {
	if (!humanReadable) {
		return String(size);
	}
	const units = ["B", "K", "M", "G", "T"];
	let value = size;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return unit === 0 ? `${value}B` : `${value.toFixed(1)}${units[unit]}`;
}
