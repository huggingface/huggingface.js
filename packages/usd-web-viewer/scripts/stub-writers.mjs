// Replaces the bodies of openusd's layer writers (FileFormat::write and
// ::write_bytes for usda, usdc and usdz) with `unreachable`, so wasm-opt drops
// the writers and the zip encoder behind them. They sit in the function table
// through the format vtables, and wasm-opt keeps a table function whenever any
// indirect call shares its signature. Nothing here saves or exports a layer.
// Runs on cargo's output, which keeps the function names section to match by.
// The output drops every custom section but wasm-bindgen's, as `strip = true`
// does, so wasm-bindgen keeps its ABI: it switches to externref when
// target_features lists reference-types.
// usage: node scripts/stub-writers.mjs <in.wasm> <out.wasm>
import fs from "node:fs";
import binaryen from "binaryen";

// Mangled `<openusd::… as openusd::sdf::file_format::FileFormat>::write{,_bytes}`
// and the trait's default `openusd::sdf::file_format::FileFormat::write_bytes`.
const WRITER =
	/(openusd\.\.sdf\.\.file_format\.\.FileFormat\$GT\$|7openusd3sdf11file_format10FileFormat)(5write|11write_bytes)17h[0-9a-f]{16}E$/;

const [input, output] = process.argv.slice(2);
binaryen.setDebugInfo(true);
const mod = binaryen.readBinary(fs.readFileSync(input));
mod.setFeatures(
	binaryen.Features.MVP |
		binaryen.Features.BulkMemory |
		binaryen.Features.NontrappingFPToInt |
		binaryen.Features.SignExt |
		binaryen.Features.MutableGlobals |
		binaryen.Features.ReferenceTypes |
		binaryen.Features.Multivalue,
);

let stubbed = 0;
for (let i = 0; i < mod.getNumFunctions(); i++) {
	const func = mod.getFunctionByIndex(i);
	const { name, body } = binaryen.getFunctionInfo(func);
	if (!body || !WRITER.test(name)) continue;
	binaryen._BinaryenFunctionSetBody(func, mod.unreachable());
	stubbed++;
}
// The names changed or the section is gone: fail rather than ship the writers.
if (!stubbed) throw new Error(`no openusd layer writers found in ${input}; is the names section stripped?`);

fs.writeFileSync(output, withoutCustomSections(mod.emitBinary(), ["__wasm_bindgen_unstable"]));
mod.dispose();
console.log(`stubbed ${stubbed} layer writers`);

/** `wasm` without the custom sections not named in `keep`. */
function withoutCustomSections(wasm, keep) {
	const parts = [wasm.subarray(0, 8)];
	let pos = 8;
	const leb = () => {
		let value = 0;
		let shift = 0;
		let byte;
		do {
			byte = wasm[pos++];
			value += (byte & 0x7f) * 2 ** shift;
			shift += 7;
		} while (byte & 0x80);
		return value;
	};
	while (pos < wasm.length) {
		const start = pos;
		const id = wasm[pos++];
		const end = leb() + pos;
		const nameLength = id === 0 ? leb() : 0;
		if (id !== 0 || keep.includes(Buffer.from(wasm.subarray(pos, pos + nameLength)).toString())) {
			parts.push(wasm.subarray(start, end));
		}
		pos = end;
	}
	return Buffer.concat(parts);
}
