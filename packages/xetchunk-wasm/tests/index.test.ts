import { describe, it, expect } from "vitest";
import { createChunker, finalize, nextBlock, getChunks, hashToHex } from "../build/debug.js";
import { createRandomArray } from "@huggingface/splitmix64-wasm";

// Helper function to get chunk boundaries from chunks
function getChunkBoundaries(chunks: Array<{ length: number; hash: Uint8Array }>): number[] {
	let pos = 0;
	return chunks.map((chunk) => {
		pos += chunk.length;
		return pos;
	});
}

describe("xetchunk-wasm", () => {
	describe("Basic functionality with 1MB random data", () => {
		it("should pass 1MB random data test", async () => {
			// Create 1MB of random data with seed 0
			const dataBuffer = createRandomArray(1000000, 0);
			const data = new Uint8Array(dataBuffer);

			// Verify specific byte values (from Rust reference)
			expect(data[0]).toBe(175);
			expect(data[127]).toBe(132);
			expect(data[111111]).toBe(118);

			const referenceSha256 = "b3d0a1f7938cd4d8413a4dcffd4313e2e8ac0cb61cb1090eb140ea8e9154befb";
			const sha256 = await crypto.subtle.digest("SHA-256", data);
			const sha256Hex = Array.from(new Uint8Array(sha256))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("");
			expect(sha256Hex).toBe(referenceSha256);

			// Get chunks using the default chunker
			const chunks = getChunks(data);

			// Get chunk boundaries
			const chunkBoundaries = getChunkBoundaries(chunks);

			// Expected boundaries from Rust reference
			const expectedBoundaries = [
				84493, 134421, 144853, 243318, 271793, 336457, 467529, 494581, 582000, 596735, 616815, 653164, 678202, 724510,
				815591, 827760, 958832, 991092, 1000000,
			];

			const expectedChunkHashes = [
				"6eca1e7dadaf08cca5d82d318c800f07c2ddcec115a7e8627e5edd9605b94b8d",
				"624ea34d72a06e5d43a1b8dd10763f0d22f165992c397ed97563899b27fdd88a",
				"4411d2ec847c6e3f451a7451ff3933adb4f1c31587421b9f730b698a78313b47",
				"6342bde97433e29e0779ad33eb8040d986679040361b3cc3a06230fe60dd6c9b",
				"405253fcf15bba751adc4f507d3453273daff81ed4d8acd71c521aa1cbddc0b5",
				"4482374af7f8bebfdb5c5df0299f80128d6c58886ad7b218c562b1d74064e4cb",
				"80acc8d39c853b4b8a8c6ad7b63bf2ea68f62c2226b92f06349f92cc84d213cc",
				"a7076d7d343f711fb20fe6cd023248d8d051e8fe7d44172596cd5c7ea7edaf65",
				"44755217bbb4dadc81ea7695765230a34a2e6cb3b55f373f1de35aeba79ae92c",
				"001adc1d302d5f039278325dcbd5ec3b194f4794f1629d6f962f9f4bb78a7bff",
				"f8460a337c186f07c2e225bb287a1d3d3d686dc69d0828e99640f7d8852c5b90",
				"c9bc3da29025dc1ba562d303d815151d9a937367abb766ae842a165e8493d9fe",
				"5044339dfd65e8163bdfe642614a6be604b04d6aeacf222cf219ad287bfc5cf1",
				"163622db0fe0da93f2ef964eed4c485f3c7a9c312f8e8e8a312ab4bb8141f13e",
				"e1730534a858aa0258ad8904ef12b829b8a123a1c611250275c9ca9471e4c650",
				"1fbc6854f9185caba1e1f55393f41f83b895b18f9c99245c029025ca48f1e14b",
				"8a27b66ccf05b864b6bef6fb5c970fe894f73d2330e8e98fe7841dcdbd9e9576",
				"bc70a33e7a9ec820cac24b87023469a57bdae1bf91cc3961b95806c64a525221",
				"03e5b5f5a088269ec4b329f1e04debfac4cb54b9c0facf038f7e8e0f054be7e2",
			];

			expect(chunkBoundaries).toEqual(expectedBoundaries);
			expect(chunks.map((chunk) => hashToHex(chunk.hash))).toEqual(expectedChunkHashes);
		});
	});

	describe("Constant data test", () => {
		it("should pass 1MB constant data test", () => {
			// Create 1MB of constant data (value 59)
			const data = new Uint8Array(1000000);
			data.fill(59);

			// Get chunks using the default chunker
			const chunks = getChunks(data);

			// Get chunk boundaries
			const chunkBoundaries = getChunkBoundaries(chunks);

			// Expected boundaries from Rust reference
			const expectedBoundaries = [131072, 262144, 393216, 524288, 655360, 786432, 917504, 1000000];

			expect(chunkBoundaries).toEqual(expectedBoundaries);
		});
	});

	describe("Chunk boundary consistency test", () => {
		it("should maintain consistent chunk boundaries with different block sizes", () => {
			// Create 256KB of random data with seed 1
			const dataBuffer = createRandomArray(256000, 1n);
			const data = new Uint8Array(dataBuffer);

			// Get reference chunks using the default chunker
			const refChunks = getChunks(data);
			const refChunkBoundaries = getChunkBoundaries(refChunks);

			// Test with different block sizes
			for (const addSize of [1, 37, 255]) {
				const chunker = createChunker();
				const altChunks: Array<{ length: number; hash: Uint8Array }> = [];

				let pos = 0;
				while (pos < data.length) {
					const nextPos = Math.min(pos + addSize, data.length);
					const nextChunk = nextBlock(chunker, data.subarray(pos, nextPos));
					altChunks.push(...nextChunk);
					pos = nextPos;
				}

				// Finalize to get any remaining chunk
				const finalChunk = finalize(chunker);
				if (finalChunk) {
					altChunks.push(finalChunk);
				}

				const altBoundaries = getChunkBoundaries(altChunks);
				expect(altBoundaries).toEqual(refChunkBoundaries);
			}
		});
	});

	describe("Triggering data test", () => {
		it("should handle triggering data patterns correctly", () => {
			// Create a pattern that triggers boundary detection
			// This is a simplified version of the Rust test
			function get_triggering_base_data(n: number, padding: number) {
				const pattern = new Uint8Array([
					154, 52, 42, 34, 159, 75, 126, 224, 70, 236, 12, 196, 79, 236, 178, 124, 127, 50, 99, 178, 44, 176, 174, 126,
					250, 235, 205, 174, 252, 122, 35, 10, 20, 101, 214, 69, 193, 8, 115, 105, 158, 228, 120, 111, 136, 162, 198,
					251, 211, 183, 253, 252, 164, 147, 63, 16, 186, 162, 117, 23, 170, 36, 205, 187, 174, 76, 210, 174, 211, 175,
					12, 173, 145, 59, 2, 70, 222, 181, 159, 227, 182, 156, 189, 51, 226, 106, 24, 50, 183, 157, 140, 10, 8, 23,
					212, 70, 10, 234, 23, 33, 219, 254, 39, 236, 70, 49, 191, 116, 9, 115, 15, 101, 26, 159, 165, 220, 15, 170,
					56, 125, 92, 163, 94, 235, 38, 40, 49, 81,
				]);

				// Create 64KB of data by repeating the pattern
				const data = new Uint8Array(n);

				for (let i = 0; i < n; i += pattern.length + padding) {
					data.set(pattern.slice(0, Math.min(pattern.length, n - i)), i);
				}

				return data;
			}

			const data_sample_at_11111 = new Uint8Array(128);
			const ref_cb = new Array(128);

			data_sample_at_11111[0] = 236;
			ref_cb[0] = [8256, 16448, 24640, 32832, 41024, 49216, 57408, 65536];
			data_sample_at_11111[1] = 50;
			ref_cb[1] = [8191, 16447, 24703, 32959, 41215, 49471, 57727, 65536];
			data_sample_at_11111[2] = 36;
			ref_cb[2] = [8254, 16574, 24894, 33214, 41534, 49854, 58174, 65536];
			data_sample_at_11111[3] = 116;
			ref_cb[3] = [8317, 16570, 24823, 33076, 41329, 49582, 57835, 65536];
			data_sample_at_11111[4] = 126;
			ref_cb[4] = [8248, 16564, 24880, 33196, 41512, 49828, 58144, 65536];
			data_sample_at_11111[5] = 145;
			ref_cb[5] = [8310, 16556, 24802, 33048, 41294, 49540, 57786, 65536];
			data_sample_at_11111[6] = 235;
			ref_cb[6] = [8238, 16546, 24854, 33162, 41470, 49778, 58086, 65536];
			data_sample_at_11111[7] = 228;
			ref_cb[7] = [8299, 16534, 24769, 33004, 41239, 49474, 57709, 65536];
			data_sample_at_11111[8] = 70;
			ref_cb[8] = [8224, 16520, 24816, 33112, 41408, 49704, 58000, 65536];
			data_sample_at_11111[9] = 178;
			ref_cb[9] = [8284, 16504, 24724, 32944, 41164, 49384, 57604, 65536];
			data_sample_at_11111[10] = 173;
			ref_cb[10] = [8206, 16486, 24766, 33046, 41326, 49606, 57886, 65536];
			data_sample_at_11111[11] = 0;
			ref_cb[11] = [8265, 16466, 24667, 32868, 41069, 49270, 57471, 65536];
			data_sample_at_11111[12] = 252;
			ref_cb[12] = [8324, 16452, 24704, 32832, 41084, 49212, 57464, 65536];
			data_sample_at_11111[13] = 159;
			ref_cb[13] = [8242, 16561, 24880, 33199, 41518, 49837, 58156, 65536];
			data_sample_at_11111[14] = 69;
			ref_cb[14] = [8300, 16536, 24772, 33008, 41244, 49480, 57716, 65536];
			data_sample_at_11111[15] = 219;
			ref_cb[15] = [8215, 16509, 24803, 33097, 41391, 49685, 57979, 65536];
			data_sample_at_11111[16] = 126;
			ref_cb[16] = [8272, 16480, 24688, 32896, 41104, 49312, 57520, 65536];
			data_sample_at_11111[17] = 10;
			ref_cb[17] = [8329, 16457, 24714, 32842, 41099, 49227, 57484, 65536];
			data_sample_at_11111[18] = 124;
			ref_cb[18] = [8240, 16562, 24884, 33206, 41528, 49850, 58172, 65536];
			data_sample_at_11111[19] = 24;
			ref_cb[19] = [8296, 16528, 24760, 32992, 41224, 49456, 57688, 65536];
			data_sample_at_11111[20] = 196;
			ref_cb[20] = [8204, 16492, 24780, 33068, 41356, 49644, 57932, 65536];
			data_sample_at_11111[21] = 106;
			ref_cb[21] = [8259, 16454, 24649, 32844, 41039, 49234, 57429, 65536];
			data_sample_at_11111[22] = 196;
			ref_cb[22] = [8314, 16564, 24814, 33064, 41314, 49564, 57814, 65536];
			data_sample_at_11111[23] = 183;
			ref_cb[23] = [8218, 16523, 24828, 33133, 41438, 49743, 58048, 65536];
			data_sample_at_11111[24] = 124;
			ref_cb[24] = [8128, 16328, 24536, 32744, 40952, 49160, 57368, 65536];
			data_sample_at_11111[25] = 70;
			ref_cb[25] = [8326, 16588, 24850, 33112, 41374, 49636, 57898, 65536];
			data_sample_at_11111[26] = 126;
			ref_cb[26] = [8226, 16542, 24858, 33174, 41490, 49806, 58122, 65536];
			data_sample_at_11111[27] = 191;
			ref_cb[27] = [8279, 16494, 24709, 32924, 41139, 49354, 57569, 65536];
			data_sample_at_11111[28] = 69;
			ref_cb[28] = [8332, 16600, 24868, 33136, 41404, 49672, 57940, 65536];
			data_sample_at_11111[29] = 163;
			ref_cb[29] = [8128, 16392, 24713, 33034, 41355, 49676, 57997, 65536];
			data_sample_at_11111[30] = 252;
			ref_cb[30] = [8280, 16496, 24712, 32928, 41144, 49360, 57576, 65536];
			data_sample_at_11111[31] = 0;
			ref_cb[31] = [8332, 16600, 24868, 33136, 41404, 49672, 57940, 65536];
			data_sample_at_11111[32] = 173;
			ref_cb[32] = [8224, 16544, 24864, 33184, 41504, 49824, 58144, 65536];
			data_sample_at_11111[33] = 42;
			ref_cb[33] = [8275, 16486, 24697, 32908, 41119, 49330, 57541, 65536];
			data_sample_at_11111[34] = 70;
			ref_cb[34] = [8326, 16588, 24850, 33112, 41374, 49636, 57898, 65536];
			data_sample_at_11111[35] = 174;
			ref_cb[35] = [8214, 16527, 24840, 33153, 41466, 49779, 58092, 65536];
			data_sample_at_11111[36] = 235;
			ref_cb[36] = [8264, 16464, 24664, 32864, 41064, 49264, 57464, 65536];
			data_sample_at_11111[37] = 186;
			ref_cb[37] = [8314, 16564, 24814, 33064, 41314, 49564, 57814, 65536];
			data_sample_at_11111[38] = 0;
			ref_cb[38] = [8198, 16498, 24798, 33098, 41398, 49698, 57998, 65536];
			data_sample_at_11111[39] = 157;
			ref_cb[39] = [8247, 16597, 24947, 33297, 41647, 49997, 58347, 65536];
			data_sample_at_11111[40] = 126;
			ref_cb[40] = [8296, 16528, 24760, 32992, 41224, 49456, 57688, 65536];
			data_sample_at_11111[41] = 49;
			ref_cb[41] = [8345, 16626, 24907, 33188, 41469, 49750, 58031, 65536];
			data_sample_at_11111[42] = 36;
			ref_cb[42] = [8224, 16554, 24884, 33214, 41544, 49874, 58204, 65536];
			data_sample_at_11111[43] = 0;
			ref_cb[43] = [8272, 16480, 24688, 32896, 41104, 49312, 57520, 65536];
			data_sample_at_11111[44] = 236;
			ref_cb[44] = [8320, 16576, 24832, 33088, 41344, 49600, 57856, 65536];
			data_sample_at_11111[45] = 105;
			ref_cb[45] = [8195, 16499, 24803, 33107, 41411, 49715, 58019, 65536];
			data_sample_at_11111[46] = 0;
			ref_cb[46] = [8242, 16594, 24946, 33298, 41650, 50002, 58354, 65536];
			data_sample_at_11111[47] = 24;
			ref_cb[47] = [8289, 16514, 24739, 32964, 41189, 49414, 57639, 65536];
			data_sample_at_11111[48] = 126;
			ref_cb[48] = [8336, 16608, 24880, 33152, 41424, 49696, 57968, 65536];
			data_sample_at_11111[49] = 0;
			ref_cb[49] = [8206, 16525, 24844, 33163, 41482, 49801, 58120, 65536];
			data_sample_at_11111[50] = 70;
			ref_cb[50] = [8252, 16618, 24984, 33350, 41716, 50082, 58448, 65536];
			data_sample_at_11111[51] = 236;
			ref_cb[51] = [8298, 16532, 24766, 33000, 41234, 49468, 57702, 65536];
			data_sample_at_11111[52] = 0;
			ref_cb[52] = [8344, 16624, 24904, 33184, 41464, 49744, 58024, 65536];
			data_sample_at_11111[53] = 12;
			ref_cb[53] = [8209, 16337, 24680, 32808, 41151, 49279, 57622, 65536];
			data_sample_at_11111[54] = 236;
			ref_cb[54] = [8254, 16626, 24998, 33370, 41742, 50114, 58486, 65536];
			data_sample_at_11111[55] = 0;
			ref_cb[55] = [8299, 16534, 24769, 33004, 41239, 49474, 57709, 65536];
			data_sample_at_11111[56] = 173;
			ref_cb[56] = [8344, 16624, 24904, 33184, 41464, 49744, 58024, 65536];
			data_sample_at_11111[57] = 196;
			ref_cb[57] = [8204, 16529, 24854, 33179, 41504, 49829, 58154, 65536];
			data_sample_at_11111[58] = 0;
			ref_cb[58] = [8248, 16618, 24988, 33358, 41728, 50098, 58468, 65536];
			data_sample_at_11111[59] = 159;
			ref_cb[59] = [8292, 16520, 24748, 32976, 41204, 49432, 57660, 65536];
			data_sample_at_11111[60] = 178;
			ref_cb[60] = [8336, 16608, 24880, 33152, 41424, 49696, 57968, 65536];
			data_sample_at_11111[61] = 0;
			ref_cb[61] = [8191, 16507, 24823, 33139, 41455, 49771, 58087, 65536];
			data_sample_at_11111[62] = 10;
			ref_cb[62] = [8234, 16594, 24954, 33314, 41674, 50034, 58394, 65536];
			data_sample_at_11111[63] = 101;
			ref_cb[63] = [8277, 16490, 24703, 32916, 41129, 49342, 57555, 65536];
			data_sample_at_11111[64] = 0;
			ref_cb[64] = [8320, 16576, 24832, 33088, 41344, 49600, 57856, 65536];
			data_sample_at_11111[65] = 15;
			ref_cb[65] = [8363, 16662, 24961, 33260, 41559, 49858, 58157, 65536];
			data_sample_at_11111[66] = 147;
			ref_cb[66] = [8212, 16554, 24896, 33238, 41580, 49922, 58264, 65536];
			data_sample_at_11111[67] = 0;
			ref_cb[67] = [8254, 16639, 25024, 33409, 41794, 50179, 58564, 65536];
			data_sample_at_11111[68] = 0;
			ref_cb[68] = [8296, 16528, 24760, 32992, 41224, 49456, 57688, 65536];
			data_sample_at_11111[69] = 227;
			ref_cb[69] = [8338, 16612, 24886, 33160, 41434, 49708, 57982, 65536];
			data_sample_at_11111[70] = 126;
			ref_cb[70] = [8380, 16696, 25012, 33328, 41644, 49960, 58276, 65536];
			data_sample_at_11111[71] = 0;
			ref_cb[71] = [8223, 16581, 24939, 33297, 41655, 50013, 58371, 65536];
			data_sample_at_11111[72] = 101;
			ref_cb[72] = [8264, 16464, 24664, 32864, 41064, 49264, 57464, 65536];
			data_sample_at_11111[73] = 186;
			ref_cb[73] = [8305, 16546, 24787, 33028, 41269, 49510, 57751, 65536];
			data_sample_at_11111[74] = 52;
			ref_cb[74] = [8346, 16628, 24910, 33192, 41474, 49756, 58038, 65536];
			data_sample_at_11111[75] = 0;
			ref_cb[75] = [8387, 16515, 24830, 32958, 41273, 49401, 57716, 65536];
			data_sample_at_11111[76] = 70;
			ref_cb[76] = [8224, 16588, 24952, 33316, 41680, 50044, 58408, 65536];
			data_sample_at_11111[77] = 228;
			ref_cb[77] = [8264, 16464, 24664, 32864, 41064, 49264, 57464, 65536];
			data_sample_at_11111[78] = 0;
			ref_cb[78] = [8128, 16338, 24578, 32818, 41058, 49298, 57538, 65536];
			data_sample_at_11111[79] = 0;
			ref_cb[79] = [8344, 16624, 24904, 33184, 41464, 49744, 58024, 65536];
			data_sample_at_11111[80] = 50;
			ref_cb[80] = [8384, 16704, 25024, 33344, 41664, 49984, 58304, 65536];
			data_sample_at_11111[81] = 214;
			ref_cb[81] = [8215, 16575, 24935, 33295, 41655, 50015, 58375, 65536];
			data_sample_at_11111[82] = 0;
			ref_cb[82] = [8254, 16654, 25054, 33454, 41854, 50254, 58654, 65536];
			data_sample_at_11111[83] = 0;
			ref_cb[83] = [8293, 16522, 24751, 32980, 41209, 49438, 57667, 65536];
			data_sample_at_11111[84] = 50;
			ref_cb[84] = [8128, 16388, 24656, 32924, 41192, 49460, 57728, 65536];
			data_sample_at_11111[85] = 69;
			ref_cb[85] = [8371, 16678, 24985, 33292, 41599, 49906, 58213, 65536];
			data_sample_at_11111[86] = 0;
			ref_cb[86] = [8196, 16324, 24674, 32802, 41152, 49280, 57630, 65536];
			data_sample_at_11111[87] = 0;
			ref_cb[87] = [8234, 16619, 25004, 33389, 41774, 50159, 58544, 65536];
			data_sample_at_11111[88] = 70;
			ref_cb[88] = [8272, 16480, 24688, 32896, 41104, 49312, 57520, 65536];
			data_sample_at_11111[89] = 136;
			ref_cb[89] = [8128, 16339, 24585, 32831, 41077, 49323, 57569, 65536];
			data_sample_at_11111[90] = 0;
			ref_cb[90] = [8348, 16632, 24916, 33200, 41484, 49768, 58052, 65536];
			data_sample_at_11111[91] = 0;
			ref_cb[91] = [8386, 16708, 25030, 33352, 41674, 49996, 58318, 65536];
			data_sample_at_11111[92] = 101;
			ref_cb[92] = [8204, 16564, 24924, 33284, 41644, 50004, 58364, 65536];
			data_sample_at_11111[93] = 36;
			ref_cb[93] = [8241, 16639, 25037, 33435, 41833, 50231, 58629, 65536];
			data_sample_at_11111[94] = 196;
			ref_cb[94] = [8278, 16492, 24706, 32920, 41134, 49348, 57562, 65536];
			data_sample_at_11111[95] = 0;
			ref_cb[95] = [8315, 16566, 24817, 33068, 41319, 49570, 57821, 65536];
			data_sample_at_11111[96] = 0;
			ref_cb[96] = [8352, 16640, 24928, 33216, 41504, 49792, 58080, 65536];
			data_sample_at_11111[97] = 24;
			ref_cb[97] = [8389, 16714, 25039, 33364, 41689, 50014, 58339, 65536];
			data_sample_at_11111[98] = 8;
			ref_cb[98] = [8200, 16562, 24924, 33286, 41648, 50010, 58372, 65536];
			data_sample_at_11111[99] = 0;
			ref_cb[99] = [8236, 16635, 25034, 33433, 41832, 50231, 58630, 65536];
			data_sample_at_11111[100] = 0;
			ref_cb[100] = [8272, 16480, 24688, 32896, 41104, 49312, 57520, 65536];
			data_sample_at_11111[101] = 125;
			ref_cb[101] = [8308, 16552, 24796, 33040, 41284, 49528, 57772, 65536];
			data_sample_at_11111[102] = 173;
			ref_cb[102] = [8344, 16624, 24904, 33184, 41464, 49744, 58024, 65536];
			data_sample_at_11111[103] = 126;
			ref_cb[103] = [8380, 16696, 25012, 33328, 41644, 49960, 58276, 65536];
			data_sample_at_11111[104] = 0;
			ref_cb[104] = [8416, 16544, 24888, 33016, 41360, 49488, 57832, 65536];
			data_sample_at_11111[105] = 0;
			ref_cb[105] = [8219, 16607, 24995, 33383, 41771, 50159, 58547, 65536];
			data_sample_at_11111[106] = 159;
			ref_cb[106] = [8254, 16678, 25102, 33526, 41950, 50374, 58798, 65536];
			data_sample_at_11111[107] = 210;
			ref_cb[107] = [8289, 16514, 24739, 32964, 41189, 49414, 57639, 65536];
			data_sample_at_11111[108] = 178;
			ref_cb[108] = [8324, 16584, 24844, 33104, 41364, 49624, 57884, 65536];
			data_sample_at_11111[109] = 0;
			ref_cb[109] = [8359, 16654, 24949, 33244, 41539, 49834, 58129, 65536];
			data_sample_at_11111[110] = 0;
			ref_cb[110] = [8394, 16724, 25054, 33384, 41714, 50044, 58374, 65536];
			data_sample_at_11111[111] = 170;
			ref_cb[111] = [8429, 16794, 25159, 33524, 41889, 50254, 58619, 65536];
			data_sample_at_11111[112] = 173;
			ref_cb[112] = [8224, 16624, 25024, 33424, 41824, 50224, 58624, 65536];
			data_sample_at_11111[113] = 235;
			ref_cb[113] = [8258, 16452, 24646, 32840, 41034, 49228, 57422, 65536];
			data_sample_at_11111[114] = 0;
			ref_cb[114] = [8292, 16520, 24748, 32976, 41204, 49432, 57660, 65536];
			data_sample_at_11111[115] = 0;
			ref_cb[115] = [8326, 16588, 24850, 33112, 41374, 49636, 57898, 65536];
			data_sample_at_11111[116] = 0;
			ref_cb[116] = [8360, 16656, 24952, 33248, 41544, 49840, 58136, 65536];
			data_sample_at_11111[117] = 24;
			ref_cb[117] = [8394, 16724, 25054, 33384, 41714, 50044, 58374, 65536];
			data_sample_at_11111[118] = 228;
			ref_cb[118] = [8428, 16792, 25156, 33520, 41884, 50248, 58612, 65536];
			data_sample_at_11111[119] = 0;
			ref_cb[119] = [8215, 16613, 25011, 33409, 41807, 50205, 58603, 65536];
			data_sample_at_11111[120] = 0;
			ref_cb[120] = [8248, 16680, 25112, 33544, 41976, 50408, 58840, 65536];
			data_sample_at_11111[121] = 0;
			ref_cb[121] = [8281, 16498, 24715, 32932, 41149, 49366, 57583, 65536];
			data_sample_at_11111[122] = 101;
			ref_cb[122] = [8314, 16564, 24814, 33064, 41314, 49564, 57814, 65536];
			data_sample_at_11111[123] = 174;
			ref_cb[123] = [8347, 16630, 24913, 33196, 41479, 49762, 58045, 65536];
			data_sample_at_11111[124] = 126;
			ref_cb[124] = [8380, 16696, 25012, 33328, 41644, 49960, 58276, 65536];
			data_sample_at_11111[125] = 0;
			ref_cb[125] = [8413, 16762, 25111, 33460, 41809, 50158, 58507, 65536];
			data_sample_at_11111[126] = 0;
			ref_cb[126] = [8192, 16574, 24956, 33338, 41720, 50102, 58484, 65536];
			data_sample_at_11111[127] = 0;
			ref_cb[127] = [8224, 16639, 25054, 33469, 41884, 50299, 58714, 65536];

			// Now run the loop with this reference data.

			for (let i = 0; i < 128; i++) {
				console.log(`Running test case ${i}`);
				const data = get_triggering_base_data(65536, i);

				expect(data[11111]).toBe(data_sample_at_11111[i]);

				const chunks = getChunks(data);
				const chunkBoundaries = getChunkBoundaries(chunks);

				expect(chunkBoundaries).toEqual(ref_cb[i]);
			}
		});
	});

	describe("Basic chunker functionality", () => {
		it("should create and use chunker correctly", () => {
			// Create a small test data
			const data = new Uint8Array(100000);
			for (let i = 0; i < data.length; i++) {
				data[i] = Math.floor(Math.random() * 256);
			}

			// Test chunker creation and usage
			const chunker = createChunker();
			const chunks = nextBlock(chunker, data);
			const finalChunk = finalize(chunker);

			// Verify chunks have the expected structure
			for (const chunk of chunks) {
				expect(typeof chunk.length).toBe("number");
				expect(typeof chunk.hash).toBe("object");
				expect(chunk.hash instanceof Uint8Array).toBe(true);
			}

			if (finalChunk) {
				expect(typeof finalChunk.length).toBe("number");
				expect(typeof finalChunk.hash).toBe("object");
				expect(finalChunk.hash instanceof Uint8Array).toBe(true);
			}
		});
	});
});
