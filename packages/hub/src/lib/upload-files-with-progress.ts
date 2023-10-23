import type { CommitOutput, CommitParams, CommitProgressEvent, ContentSource } from "./commit";
import { commitIter } from "./commit";

const multipartUploadTracking = new WeakMap<
	(progress: number) => void,
	{
		paths: Record<
			string,
			{
				numParts: number;
				partsProgress: Record<number, number>;
			}
		>;
	}
>();

/**
 * Uploads with progress
 *
 * Needs XMLHttpRequest to be available for progress events for uploads
 * Set useWebWorkers to true in order to have progress events for hashing
 */
export async function* uploadFilesWithProgress(params: {
	credentials?: CommitParams["credentials"];
	repo: CommitParams["repo"];
	files: Array<URL | File | { path: string; content: ContentSource }>;
	commitTitle?: CommitParams["title"];
	commitDescription?: CommitParams["description"];
	hubUrl?: CommitParams["hubUrl"];
	branch?: CommitParams["branch"];
	isPullRequest?: CommitParams["isPullRequest"];
	parentCommit?: CommitParams["parentCommit"];
	/**
	 * Set this to true in order to have progress events for hashing
	 */
	useWebWorkers?: CommitParams["useWebWorkers"];
}): AsyncGenerator<CommitProgressEvent, CommitOutput> {
	return yield* commitIter({
		credentials: params.credentials,
		repo: params.repo,
		operations: params.files.map((file) => ({
			operation: "addOrUpdate",
			path: file instanceof URL ? file.pathname.split("/").at(-1) ?? "file" : "path" in file ? file.path : file.name,
			content: "content" in file ? file.content : file,
		})),
		title: params.commitTitle ?? `Add ${params.files.length} files`,
		description: params.commitDescription,
		hubUrl: params.hubUrl,
		branch: params.branch,
		isPullRequest: params.isPullRequest,
		parentCommit: params.parentCommit,
		useWebWorkers: params.useWebWorkers,
		fetch: async (input, init) => {
			if (!init) {
				return fetch(input);
			}

			if (
				init.method !== "PUT" ||
				!("progressHint" in init) ||
				!("progressCallback" in init) ||
				typeof XMLHttpRequest === "undefined" ||
				typeof input !== "string" ||
				(!(init.body instanceof ArrayBuffer) && !(init.body instanceof Blob) && !(init.body instanceof File))
			) {
				return fetch(input, init);
			}

			const progressHint = init.progressHint as {
				path: string;
				progressCallback: (progress: number) => void;
			} & (Record<string, never> | { part: number; numParts: number });
			const progressCallback = init.progressCallback as (progress: number) => void;

			const xhr = new XMLHttpRequest();

			xhr.upload.addEventListener("progress", (event) => {
				if (event.lengthComputable) {
					if (progressHint.part !== undefined) {
						let tracking = multipartUploadTracking.get(progressCallback);
						if (!tracking) {
							tracking = { paths: {} };
							multipartUploadTracking.set(progressCallback, tracking);
						}
						const path = progressHint.path;
						if (!tracking.paths[path]) {
							tracking.paths[path] = { numParts: progressHint.numParts, partsProgress: {} };
						}
						const pathTracking = tracking.paths[path];
						pathTracking.partsProgress[progressHint.part] = event.loaded / event.total;
						let totalProgress = 0;
						for (const partProgress of Object.values(pathTracking.partsProgress)) {
							totalProgress += partProgress;
						}
						progressCallback(totalProgress / pathTracking.numParts);
					} else {
						progressCallback(event.loaded / event.total);
					}
				}
			});

			xhr.open(init.method, input, true);

			if (init.headers) {
				const headers = new Headers(init.headers);
				headers.forEach((value, key) => {
					xhr.setRequestHeader(key, value);
				});
			}

			xhr.send(init.body);

			return new Promise((resolve, reject) => {
				xhr.addEventListener("load", () => {
					resolve(new Response(xhr.responseText, { status: xhr.status, statusText: xhr.statusText }));
				});
				xhr.addEventListener("error", () => {
					reject(new Error(xhr.statusText));
				});
			});
		},
	});
}
