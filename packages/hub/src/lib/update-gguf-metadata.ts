import type { CredentialsParams, RepoDesignation } from "../types/public";
import type { CommitOutput } from "./commit";
import { commit } from "./commit";
import { toRepoId } from "../utils/toRepoId";

/**
 * Update the metadata of a GGUF file on Hugging Face Hub.
 * This function is highly optimized for efficiency:
 *
 * 1. Reads only the metadata header from the remote GGUF file (typically a few KB)
 * 2. Uses WebBlob with range requests to access only the tensor data when needed
 * 3. Uses the edit operation to replace only the metadata section, preserving the tensor data
 *
 * This approach avoids downloading the entire file (which can be several GB) and only
 * transfers the minimal amount of data needed for the update operation.
 *
 * @example
 * ```typescript
 * // First, get the current metadata
 * const { typedMetadata: currentMetadata } = await gguf("https://huggingface.co/username/model-repo/resolve/main/model.gguf", {
 *   typedMetadata: true,
 * });
 *
 * // Update the metadata - no need to download the full file!
 * const result = await updateGgufMetadata({
 *   repo: "username/model-repo",
 *   path: "model.gguf",
 *   accessToken: "hf_...",
 *   updatedMetadata: {
 *     ...currentMetadata,
 *     "general.name": { value: "My Updated Model", type: GGUFValueType.STRING },
 *     "general.description": { value: "Updated description", type: GGUFValueType.STRING },
 *   },
 *   commitTitle: "Update model metadata",
 * });
 * ```
 *
 * @param params - Parameters for updating GGUF metadata
 * @returns Promise resolving to the commit output
 */
export async function updateGgufMetadata(
	params: {
		/**
		 * Repository designation (e.g., "username/repo-name")
		 */
		repo: RepoDesignation;
		/**
		 * Path to the GGUF file in the repository
		 */
		path: string;
		/**
		 * The updated metadata to write to the GGUF file
		 */
		updatedMetadata: any;
		/**
		 * Optional commit title
		 * @default "Update GGUF metadata"
		 */
		commitTitle?: string;
		/**
		 * Optional commit description
		 */
		commitDescription?: string;
		/**
		 * Optional Git revision (branch, tag, or commit hash)
		 * @default "main"
		 */
		revision?: string;
		/**
		 * Optional Hub URL
		 */
		hubUrl?: string;
		/**
		 * Optional branch name
		 * @default "main"
		 */
		branch?: string;
		/**
		 * Whether to create a pull request instead of committing directly
		 * @default false
		 */
		isPullRequest?: boolean;
		/**
		 * Custom fetch function
		 */
		fetch?: typeof fetch;
		/**
		 * Whether to use little endian byte order for serialization
		 * @default Uses the same endianness as the original GGUF file
		 */
		littleEndian?: boolean;
		/**
		 * Whether to use Xet for efficient editing
		 * @default true (required for edit operations)
		 */
		useXet?: boolean;
	} & Partial<CredentialsParams>
): Promise<CommitOutput> {
	// Import gguf functions dynamically to avoid circular dependencies
	const { gguf, serializeGgufHeader, serializeTypedMetadata } = await import("@huggingface/gguf");

	// Build the remote URL for the GGUF file
	const hubUrl = params.hubUrl ?? "https://huggingface.co";
	const revision = params.revision ?? "main";
	const repoId = toRepoId(params.repo);
	const remoteUrl = `${hubUrl}/${repoId.type === "model" ? "" : `${repoId.type}s/`}${repoId.name}/resolve/${revision}/${params.path}`;

	// Parse the remote GGUF file to get typed metadata (this only downloads the header)
	const {
		typedMetadata: currentMetadata,
		tensorDataOffset,
		tensorInfos,
		littleEndian,
	} = await gguf(remoteUrl, {
		typedMetadata: true,
		fetch: params.fetch,
		additionalFetchHeaders: params.accessToken
			? {
					Authorization: `Bearer ${params.accessToken}`,
				}
			: undefined,
	});

	// Ensure the updated metadata preserves the original version and structure
	// This is critical to avoid corrupting the file
	const preservedMetadata = {
		...params.updatedMetadata,
		// Always preserve the original version, tensor_count, and kv_count from the current file
		version: currentMetadata.version,
		tensor_count: currentMetadata.tensor_count,
		kv_count: currentMetadata.kv_count, // Keep the original kv_count - it should match the actual data
	};

	// Use the complete GGUF serializer that includes both metadata and tensor info
	const alignment = Number(currentMetadata["general.alignment"] ?? 32);
	const completeHeaderBlob = serializeGgufHeader(preservedMetadata, tensorInfos, {
		littleEndian: params.littleEndian ?? littleEndian,
		alignment,
	});
	const modifiedHeaderBytes = new Uint8Array(await completeHeaderBlob.arrayBuffer());

	// Step 4: Get the tensor data from the original file
	const tensorDataResponse = await (params.fetch ?? fetch)(remoteUrl, {
		headers: {
			...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
			Range: `bytes=${tensorDataOffset}-`,
		},
	});
	const tensorDataBlob = new Blob([await tensorDataResponse.arrayBuffer()]);

	// Step 5: Combine complete header + tensor data
	const completeFileBlob = new Blob([modifiedHeaderBytes, tensorDataBlob]);

	// Use a simple addOrUpdate operation instead of edit
	return await commit({
		...params,
		repo: params.repo,
		title: params.commitTitle ?? "Update GGUF metadata",
		description: params.commitDescription,
		branch: params.branch,
		isPullRequest: params.isPullRequest,
		hubUrl: params.hubUrl,
		fetch: params.fetch,
		useXet: params.useXet ?? true,
		operations: [
			{
				operation: "addOrUpdate",
				path: params.path,
				content: completeFileBlob,
			},
		],
	});
}
