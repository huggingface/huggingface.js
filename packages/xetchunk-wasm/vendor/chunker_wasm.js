// export * from "./chunker_wasm_bg.js";
import * as __glue_imports from "./chunker_wasm_bg.js";

const wasmUrl = new URL("./chunker_wasm_bg.wasm", import.meta.url);
const binary = await (await import("node:fs/promises")).readFile(wasmUrl);
// console.log("binary", binary);

const wasmModule = await WebAssembly.compile(binary);
const imports = Object.entries(
	WebAssembly.Module.imports(wasmModule).reduce(
		(result, item) => ({
			...result,
			[item.module]: [...(result[item.module] || []), item.name],
		}),
		{}
	)
).map(([from, names]) => ({ from, names }));

// const exports = WebAssembly.Module.exports(wasmModule).map((item) => item.name);

// console.log("imports", imports);

const wasm = await WebAssembly.instantiate(wasmModule, {
	"./chunker_wasm_bg.js": Object.fromEntries(imports[0].names.map((name) => [name, __glue_imports[name]])),
});
export * from "./chunker_wasm_bg.js";
import { __wbg_set_wasm } from "./chunker_wasm_bg.js";
__wbg_set_wasm(wasm.exports);
// console.log("exports", exports);
wasm.exports.__wbindgen_start();
