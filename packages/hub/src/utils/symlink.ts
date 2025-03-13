/**
 * Heavily inspired by https://github.com/huggingface/huggingface_hub/blob/fcfd14361bd03f23f82efced1aa65a7cbfa4b922/src/huggingface_hub/file_download.py#L517
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import { getHFHubCachePath } from "../lib";
import * as os from "node:os";

const _are_symlinks_supported_in_dir = new Map<string, boolean>();

export function reset(): void {
	_are_symlinks_supported_in_dir.clear();
}

function expandUser(path: string): string {
	if (path.startsWith("~")) {
		return path.replace("~", process.env.HOME ?? "");
	}
	return path;
}

function commonPath(paths: string[]): string {
	if (!paths.length) return "";

	const parts = paths.map((p) => p.split(path.sep));
	const common = parts[0];

	for (let i = 1; i < parts.length; i++) {
		for (let j = 0; j < common.length; j++) {
			if (parts[i][j] !== common[j]) {
				common.length = j;
				break;
			}
		}
	}

	return common.join(path.sep) || path.sep;
}

async function areSymlinksSupported(cache_dir: string | undefined): Promise<boolean> {
	if (!cache_dir) {
		cache_dir = getHFHubCachePath();
	}
	cache_dir = path.resolve(expandUser(cache_dir));
	if (!_are_symlinks_supported_in_dir.has(cache_dir)) {
		_are_symlinks_supported_in_dir.set(cache_dir, true);

		await fs.mkdir(cache_dir, { recursive: true });
		const tmp_dir = await fs.mkdtemp(cache_dir);
		try {
			const src_path = path.join(tmp_dir, "dummy_src");
			await fs.open(src_path, "w").then((fd) => fd.close());
			const dst_path = path.join(tmp_dir, "dummy_dst");

			const relative_src = path.relative(src_path, path.dirname(dst_path));
			try {
				await fs.symlink(dst_path, relative_src);
			} catch (_e: unknown) {
				_are_symlinks_supported_in_dir.set(cache_dir, false);

				if (!process.env.HF_HUB_DISABLE_SYMLINKS_WARNING) {
					let message = `
					\`huggingface_hub\` cache-system uses symlinks by default to
					efficiently store duplicated files but your machine does not
					support them in ${cache_dir}. Caching files will still work
					but in a degraded version that might require more space on
					your disk. This warning can be disabled by setting the
					\`HF_HUB_DISABLE_SYMLINKS_WARNING\` environment variable. For
					more details, see
					https://huggingface.co/docs/huggingface_hub/how-to-cache#limitations.
					`;
					if (os.platform() === "win32") {
						message += `
						\nTo support symlinks on Windows, you either need to
						activate Developer Mode or to run Python as an
						administrator. In order to activate developer mode,
						see this article:
						https://docs.microsoft.com/en-us/windows/apps/get-started/enable-your-device-for-development
						`;
					}
					console.warn(message);
				}
			}
		} finally {
			await fs.rm(tmp_dir, { recursive: true });
		}
	}
	return _are_symlinks_supported_in_dir.get(cache_dir) ?? false;
}

export async function createSymlink(dst: string, src: string, new_blob?: boolean): Promise<void> {
	try {
		await fs.rm(dst);
	} catch (_e: unknown) {
		/* empty */
	}
	const abs_src = path.resolve(expandUser(src));
	const abs_dst = path.resolve(expandUser(dst));
	const abs_dst_dir = path.dirname(abs_dst);

	let related_src: string | undefined;
	try {
		related_src = path.relative(abs_dst_dir, abs_src);
	} catch (_e: unknown) {
		related_src = undefined;
	}

	let _support_symlink: boolean;
	try {
		const common_path = commonPath([abs_src, abs_dst]);
		_support_symlink = await areSymlinksSupported(common_path);
	} catch (_e: unknown) {
		_support_symlink = false;
	}
	if (_support_symlink) {
		const src_rel_or_abs = related_src ?? abs_src;
		console.debug(`Creating pointer from ${src_rel_or_abs} to ${abs_dst}`);
		await fs.symlink(abs_dst, src_rel_or_abs);
		return;
	}

	if (new_blob) {
		console.info(`Symlink not supported. Moving file from ${abs_src} to ${abs_dst}`);
		await fs.rename(abs_src, abs_dst);
	} else {
		console.info(`Symlink not supported. Copying file from ${abs_src} to ${abs_dst}`);
		await fs.copyFile(abs_src, abs_dst);
	}
}
