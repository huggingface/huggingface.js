JS and WASM implementations of splitmix-64

Using [AssemblyScript](https://www.assemblyscript.org/) to generate a lean WASM.

The use of WASM is more for 64 bit arithmetic than for performance.

Used internally to reproduce rust tests

Let us know if you want us to expose more functions.

## Usage

```javascript
import { createRandomArray } from '@huggingface/splitmix64-wasm';

// Create an ArrayBuffer of data, with u64s converted to le u8s
const data = new createRandomArray(256_000, 1); // Example: 256kB of data
```