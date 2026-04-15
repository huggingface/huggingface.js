import { describe, it, expect } from "vitest";
import { Hasher } from "../src/index.js";

// Deterministic 24-bit RNG (matches gearhash-wasm test suite)
class SimpleRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed & 0xffffff;
  }
  nextU24(): number {
    this.state = (this.state * 1111 + 12345) & 0xffffff;
    return this.state;
  }
  fillBytes(dest: Uint8Array): void {
    for (let i = 0; i < dest.length; i += 3) {
      const v = this.nextU24();
      for (let j = 0; j < 3 && i + j < dest.length; j++) {
        dest[i + j] = (v >> (j * 8)) & 0xff;
      }
    }
  }
}

const BENCH_INPUT_SEED = 0xbecd17f;
const BENCH_MASK = 0x0000d90003530000n;
const INPUT_SIZE = 100_000;

function generateTestInput(): Uint8Array {
  const bytes = new Uint8Array(INPUT_SIZE);
  new SimpleRng(BENCH_INPUT_SEED).fillBytes(bytes);
  return bytes;
}

// Expected results from the Rust gearhash implementation (same vectors
// used by @huggingface/gearhash-wasm tests)
const EXPECTED: { offset: number; size: number; hash: string }[] = [
  { offset: 0, size: 3598, hash: "0x033220f080ac5f77" },
  { offset: 3598, size: 3995, hash: "0xd06b22f324ac5f28" },
  { offset: 7593, size: 4708, hash: "0xa3a324f81808429c" },
  { offset: 12301, size: 484, hash: "0x12a5006aa4a4425b" },
  { offset: 12785, size: 1484, hash: "0x0b240413a4a4d5a2" },
  { offset: 14269, size: 563, hash: "0xc646022fbc848bc6" },
  { offset: 14832, size: 6663, hash: "0x7c7a2296e4a4c325" },
  { offset: 21495, size: 1220, hash: "0xbe1f2468f0841b68" },
  { offset: 22715, size: 1175, hash: "0xf87e2299e00c57d9" },
  { offset: 23890, size: 779, hash: "0x79ca2634d00cd6b9" },
  { offset: 24669, size: 2069, hash: "0xcb7a063594081a74" },
  { offset: 26738, size: 2623, hash: "0xdccc26b6c0acb733" },
  { offset: 29361, size: 596, hash: "0x4fb6201a1c20143e" },
  { offset: 29957, size: 622, hash: "0x81e726272020706f" },
  { offset: 30579, size: 3834, hash: "0x630622fca084a60a" },
  { offset: 34413, size: 2379, hash: "0x177b2240080810b1" },
  { offset: 36792, size: 3527, hash: "0x663b261bbc2451ed" },
  { offset: 40319, size: 1665, hash: "0xf94f06db94003e2f" },
  { offset: 41984, size: 1240, hash: "0xc5ca208c0c24cefc" },
  { offset: 43224, size: 1274, hash: "0x8139244f740cba39" },
  { offset: 44498, size: 3680, hash: "0x4440044520045a9d" },
  { offset: 48178, size: 1487, hash: "0xe00f2049a0a43a58" },
  { offset: 49665, size: 4293, hash: "0x366a26940408279d" },
  { offset: 53958, size: 1184, hash: "0x3a582683902cb3fe" },
  { offset: 55142, size: 383, hash: "0x002d0499e080702e" },
  { offset: 55525, size: 1206, hash: "0x34ba041aa4084fbd" },
  { offset: 56731, size: 506, hash: "0x0c53045c00a0a228" },
  { offset: 57237, size: 8019, hash: "0xf85b202d9c0813a5" },
  { offset: 65256, size: 1070, hash: "0x1c862295ac8863ba" },
  { offset: 66326, size: 3359, hash: "0x4e4804d7b82805c7" },
  { offset: 69685, size: 1744, hash: "0x75b7224cc8209457" },
  { offset: 71429, size: 152, hash: "0xb01e26b40c0cf7c0" },
  { offset: 71581, size: 11, hash: "0xc66002b7f48c0472" },
  { offset: 71592, size: 1209, hash: "0x0a33021dc4007363" },
  { offset: 72801, size: 1795, hash: "0xd0cc22ea708c921f" },
  { offset: 74596, size: 856, hash: "0x49e3007c9c2c5727" },
  { offset: 75452, size: 97, hash: "0xe0b422e3c40c89dc" },
  { offset: 75549, size: 1299, hash: "0xbd1806074024536a" },
  { offset: 76848, size: 131, hash: "0xd61104147c28928d" },
  { offset: 76979, size: 1987, hash: "0x31930627a080ebb0" },
  { offset: 78966, size: 11254, hash: "0x4c4400e65c24beff" },
  { offset: 90220, size: 868, hash: "0xa92400ca5ca02488" },
  { offset: 91088, size: 6279, hash: "0x5a3d0443f0a0d81a" },
  { offset: 97367, size: 969, hash: "0x7770042d140c7472" },
  { offset: 98336, size: 1664, hash: "0xe508202f55c46d2d" },
];

function hexHash(hashState: Uint8Array): string {
  const dv = new DataView(hashState.buffer, hashState.byteOffset, 8);
  return "0x" + dv.getBigUint64(0, true).toString(16).padStart(16, "0");
}

describe("gearhash-jit", () => {
  it("should match Rust reference for all 45 chunks", () => {
    const input = generateTestInput();
    const hasher = new Hasher(BENCH_MASK);

    let offset = 0;
    const actual: { offset: number; size: number; hash: string }[] = [];

    while (offset < input.length) {
      const pos = hasher.nextMatch(input.subarray(offset));
      if (pos === -1) break;
      actual.push({
        offset,
        size: pos,
        hash: hexHash(hasher.hash),
      });
      offset += pos;
      hasher.resetHash();
    }

    // The last "chunk" is the tail after the final match
    if (offset < input.length) {
      actual.push({
        offset,
        size: input.length - offset,
        hash: hexHash(hasher.hash),
      });
    }

    expect(actual.length).toBe(EXPECTED.length);
    for (let i = 0; i < EXPECTED.length; i++) {
      expect(actual[i].offset).toBe(EXPECTED[i].offset);
      expect(actual[i].size).toBe(EXPECTED[i].size);
      if (i < EXPECTED.length - 1) {
        // Hash is meaningful only at match boundaries, not for the tail
        expect(actual[i].hash).toBe(EXPECTED[i].hash);
      }
    }
  });

  it("should handle empty input", () => {
    const hasher = new Hasher(BENCH_MASK);
    expect(hasher.nextMatch(new Uint8Array(0))).toBe(-1);
  });

  it("should handle small input with no match", () => {
    const hasher = new Hasher(BENCH_MASK);
    const pos = hasher.nextMatch(new Uint8Array([1, 2, 3, 4, 5]));
    expect(pos).toBe(-1);
  });

  it("should carry hash state across calls", () => {
    const input = generateTestInput();
    const hasher = new Hasher(BENCH_MASK);

    // Scan in one shot
    const pos1 = hasher.nextMatch(input);

    // Scan in two halves
    const hasher2 = new Hasher(BENCH_MASK);
    const half = Math.floor(input.length / 2);
    const p2a = hasher2.nextMatch(input.subarray(0, half));

    if (p2a === -1) {
      // No match in first half — continue into second half
      const p2b = hasher2.nextMatch(input.subarray(half));
      // Match should be at half + p2b
      expect(half + p2b).toBe(pos1);
    } else {
      expect(p2a).toBe(pos1);
    }
  });

  it("should reset hash correctly", () => {
    const hasher = new Hasher(BENCH_MASK);
    hasher.nextMatch(new Uint8Array([1, 2, 3]));
    hasher.resetHash();

    const hasher2 = new Hasher(BENCH_MASK);
    // After reset, both hashers should behave identically
    const buf = new Uint8Array([10, 20, 30, 40, 50]);
    expect(hasher.nextMatch(buf)).toBe(hasher2.nextMatch(buf));
  });
});
