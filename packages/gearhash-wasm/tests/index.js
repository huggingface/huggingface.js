import assert from "assert";
import { nextMatch } from "../build/debug.js";
assert.strictEqual(nextMatch(new Uint8Array([1, 2, 3]), 0xaf2900n), 3);
console.log("ok");
