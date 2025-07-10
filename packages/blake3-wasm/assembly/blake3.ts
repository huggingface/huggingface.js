// Constants from the reference implementation
const OUT_LEN: i32 = 32;
// const KEY_LEN: usize = 32;
const BLOCK_LEN: i32 = 64;
const CHUNK_LEN: i32 = 1024;

const CHUNK_START: u32 = 1 << 0;
const CHUNK_END: u32 = 1 << 1;
const PARENT: u32 = 1 << 2;
const ROOT: u32 = 1 << 3;
const KEYED_HASH: u32 = 1 << 4;
//const DERIVE_KEY_CONTEXT: u32 = 1 << 5;
// const DERIVE_KEY_MATERIAL: u32 = 1 << 6;

const IV: StaticArray<u32> = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// Message schedule for each round - this replaces the simple permutation
const MSG_SCHEDULE: StaticArray<StaticArray<i32>> = [
	[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
	[2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8],
	[3, 4, 10, 12, 13, 2, 7, 14, 6, 5, 9, 0, 11, 15, 8, 1],
	[10, 7, 12, 9, 14, 3, 13, 15, 4, 0, 11, 2, 5, 8, 1, 6],
	[12, 13, 9, 11, 15, 10, 14, 8, 7, 2, 5, 3, 0, 1, 6, 4],
	[9, 14, 11, 5, 8, 12, 15, 1, 13, 3, 0, 10, 2, 6, 4, 7],
	[11, 15, 5, 0, 1, 9, 8, 6, 14, 10, 2, 12, 3, 4, 7, 13],
];

// The mixing function, G, which mixes either a column or a diagonal.
function g(state: StaticArray<u32>, a: i32, b: i32, c: i32, d: i32, mx: u32, my: u32): void {
	state[a] = state[a] + state[b] + mx;
	state[d] = rotr(state[d] ^ state[a], 16);
	state[c] = state[c] + state[d];
	state[b] = rotr(state[b] ^ state[c], 12);
	state[a] = state[a] + state[b] + my;
	state[d] = rotr(state[d] ^ state[a], 8);
	state[c] = state[c] + state[d];
	state[b] = rotr(state[b] ^ state[c], 7);
}

// Optimized round function using MSG_SCHEDULE
function round(state: StaticArray<u32>, msg: StaticArray<u32>, round: i32): void {
	// Select the message schedule based on the round.
	const schedule = MSG_SCHEDULE[round];

	// Mix the columns.
	g(state, 0, 4, 8, 12, msg[schedule[0]], msg[schedule[1]]);
	g(state, 1, 5, 9, 13, msg[schedule[2]], msg[schedule[3]]);
	g(state, 2, 6, 10, 14, msg[schedule[4]], msg[schedule[5]]);
	g(state, 3, 7, 11, 15, msg[schedule[6]], msg[schedule[7]]);

	// Mix the diagonals.
	g(state, 0, 5, 10, 15, msg[schedule[8]], msg[schedule[9]]);
	g(state, 1, 6, 11, 12, msg[schedule[10]], msg[schedule[11]]);
	g(state, 2, 7, 8, 13, msg[schedule[12]], msg[schedule[13]]);
	g(state, 3, 4, 9, 14, msg[schedule[14]], msg[schedule[15]]);
}

// Optimized compress function based on Rust portable implementation
function compress_pre(
	cv: StaticArray<u32>,
	block: StaticArray<u8>,
	block_len: u8,
	counter: u64,
	flags: u8
): StaticArray<u32> {
	const block_words = words_from_le_bytes_64(block);

	const state = new StaticArray<u32>(16);
	// Initialize state more efficiently
	state[0] = cv[0];
	state[1] = cv[1];
	state[2] = cv[2];
	state[3] = cv[3];
	state[4] = cv[4];
	state[5] = cv[5];
	state[6] = cv[6];
	state[7] = cv[7];
	state[8] = IV[0];
	state[9] = IV[1];
	state[10] = IV[2];
	state[11] = IV[3];
	state[12] = counter as u32;
	state[13] = (counter >> 32) as u32;
	state[14] = block_len as u32;
	state[15] = flags as u32;

	// Apply 7 rounds using the optimized round function
	round(state, block_words, 0);
	round(state, block_words, 1);
	round(state, block_words, 2);
	round(state, block_words, 3);
	round(state, block_words, 4);
	round(state, block_words, 5);
	round(state, block_words, 6);

	return state;
}

// Optimized compress function that modifies CV in place
function compress_in_place(cv: StaticArray<u32>, block: StaticArray<u8>, block_len: u8, counter: u64, flags: u8): void {
	const state = compress_pre(cv, block, block_len, counter, flags);

	// Final mixing - XOR the halves
	cv[0] = state[0] ^ state[8];
	cv[1] = state[1] ^ state[9];
	cv[2] = state[2] ^ state[10];
	cv[3] = state[3] ^ state[11];
	cv[4] = state[4] ^ state[12];
	cv[5] = state[5] ^ state[13];
	cv[6] = state[6] ^ state[14];
	cv[7] = state[7] ^ state[15];
}

// Optimized compress function for XOF (extensible output function)
function compress_xof(
	cv: StaticArray<u32>,
	block: StaticArray<u8>,
	block_len: u8,
	counter: u64,
	flags: u8
): StaticArray<u8> {
	const mut_state = compress_pre(cv, block, block_len, counter, flags);

	// XOR the halves
	mut_state[0] ^= mut_state[8];
	mut_state[1] ^= mut_state[9];
	mut_state[2] ^= mut_state[10];
	mut_state[3] ^= mut_state[11];
	mut_state[4] ^= mut_state[12];
	mut_state[5] ^= mut_state[13];
	mut_state[6] ^= mut_state[14];
	mut_state[7] ^= mut_state[15];
	mut_state[8] ^= cv[0];
	mut_state[9] ^= cv[1];
	mut_state[10] ^= cv[2];
	mut_state[11] ^= cv[3];
	mut_state[12] ^= cv[4];
	mut_state[13] ^= cv[5];
	mut_state[14] ^= cv[6];
	mut_state[15] ^= cv[7];

	return le_bytes_from_words_64(mut_state);
}

// Optimized function to convert bytes to words (little-endian)
function words_from_le_bytes_64(bytes: StaticArray<u8>): StaticArray<u32> {
	const words = new StaticArray<u32>(16);
	for (let i = 0; i < 16; i++) {
		const offset = i * 4;
		words[i] =
			bytes[offset] |
			((bytes[offset + 1] as u32) << 8) |
			((bytes[offset + 2] as u32) << 16) |
			((bytes[offset + 3] as u32) << 24);
	}
	return words;
}

// Optimized function to convert words to bytes (little-endian)
function le_bytes_from_words_64(words: StaticArray<u32>): StaticArray<u8> {
	const bytes = new StaticArray<u8>(64);
	for (let i = 0; i < 16; i++) {
		const word = words[i];
		const offset = i * 4;
		bytes[offset] = word as u8;
		bytes[offset + 1] = (word >> 8) as u8;
		bytes[offset + 2] = (word >> 16) as u8;
		bytes[offset + 3] = (word >> 24) as u8;
	}
	return bytes;
}

// Optimized function to convert words to bytes (32-bit, little-endian)
function le_bytes_from_words_32(words: StaticArray<u32>): StaticArray<u8> {
	const bytes = new StaticArray<u8>(32);
	for (let i = 0; i < 8; i++) {
		const word = words[i];
		const offset = i * 4;
		bytes[offset] = word as u8;
		bytes[offset + 1] = (word >> 8) as u8;
		bytes[offset + 2] = (word >> 16) as u8;
		bytes[offset + 3] = (word >> 24) as u8;
	}
	return bytes;
}

class Blake3Hasher {
	private chunk_state: ChunkState;
	private key_words: StaticArray<u32>;
	private cv_stack: StaticArray<StaticArray<u32>>;
	private cv_stack_len: u8;
	private flags: u32;

	constructor(key_words: StaticArray<u32> = [IV[0], IV[1], IV[2], IV[3], IV[4], IV[5], IV[6], IV[7]], flags: u32 = 0) {
		this.key_words = key_words;
		this.chunk_state = new ChunkState(key_words, 0, flags);
		this.cv_stack = new StaticArray<StaticArray<u32>>(54);
		this.cv_stack_len = 0;
		this.flags = flags;

		for (let i = 0; i < 54; i++) {
			this.cv_stack[i] = new StaticArray<u32>(8);
		}
	}

	// Constructor for keyed hash
	static newKeyed(key: Uint8Array): Blake3Hasher {
		if (key.length != 32) {
			throw new Error("Key must be exactly 32 bytes");
		}

		const key_words = new StaticArray<u32>(8);
		const dataView = new DataView(key.buffer);
		for (let i = 0; i < 8; i++) {
			key_words[i] = dataView.getUint32(i * 4, true);
		}

		return new Blake3Hasher(key_words, KEYED_HASH);
	}

	update(input: Uint8Array): void {
		let inputPos = 0;
		while (inputPos < input.length) {
			if (this.chunk_state.len() == CHUNK_LEN) {
				const chunk_cv = this.chunk_state.output().chaining_value();
				const total_chunks = this.chunk_state.chunk_counter + 1;
				this.add_chunk_chaining_value(chunk_cv, total_chunks);
				this.chunk_state = new ChunkState(this.key_words, total_chunks, this.flags);
			}

			const want = CHUNK_LEN - this.chunk_state.len();
			const take = min(want, input.length - inputPos);
			this.chunk_state.update(input.subarray(inputPos, inputPos + take));
			inputPos += take;
		}
	}

	finalize(out: Uint8Array): void {
		let output = this.chunk_state.output();
		let parent_nodes_remaining = this.cv_stack_len;

		while (parent_nodes_remaining > 0) {
			parent_nodes_remaining--;
			output = parent_output(
				this.cv_stack[parent_nodes_remaining],
				output.chaining_value(),
				this.key_words,
				this.flags
			);
		}

		output.root_output_bytes(out);
	}

	private add_chunk_chaining_value(new_cv: StaticArray<u32>, total_chunks: u64): void {
		let mut_new_cv = new_cv;
		let mut_total_chunks = total_chunks;

		while ((mut_total_chunks & 1) == 0) {
			mut_new_cv = parent_cv(this.pop_stack(), mut_new_cv, this.key_words, this.flags);
			mut_total_chunks >>= 1;
		}

		this.push_stack(mut_new_cv);
	}

	private push_stack(cv: StaticArray<u32>): void {
		for (let i = 0; i < 8; i++) {
			this.cv_stack[this.cv_stack_len][i] = cv[i];
		}
		this.cv_stack_len++;
	}

	private pop_stack(): StaticArray<u32> {
		this.cv_stack_len--;
		return this.cv_stack[this.cv_stack_len];
	}
}

class ChunkState {
	chaining_value: StaticArray<u32>;
	chunk_counter: u64;
	block: StaticArray<u8>;
	block_len: u8;
	blocks_compressed: u8;
	flags: u32;

	constructor(key_words: StaticArray<u32>, chunk_counter: u64, flags: u32) {
		this.chaining_value = new StaticArray<u32>(8);
		this.chunk_counter = chunk_counter;
		this.block = new StaticArray<u8>(BLOCK_LEN);
		this.block_len = 0;
		this.blocks_compressed = 0;
		this.flags = flags;

		for (let i = 0; i < 8; i++) {
			this.chaining_value[i] = key_words[i];
		}
	}

	len(): i32 {
		return BLOCK_LEN * this.blocks_compressed + this.block_len;
	}

	start_flag(): u32 {
		return this.blocks_compressed == 0 ? CHUNK_START : 0;
	}

	update(input: Uint8Array): void {
		let inputPos = 0;
		while (inputPos < input.length) {
			if (this.block_len == BLOCK_LEN) {
				// Use optimized compress_in_place
				compress_in_place(
					this.chaining_value,
					this.block,
					BLOCK_LEN as u8,
					this.chunk_counter,
					(this.flags | this.start_flag()) as u8
				);
				this.blocks_compressed++;
				this.block = new StaticArray<u8>(BLOCK_LEN);
				this.block_len = 0;
			}

			const want = BLOCK_LEN - this.block_len;
			const take = min(want, input.length - inputPos);
			for (let i = 0; i < take; i++) {
				this.block[this.block_len + i] = input[inputPos + i];
			}
			this.block_len += take as u8;
			inputPos += take;
		}
	}

	output(): Output {
		return new Output(
			this.chaining_value,
			this.block,
			this.chunk_counter,
			this.block_len,
			this.flags | this.start_flag() | CHUNK_END
		);
	}
}

class Output {
	input_chaining_value: StaticArray<u32>;
	block: StaticArray<u8>;
	block_len: u8;
	counter: u64;
	flags: u32;

	constructor(input_chaining_value: StaticArray<u32>, block: StaticArray<u8>, counter: u64, block_len: u8, flags: u32) {
		this.input_chaining_value = input_chaining_value;
		this.block = block;
		this.counter = counter;
		this.block_len = block_len;
		this.flags = flags;
	}

	chaining_value(): StaticArray<u32> {
		const cv_copy = new StaticArray<u32>(8);
		for (let i = 0; i < 8; i++) {
			cv_copy[i] = this.input_chaining_value[i];
		}
		compress_in_place(cv_copy, this.block, this.block_len, this.counter, this.flags as u8);
		return cv_copy;
	}

	root_output_bytes(out: Uint8Array): void {
		let output_block_counter: u64 = 0;
		for (let i = 0; i < out.length; i += 2 * OUT_LEN) {
			const xof_output = compress_xof(
				this.input_chaining_value,
				this.block,
				this.block_len,
				output_block_counter,
				(this.flags | ROOT) as u8
			);
			const out_block = out.subarray(i, i + 2 * OUT_LEN);
			for (let j = 0; j < out_block.length; j++) {
				out_block[j] = xof_output[j];
			}
			output_block_counter++;
		}
	}
}

function parent_output(
	left_child_cv: StaticArray<u32>,
	right_child_cv: StaticArray<u32>,
	key_words: StaticArray<u32>,
	flags: u32
): Output {
	const block = new StaticArray<u8>(BLOCK_LEN);
	const left_bytes = le_bytes_from_words_32(left_child_cv);
	const right_bytes = le_bytes_from_words_32(right_child_cv);

	// Copy left child bytes
	for (let i = 0; i < 32; i++) {
		block[i] = left_bytes[i];
	}
	// Copy right child bytes
	for (let i = 0; i < 32; i++) {
		block[32 + i] = right_bytes[i];
	}

	return new Output(key_words, block, 0, BLOCK_LEN as u8, PARENT | flags);
}

function parent_cv(
	left_child_cv: StaticArray<u32>,
	right_child_cv: StaticArray<u32>,
	key_words: StaticArray<u32>,
	flags: u32
): StaticArray<u32> {
	return parent_output(left_child_cv, right_child_cv, key_words, flags).chaining_value();
}

export function blake3(input: Uint8Array): Uint8Array {
	const hasher = new Blake3Hasher();
	hasher.update(input);
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}

export function blake3Hex(input: Uint8Array): string {
	const hash = blake3(input);
	const hex = new Array<string>(64);
	for (let i = 0; i < 32; i++) {
		hex[i * 2] = (hash[i] >> 4).toString(16);
		hex[i * 2 + 1] = (hash[i] & 0x0f).toString(16);
	}
	return hex.join("");
}

export function blake3Keyed(input: Uint8Array, key: Uint8Array): Uint8Array {
	const hasher = Blake3Hasher.newKeyed(key);
	hasher.update(input);
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}

export function blake3KeyedHex(input: Uint8Array, key: Uint8Array): string {
	const hash = blake3Keyed(input, key);
	const hex = new Array<string>(64);
	for (let i = 0; i < 32; i++) {
		hex[i * 2] = (hash[i] >> 4).toString(16);
		hex[i * 2 + 1] = (hash[i] & 0x0f).toString(16);
	}
	return hex.join("");
}

export function createHasher(): Blake3Hasher {
	return new Blake3Hasher();
}

export function createKeyedHasher(key: Uint8Array): Blake3Hasher {
	return Blake3Hasher.newKeyed(key);
}

export function update(hasher: Blake3Hasher, input: Uint8Array): void {
	hasher.update(input);
}

export function finalize(hasher: Blake3Hasher): Uint8Array {
	const output = new Uint8Array(32);
	hasher.finalize(output);
	return output;
}
