JS and WASM implementations of https://github.com/BLAKE3-team/BLAKE3

Using [AssemblyScript](https://www.assemblyscript.org/) to generate a lean WASM.

## Usage

```javascript
import { blake3, blake3Hex, createHasher, update, finalize } from '@huggingface/gearhash-wasm';

// Create a Uint8Array of data to search through
const data = new Uint8Array(1_000_000); // Example: 1MB of data
// ... fill data with your content ...

const hashUint8 = blake3(data);
const hashHex = blake3Hex(data);

// Or streaming fashion
const hasher = createHasher();

for (const chunk of dataSource) {
  hasher.update(chunk);
}

const hash = hasher.finalize();
```