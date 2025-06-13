// Constants from the reference implementation
const OUT_LEN: i32 = 32;
// const KEY_LEN: usize = 32;
const BLOCK_LEN: i32 = 64;
const CHUNK_LEN: i32 = 1024;

const CHUNK_START: u32 = 1 << 0;
const CHUNK_END: u32 = 1 << 1;
const PARENT: u32 = 1 << 2;
const ROOT: u32 = 1 << 3;
//const KEYED_HASH: u32 = 1 << 4;
//const DERIVE_KEY_CONTEXT: u32 = 1 << 5;
// const DERIVE_KEY_MATERIAL: u32 = 1 << 6;

const IV: StaticArray<u32> = [
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

const MSG_PERMUTATION: StaticArray<i32> = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

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

function round(state: StaticArray<u32>, m: StaticArray<u32>): void {
	// Mix the columns.
	g(state, 0, 4, 8, 12, m[0], m[1]);
	g(state, 1, 5, 9, 13, m[2], m[3]);
	g(state, 2, 6, 10, 14, m[4], m[5]);
	g(state, 3, 7, 11, 15, m[6], m[7]);
	// Mix the diagonals.
	g(state, 0, 5, 10, 15, m[8], m[9]);
	g(state, 1, 6, 11, 12, m[10], m[11]);
	g(state, 2, 7, 8, 13, m[12], m[13]);
	g(state, 3, 4, 9, 14, m[14], m[15]);
}

function permute(m: StaticArray<u32>): void {
	const permuted = new StaticArray<u32>(16);
	for (let i = 0; i < 16; i++) {
		permuted[i] = m[MSG_PERMUTATION[i]];
	}
	for (let i = 0; i < 16; i++) {
		m[i] = permuted[i];
	}
}

function compress(
	chaining_value: StaticArray<u32>,
	block_words: StaticArray<u32>,
	counter: u64,
	block_len: u32,
	flags: u32
): StaticArray<u32> {
	const counter_low = counter as u32;
	const counter_high = (counter >> 32) as u32;
	const state = new StaticArray<u32>(16);

	// Initialize state
	for (let i = 0; i < 8; i++) {
		state[i] = chaining_value[i];
		state[i + 8] = IV[i];
	}
	state[12] = counter_low;
	state[13] = counter_high;
	state[14] = block_len;
	state[15] = flags;

	const block = new StaticArray<u32>(16);
	for (let i = 0; i < 16; i++) {
		block[i] = block_words[i];
	}

	// Apply rounds
	round(state, block);
	permute(block);
	round(state, block);
	permute(block);
	round(state, block);
	permute(block);
	round(state, block);
	permute(block);
	round(state, block);
	permute(block);
	round(state, block);
	permute(block);
	round(state, block);

	// Final mixing
	for (let i = 0; i < 8; i++) {
		state[i] ^= state[i + 8];
		state[i + 8] ^= chaining_value[i];
	}

	return state;
}

function words_from_little_endian_bytes(bytes: Uint8Array, words: StaticArray<u32>): void {
	for (let i = 0; i < words.length; i++) {
		const offset = i * 4;
		words[i] = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
	}
}

class Blake3Hasher {
	private chunk_state: ChunkState;
	private key_words: StaticArray<u32>;
	private cv_stack: StaticArray<StaticArray<u32>>;
	private cv_stack_len: u8;
	private flags: u32;

	constructor() {
		const key_words = new StaticArray<u32>(8);
		for (let i = 0; i < 8; i++) {
			key_words[i] = IV[i];
		}
		this.key_words = key_words;
		this.chunk_state = new ChunkState(key_words, 0, 0);
		this.cv_stack = new StaticArray<StaticArray<u32>>(54);
		this.cv_stack_len = 0;
		this.flags = 0;

		for (let i = 0; i < 54; i++) {
			this.cv_stack[i] = new StaticArray<u32>(8);
		}
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
	block: Uint8Array;
	block_len: u8;
	blocks_compressed: u8;
	flags: u32;

	constructor(key_words: StaticArray<u32>, chunk_counter: u64, flags: u32) {
		this.chaining_value = new StaticArray<u32>(8);
		this.chunk_counter = chunk_counter;
		this.block = new Uint8Array(BLOCK_LEN);
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
				const block_words = new StaticArray<u32>(16);
				words_from_little_endian_bytes(this.block, block_words);
				const compressed = compress(
					this.chaining_value,
					block_words,
					this.chunk_counter,
					BLOCK_LEN,
					this.flags | this.start_flag()
				);
				for (let i = 0; i < 8; i++) {
					this.chaining_value[i] = compressed[i];
				}
				this.blocks_compressed++;
				this.block = new Uint8Array(BLOCK_LEN);
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
		const block_words = new StaticArray<u32>(16);
		words_from_little_endian_bytes(this.block, block_words);
		return new Output(
			this.chaining_value,
			block_words,
			this.chunk_counter,
			this.block_len,
			this.flags | this.start_flag() | CHUNK_END
		);
	}
}

class Output {
	input_chaining_value: StaticArray<u32>;
	block_words: StaticArray<u32>;
	counter: u64;
	block_len: u32;
	flags: u32;

	constructor(
		input_chaining_value: StaticArray<u32>,
		block_words: StaticArray<u32>,
		counter: u64,
		block_len: u32,
		flags: u32
	) {
		this.input_chaining_value = input_chaining_value;
		this.block_words = block_words;
		this.counter = counter;
		this.block_len = block_len;
		this.flags = flags;
	}

	chaining_value(): StaticArray<u32> {
		const compressed = compress(this.input_chaining_value, this.block_words, this.counter, this.block_len, this.flags);
		const result = new StaticArray<u32>(8);
		for (let i = 0; i < 8; i++) {
			result[i] = compressed[i];
		}
		return result;
	}

	root_output_bytes(out: Uint8Array): void {
		let output_block_counter: u64 = 0;
		for (let i = 0; i < out.length; i += 2 * OUT_LEN) {
			const words = compress(
				this.input_chaining_value,
				this.block_words,
				output_block_counter,
				this.block_len,
				this.flags | ROOT
			);
			const out_block = out.subarray(i, i + 2 * OUT_LEN);
			for (let j = 0; j < words.length; j++) {
				const word = words[j];
				const offset = j * 4;
				if (offset < out_block.length) {
					out_block[offset] = word & 0xff;
					if (offset + 1 < out_block.length) {
						out_block[offset + 1] = (word >> 8) & 0xff;
						if (offset + 2 < out_block.length) {
							out_block[offset + 2] = (word >> 16) & 0xff;
							if (offset + 3 < out_block.length) {
								out_block[offset + 3] = (word >> 24) & 0xff;
							}
						}
					}
				}
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
	const block_words = new StaticArray<u32>(16);
	for (let i = 0; i < 8; i++) {
		block_words[i] = left_child_cv[i];
		block_words[i + 8] = right_child_cv[i];
	}
	return new Output(key_words, block_words, 0, BLOCK_LEN, PARENT | flags);
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
