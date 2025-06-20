# GearHash Test

This directory contains the GearHash library for content-defined chunking.

## Running the Test

To run the test that generates deterministic input and processes it through GearHash:

```bash
cd packages/gearhash-wasm/vendor
cargo run --bin test_gearhash
```

Or if you want to create a binary:

```bash
cargo build --bin test_gearhash
./target/debug/test_gearhash
```

## Test Details

The test:
1. Generates a 1MB deterministic input using a simple xorshift RNG with seed `0xa383d96f7becd17e`
2. Uses mask `0x0000d90003530000` for chunk boundary detection
3. Processes the input through GearHash and reports chunk boundaries
4. Shows chunk sizes, offsets, and hash values for verification

## AssemblyScript Adaptation

The test uses a simple deterministic RNG that can be easily ported to AssemblyScript:

```typescript
class SimpleRng {
    private state: u64;
    
    constructor(seed: u64) {
        this.state = seed;
    }
    
    nextU64(): u64 {
        this.state ^= this.state << 13;
        this.state ^= this.state >> 7;
        this.state ^= this.state << 17;
        return this.state;
    }
    
    fillBytes(dest: Uint8Array): void {
        for (let i = 0; i < dest.length; i += 8) {
            const value = this.nextU64();
            for (let j = 0; j < 8 && i + j < dest.length; j++) {
                dest[i + j] = (value >> (j * 8)) as u8;
            }
        }
    }
}
```

The test results can be used to verify that the AssemblyScript implementation produces the same chunk boundaries.

