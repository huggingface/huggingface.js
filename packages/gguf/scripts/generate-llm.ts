/**
 * Script for generating llm.ts
 * The source data is taken from llama.cpp
 */

import { writeFileSync } from "node:fs";

const SOURCE_CPP_URL = "https://raw.githubusercontent.com/ggerganov/llama.cpp/master/llama.cpp";
const DEST_FILE_PATH = "./src/transformer-llm.ts";
const DEST_COMMON_SOURCE = `
type Attention<TArchitecture extends string> =
	& { [K in \`\${TArchitecture}.attention.head_count\`]: number }
	& { [K in \`\${TArchitecture}.attention.head_count_kv\`]: number }
	& { [K in \`\${TArchitecture}.attention.layer_norm_epsilon\`]: number }
	& { [K in \`\${TArchitecture}.attention.layer_norm_rms_epsilon\`]: number }
	& { [K in \`\${TArchitecture}.attention.alibi_bias_max\`]: number }
	& { [K in \`\${TArchitecture}.attention.clip_kqv\`]: number }
	& { [K in \`\${TArchitecture}.attention.use_norm\`]: number };

type Rope<TArchitecture extends LLMArchitecture> =
	& { [K in \`\${TArchitecture}.rope.dimension_count\`]: number }
	& { [K in \`\${TArchitecture}.rope.freq_base\`]: number }
	& { [K in \`\${TArchitecture}.rope.scale\`]: number }
	& { [K in \`\${TArchitecture}.rope.scale_linear\`]: number };

type MOE<TArchitecture extends LLMArchitecture> =
	& { [K in \`\${TArchitecture}.expert_count\`]: number }
	& { [K in \`\${TArchitecture}.expert_used_count\`]: number };

export type TransformerLLMArchitecture = LLMArchitecture; // type alias
export type TransformerLLMBase<TArchitecture extends LLMArchitecture> = ModelBase<TArchitecture>
	& MOE<TArchitecture>
	& Attention<TArchitecture>
	& Rope<TArchitecture>;
`;

const KV_TYPE = {
	LLM_KV_ATTENTION_LAYERNORM_RMS_EPS: "number",
	LLM_KV_ATTENTION_LAYERNORM_EPS: "number",
	LLM_KV_ATTENTION_CAUSAL: "boolean",
	LLM_KV_TOKENIZER_TOKEN_TYPE_COUNT: "number",
	LLM_KV_POOLING_TYPE: "number", // TODO: this is an enum
	LLM_KV_ATTENTION_CLAMP_KQV: "number",
	LLM_KV_ATTENTION_MAX_ALIBI_BIAS: "number",
	LLM_KV_SSM_CONV_KERNEL: "number",
	LLM_KV_SSM_INNER_SIZE: "number",
	LLM_KV_SSM_STATE_SIZE: "number",
	LLM_KV_SSM_TIME_STEP_RANK: "number",
	LLM_KV_LOGIT_SCALE: "number",
};

interface Arch {
	cppConst: string; // for example: "LLM_ARCH_LLAMA"
	name: string; // for example: "llama"
	tsName: string; // for example: "ArchLlama"
	tensorNames: string[]; // for example: "token_embd"
	hparams: string[];
}

async function main() {
	const res = await fetch(SOURCE_CPP_URL);
	const cppSource = await res.text();

	/////////////////////////////////////
	// extract list of all architectures
	const archList: Arch[] = [];
	const RE_ARCH_NAME = /LLM_ARCH_[A-Z0-9_]+/;
	const matchedArchList = cppSource.match(/LLM_ARCH_NAMES = (?<names>[^;]+)/)?.groups?.names.split("\n") || [];
	if (matchedArchList.length === 0) {
		throw new Error("LLM_ARCH_NAMES is empty");
	}
	for (const line of matchedArchList) {
		const matched = line.match(/(?<cppConst>LLM_ARCH_[A-Z0-9_]+),\s+"(?<name>.+?)"/);
		if (matched && !matched.groups?.name.match(/unknown/)) {
			archList.push({
				cppConst: matched.groups?.cppConst || "",
				name: matched.groups?.name || "",
				tsName: snakeToPascal(matched[1].replace("LLM_", "")),
				tensorNames: [],
				hparams: [],
			});
		}
	}

	/////////////////////////////////////
	// extract map constant name to kv name
	// for example: LLM_KV_ATTENTION_LAYERNORM_RMS_EPS ==> "%s.attention.layer_norm_rms_epsilon"
	const constToKVName: { [cppConst: string]: string } = {};
	const matchedKVList = cppSource.match(/LLM_KV_NAMES = (?<names>[^;]+)/)?.groups?.names.split("\n") || [];
	if (matchedKVList.length === 0) {
		throw new Error("LLM_KV_NAMES is empty");
	}
	for (const line of matchedKVList) {
		const matched = line.match(/(LLM_KV_[A-Z0-9_]+)[,\s]+"([^"]+)"/);
		if (matched) {
			constToKVName[matched[1]] = matched[2];
		}
	}

	/////////////////////////////////////
	// extract list of tensor names based on architecture
	// TODO: unused for now
	const matchedTensorList = cppSource.match(/LLM_TENSOR_NAMES = (?<names>[^;]+)/)?.groups?.names.split("\n") || [];
	if (matchedTensorList.length === 0) {
		throw new Error("LLM_TENSOR_NAMES is empty");
	}
	let currCppConst = "";
	for (const line of matchedTensorList) {
		// check if current line has LLM_ARCH_*
		const cppConst = (line.match(RE_ARCH_NAME) || [])[0];
		if (cppConst) {
			currCppConst = cppConst;
			continue;
		}
		// check if current line has LLM_TENSOR_*
		const tensorMatched = line.match(/LLM_TENSOR_[A-Z0-9_]+[,\s]+"(?<name>.+?)"/);
		if (tensorMatched) {
			const arch = archList.find((a) => a.cppConst === currCppConst);
			if (arch) arch.tensorNames.push(tensorMatched.groups?.name || "");
		}
	}

	/////////////////////////////////////
	// extract list of hyper params based on architecture
	let insideLoadHParamsFn = false;
	currCppConst = "";
	for (const line of cppSource.split("\n")) {
		// check if current line is function llm_load_hparams()
		if (line.startsWith("static void llm_load_hparams")) {
			insideLoadHParamsFn = true;
		}
		if (!insideLoadHParamsFn) {
			continue;
		}
		// check if current line has LLM_ARCH_*
		const RE_CASE = new RegExp(`case (${RE_ARCH_NAME.source})`);
		const cppConst = (line.match(RE_CASE) || [])[1];
		if (cppConst) {
			currCppConst = cppConst;
			continue;
		}
		// check if current line has get_key(...)
		const keyConst = (line.match(/LLM_KV_[A-Z0-9_]+/) || [])[0];
		if (keyConst) {
			const arch = archList.find((a) => a.cppConst === currCppConst);
			if (arch) {
				arch.hparams.push(keyConst);
			}
		}
		// check if current line is end-of-function
		if (line === "}") {
			break;
		}
	}

	/////////////////////////////////////
	// write result to file
	const content = [
		'import type { ModelBase } from "./types";',
		"// This file is auto-generated by generate-llm.ts",
		"",
		"export const LLM_ARCHITECTURES = [",
		...archList.map((a) => `\t${JSON.stringify(a.name)},`),
		"] as const;",
		"type LLMArchitecture = (typeof LLM_ARCHITECTURES)[number];",
		DEST_COMMON_SOURCE,
		...archList.map((a) => {
			let code = `export type ${a.tsName} = TransformerLLMBase<${JSON.stringify(a.name)}>`;
			if (a.hparams.length > 0) {
				code += [
					" & {",
					...a.hparams.map((k) => `\t${JSON.stringify(constToKVName[k].replace("%s", a.name))}: ${KV_TYPE[k]},`),
					"};",
				].join("\n");
			} else {
				code += ";";
			}
			return code;
		}),
		"",
		`export type TransformerLLM = ${archList.map((a) => a.tsName).join(" | ")};`,
	].join("\n");

	writeFileSync(DEST_FILE_PATH, content);
}

function snakeToPascal(str: string) {
	return str
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");
}

main();
