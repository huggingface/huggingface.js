# BLAKE3 Performance Benchmark

This benchmark measures the throughput (MB/s) of the BLAKE3 hashing implementation when processing random data of various sizes.

## Features

- **Multiple data sizes**: Tests from 1 KB to 100 MB
- **Three hashing methods**:
  - **Single-shot**: Direct `blake3(data)` calls
  - **Streaming**: Using `createHasher()` with single update
  - **Chunked**: Simulating large file processing with 64KB chunks
- **Automatic iteration adjustment**: More iterations for smaller data sizes
- **Warm-up runs**: Ensures consistent performance measurements
- **Detailed reporting**: Shows time, throughput, and summary

## Usage

### Run the benchmark:

```bash
pnpm run bench
```

### From Node.js:

```javascript
import { runBenchmark } from "./tests/bench.js";

const results = runBenchmark();
```

### Individual size benchmark:

```javascript
import { benchmarkSize } from "./tests/bench.js";

const result = benchmarkSize(1000 * 1000, 10); // 1MB, 10 iterations
console.log(result);
```

## Output Format

The benchmark provides:

- **Per-size results**: Time and throughput for each data size
- **Summary table**: Comparison across all sizes and methods
- **Best performance**: Highlights the fastest method and size

Example output:

```
🚀 BLAKE3 Performance Benchmark
============================================================

📊 Benchmarking 1.0 KB data (100 iterations, 100.0 KB total)
────────────────────────────────────────────────────────────
🔹 Single-shot: 2.34ms (42.74 MB/s)
🔹 Streaming:  2.45ms (40.82 MB/s)
🔹 Chunked:    2.67ms (37.45 MB/s)

📈 SUMMARY
============================================================
Data Size    | Single-shot | Streaming  | Chunked
────────────────────────────────────────────────────────────
1.0 KB       | 42.74 MB/s | 40.82 MB/s | 37.45 MB/s
64.0 KB      | 156.23 MB/s| 148.91 MB/s| 142.67 MB/s
1.0 MB       | 234.56 MB/s| 228.34 MB/s| 221.89 MB/s
10.0 MB      | 456.78 MB/s| 445.12 MB/s| 438.90 MB/s
100.0 MB     | 567.89 MB/s| 556.23 MB/s| 549.67 MB/s

🏆 BEST PERFORMANCE
────────────────────────────────────────────────────────────
Method: Single-shot
Data Size: 100.0 MB
Throughput: 567.89 MB/s
```

## Throughput Units

The benchmark uses decimal units (power of 1000) for consistency:

- **MB/s**: Megabytes per second (1,000,000 bytes/second)
- **GB/s**: Gigabytes per second (1,000,000,000 bytes/second)

## Data Sizes Tested

- **1 KB**: Small data performance
- **64 KB**: Medium data performance
- **1 MB**: Large data performance
- **10 MB**: Very large data performance
- **100 MB**: Massive data performance

## Iteration Counts

- **Small data** (< 1 MB): 100 iterations for statistical accuracy
- **Medium data** (1-10 MB): 10 iterations for reasonable runtime
- **Large data** (> 10 MB): 3 iterations to avoid excessive runtime

## Notes

- Random data is generated for each test to ensure realistic performance
- Warm-up runs are performed before timing to ensure consistent results
- All measurements use `performance.now()` for high-precision timing
- The benchmark automatically adjusts iterations based on data size
