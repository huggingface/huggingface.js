// #[test]
// fn test_correctness_1mb_random_data() {
//     // Test this data.
//     let data = create_random_data(1000000, 0);

//     // Uncomment these to create the lines below:
//     // eprintln!("(data[0], {});", data[0] as usize);
//     // eprintln!("(data[127], {});", data[127] as usize);
//     // eprintln!("(data[111111], {});", data[111111] as usize);

//     assert_eq!(data[0], 175);
//     assert_eq!(data[127], 132);
//     assert_eq!(data[111111], 118);

// }

import assert from "assert";
import { createRandomArray } from "../build/debug.js";

const data = createRandomArray(1000000, 0);
const array = new Uint8Array(data);

console.log(array[0]);
console.log(array[127]);
console.log(array[111111]);

assert.strictEqual(array[0], 175);
assert.strictEqual(array[127], 132);
assert.strictEqual(array[111111], 118);
