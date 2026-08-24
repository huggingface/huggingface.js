import { Hasher } from "../dist/esm/index.js";

const MASK = 0x0000d90003530000n;
const BYTES = 100_000_000;
const data = new Uint8Array(BYTES);
for (let i = 0; i < BYTES; i++) data[i] = (i * 1111 + 12345) & 0xff;

function bench(label, iterations) {
  const hasher = new Hasher(MASK);

  // Warmup
  for (let i = 0; i < 3; i++) {
    let off = 0;
    while (off < data.length) {
      const pos = hasher.nextMatch(data.subarray(off));
      if (pos === -1) break;
      off += pos;
      hasher.resetHash();
    }
  }

  const start = performance.now();
  let totalChunks = 0;

  for (let iter = 0; iter < iterations; iter++) {
    hasher.resetHash();
    let off = 0;
    while (off < data.length) {
      const pos = hasher.nextMatch(data.subarray(off));
      if (pos === -1) break;
      off += pos;
      totalChunks++;
      hasher.resetHash();
    }
  }

  const elapsed = performance.now() - start;
  const totalMB = (BYTES * iterations) / 1_000_000;
  console.log(
    `${label}: ${totalMB.toFixed(0)} MB in ${elapsed.toFixed(1)}ms → ${(totalMB / (elapsed / 1000)).toFixed(1)} MB/s (${totalChunks} chunks)`
  );
}

bench("Pure JS split-u32 gearhash", 5);
