import { streamJson } from "../utils/streamJson";

/**
 * Streaming reader for `*.safetensors.index.json`.
 *
 * These files are pathological for `JSON.parse`: for a large MoE the `weight_map` holds one entry
 * per tensor (Kimi-K3: ~497k entries, ~60 MB) while the only things we actually need out of it are
 * the handful of *distinct* shard filenames it points at, plus the small `metadata` object.
 *
 * So we walk the document as an event stream and keep only that. Peak memory is proportional to
 * the number of shards (~100) rather than the number of tensors (~500k), which means there is no
 * size limit to tune and no memory-exhaustion vector from a crafted index.
 */

export interface SafetensorsIndexHeader {
	dtype?: string;
	metadata?: { total_parameters?: string | number } & Record<string, string>;
	/** Distinct shard filenames referenced by `weight_map`, in first-seen order. */
	shardFilenames: string[];
	/** Number of entries seen in `weight_map`. */
	weightMapEntryCount: number;
	/**
	 * The full `weight_map`, materialized only when it stayed under `maxWeightMapEntries`.
	 *
	 * `undefined` means "too large to materialize", never "absent from the file" — check
	 * `weightMapEntryCount` to distinguish.
	 */
	weightMap?: Record<string, string>;
}

export class SafetensorsIndexParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SafetensorsIndexParseError";
	}
}

/**
 * Streaming still means downloading, so keep a ceiling on how many bytes we're willing to pull for
 * an index file. Generous compared to the largest real ones (~60 MB today), but bounded.
 */
export const MAX_INDEX_BYTES = 250_000_000; // 250MB

/**
 * Above this, `weightMap` is dropped and only `shardFilenames` is kept. Every real model is far
 * below it; the giant MoEs that aren't currently fail to parse at all.
 */
export const MAX_WEIGHT_MAP_ENTRIES = 200_000;

/** Caps how much of `metadata` we keep, since it's attacker-controlled and fully materialized. */
const MAX_METADATA_ENTRIES = 1_000;

/**
 * Index files are attacker-controlled (anyone can push one), so every unbounded dimension needs a
 * ceiling. Streaming removes "size of the document" as one; these cover the rest.
 */

/**
 * Longest single string we accept. Tensor names, shard filenames and metadata values are all far
 * below this; anything longer is malformed or hostile. Without it, one 200 MB string inside an
 * otherwise tiny index would be buffered in full just to be emitted.
 */
const MAX_TOKEN_LENGTH = 100_000;

/** JSON nesting depth. Real indexes are 2 deep. */
const MAX_DEPTH = 64;

/**
 * Total budget for everything we *retain* (shard filenames + metadata + `weightMap`).
 *
 * Streaming bounds transient memory, but a crafted index could still make us retain a lot by
 * holding many distinct long filenames. ~48M chars (~96 MB UTF-16) sits above the largest
 * legitimate `weightMap` we'd materialize (200k entries x ~90 chars ~= 18M) while keeping a hard
 * ceiling. Realistic large-MoE parses retain well under 1 MB.
 */
const MAX_RETAINED_CHARS = 48_000_000;

/**
 * Wraps a byte stream to abort past `maxBytes`.
 *
 * Also the place where early termination pays off: throwing here propagates into `streamJson`'s
 * `finally`, which cancels the reader and lets the HTTP response be torn down mid-body.
 */
async function* limitBytes(stream: ReadableStream<Uint8Array>, maxBytes: number): AsyncGenerator<Uint8Array> {
	let total = 0;
	const reader = stream.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				return;
			}
			if (!value) {
				continue;
			}
			total += value.length;
			if (total > maxBytes) {
				throw new SafetensorsIndexParseError(
					`safetensors index is too big. Maximum supported size is ${maxBytes} bytes.`,
				);
			}
			yield value;
		}
	} finally {
		await reader.cancel().catch(() => undefined);
	}
}

export async function parseSafetensorsIndexStream(
	stream: ReadableStream<Uint8Array>,
	options?: {
		maxBytes?: number;
		maxShardCount?: number;
		maxWeightMapEntries?: number;
	},
): Promise<SafetensorsIndexHeader> {
	const maxBytes = options?.maxBytes ?? MAX_INDEX_BYTES;
	const maxWeightMapEntries = options?.maxWeightMapEntries ?? MAX_WEIGHT_MAP_ENTRIES;
	const maxShardCount = options?.maxShardCount ?? Infinity;

	const shardFilenames: string[] = [];
	const shardSet = new Set<string>();
	let weightMap: Record<string, string> | undefined = {};
	let weightMapEntryCount = 0;
	/** Chars charged to the budget by `weightMap`, refunded if we end up dropping it. */
	let retainedInWeightMap = 0;
	let metadata: SafetensorsIndexHeader["metadata"];
	let dtype: string | undefined;

	/** Nesting depth: 1 = directly inside the root object. */
	let depth = 0;
	/** The root-level key whose value we're currently inside (or reading). */
	let rootKey: string | undefined;
	/** The most recent key at depth >= 2, i.e. an entry of `weight_map` / `metadata`. */
	let entryKey: string | undefined;
	let sawRootObject = false;

	/** Running total of characters we've decided to hold on to, against MAX_RETAINED_CHARS. */
	let retainedChars = 0;
	const retain = (chars: number): void => {
		retainedChars += chars;
		if (retainedChars > MAX_RETAINED_CHARS) {
			throw new SafetensorsIndexParseError(
				`safetensors index retains more than ${MAX_RETAINED_CHARS} characters of metadata/filenames`,
			);
		}
	};

	for await (const event of streamJson(limitBytes(stream, maxBytes), {
		maxTokenLength: MAX_TOKEN_LENGTH,
		maxDepth: MAX_DEPTH,
	})) {
		switch (event.type) {
			case "startObject":
			case "startArray":
				depth++;
				if (depth === 1) {
					if (event.type === "startArray") {
						throw new SafetensorsIndexParseError("safetensors index must be a JSON object");
					}
					sawRootObject = true;
				}
				entryKey = undefined;
				break;

			case "endObject":
			case "endArray":
				depth--;
				// back at the root level: we've finished consuming rootKey's value
				if (depth <= 1) {
					rootKey = undefined;
					entryKey = undefined;
				}
				break;

			case "key":
				if (depth === 1) {
					rootKey = event.key;
					entryKey = undefined;
				} else {
					entryKey = event.key;
				}
				break;

			case "value": {
				if (depth === 1) {
					if (rootKey === "dtype" && typeof event.value === "string") {
						dtype = event.value;
					}
					rootKey = undefined;
					break;
				}

				if (depth !== 2 || entryKey === undefined) {
					break; // deeper nesting / array items: nothing we need
				}

				if (rootKey === "weight_map") {
					if (typeof event.value !== "string") {
						break;
					}
					weightMapEntryCount++;
					if (!shardSet.has(event.value)) {
						retain(event.value.length);
						shardSet.add(event.value);
						shardFilenames.push(event.value);
						if (shardSet.size > maxShardCount) {
							throw new SafetensorsIndexParseError(
								`Too many shard files (>${maxShardCount}). Maximum supported is ${maxShardCount}.`,
							);
						}
					}
					// past the cap, stop materializing the map but keep collecting shard names
					if (weightMap !== undefined) {
						if (weightMapEntryCount > maxWeightMapEntries) {
							// drop it wholesale, and stop counting it against the retention budget
							retainedChars -= retainedInWeightMap;
							weightMap = undefined;
						} else {
							const cost = entryKey.length + event.value.length;
							retainedInWeightMap += cost;
							retain(cost);
							weightMap[entryKey] = event.value;
						}
					}
				} else if (rootKey === "metadata") {
					metadata ??= {};
					if (Object.keys(metadata).length < MAX_METADATA_ENTRIES) {
						retain(entryKey.length + (typeof event.value === "string" ? event.value.length : 8));
						// values are typed as strings upstream but are sometimes numbers in the wild
						metadata[entryKey] = event.value as string;
					}
				}
				entryKey = undefined;
				break;
			}
		}
	}

	if (!sawRootObject) {
		throw new SafetensorsIndexParseError("safetensors index must be a JSON object");
	}

	return { dtype, metadata, shardFilenames, weightMapEntryCount, weightMap };
}
