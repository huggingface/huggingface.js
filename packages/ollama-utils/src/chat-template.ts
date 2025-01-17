import { Template as JinjaTemplate } from "@huggingface/jinja";
import { OLLAMA_CHAT_TEMPLATE_MAPPING } from "./chat-template-automap";
import { GGUFParsedInfo, OllamaCustomMappedTemplate, OllamaChatTemplateMapEntry } from "./types";

// regex for finding special tokens inside chat template
const RE_SPECIAL_TOKEN = /<[|_A-Za-z0-9]+>|\[[A-Z]+\]|<\uFF5C[\u2581A-Za-z]+\uFF5C>/g;

const CUSTOM_TEMPLATE_MAPPING: ((ggufTmpl: string) => OllamaCustomMappedTemplate | undefined)[] = [
	(ggufTmpl: string) =>
		ggufTmpl.match(/<用户>/) && ggufTmpl.match(/<AI>/)
			? {
					ollamaTmpl: "<用户>{{ .Prompt }}<AI>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/### Instruction:/)
			? {
					ollamaTmpl: "{{ .System }}\n### Instruction:\n{{ .Prompt }}\n### Response:\n",
					stop: "### Instruction:",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/Human:/)
			? {
					ollamaTmpl: "{{ .System }}\nHuman: {{ .Prompt }}\n\nAssistant:",
					stop: "Human:",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/<start_of_turn>/)
			? {
					// for some reason, gemma2 has weird variants
					ollamaTmpl:
						"<start_of_turn>user\n{{ if .System }}{{ .System }} {{ end }}{{ .Prompt }}<end_of_turn>\n<start_of_turn>model\n{{ .Response }}<end_of_turn>\n",
					stop: "<end_of_turn>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/(bos_token|'<s>') \+ message\['role'\]/)
			? {
					// mlabonne/AlphaMonarch-7B and ministral/Ministral-3b-instruct
					ollamaTmpl:
						"{{ if .System }}<s>system\n{{ .System }}</s>{{ end }}{{ if .Prompt }}<s>user\n{{ .Prompt }}</s>{{ end }}<s>assistant\n{{ .Response }}</s>",
					stop: "</s>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/<\|start_header_id\|>/) && ggufTmpl.match(/eos_token|<\/s>/)
			? {
					// llama 3 variant that does not have <|eot_id|> token, but use EOS token
					ollamaTmpl:
						"{{ if .System }}<|start_header_id|>system<|end_header_id|>\n\n{{ .System }}</s>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>\n\n{{ .Prompt }}</s>{{ end }}<|start_header_id|>assistant<|end_header_id|>\n\n{{ .Response }}</s>",
					stop: "</s>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/<\|assistant\|>/) && ggufTmpl.match(/<\|end\|>/)
			? {
					// variant of zephyr
					ollamaTmpl:
						"{{ if .System }}<|system|>\n{{ .System }}<|end|>\n{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}<|end|>\n{{ end }}<|assistant|>\n{{ .Response }}<|end|>",
					stop: "<|end|>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/<\|{{ item\['role'\] }}\|>/) && ggufTmpl.match(/<\|begin_of_image\|>/)
			? {
					// THUDM/glm-edge-v-2b-gguf (same with zephyr, but without <|end|>)
					// TODO: <|begin_of_image|> token is not yet supported by ollama
					ollamaTmpl:
						"{{ if .System }}<|system|>\n{{ .System }}{{ end }}{{ if .Prompt }}<|user|>\n{{ .Prompt }}{{ end }}<|assistant|>\n{{ .Response }}",
					stop: "<|user|>",
			  }
			: undefined,
	(ggufTmpl: string) =>
		ggufTmpl.match(/<\|START_OF_TURN_TOKEN\|>/) && ggufTmpl.match(/<\|USER_TOKEN\|>/)
			? {
					// https://www.ollama.com/technobyte/c4ai-command-r7b-12-2024
					ollamaTmpl:
						"{{ if .System }}<|START_OF_TURN_TOKEN|><|SYSTEM_TOKEN|>{{ .System }}<|END_OF_TURN_TOKEN|>{{ end }}{{ if .Prompt }}<|START_OF_TURN_TOKEN|><|USER_TOKEN|>{{ .Prompt }}<|END_OF_TURN_TOKEN|>{{ end }}<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|><|START_RESPONSE|>{{ .Response }}<|END_RESPONSE|><|END_OF_TURN_TOKEN|>",
					stop: "<|END_OF_TURN_TOKEN|>",
			  }
			: undefined,
];

// chat template mapping
export function mapGGUFTemplateToOllama(
	gguf: NonNullable<GGUFParsedInfo>,
	options?: {
		// for error tracking purpose
		debugModelId?: string;
		logDebug?: (typeof console)["debug"];
	}
): OllamaChatTemplateMapEntry | undefined {
	if (!gguf.chat_template) {
		return undefined;
	}
	// try matching by first 128 characters (allowing a bit of flexibility)
	const truncatedGGUFTmpl = gguf.chat_template.substring(0, 128);
	for (const tmpl of OLLAMA_CHAT_TEMPLATE_MAPPING) {
		if (tmpl.gguf.substring(0, 128) === truncatedGGUFTmpl) {
			return tmpl;
		}
	}
	// if fails, we try matching by comparing set of special tokens
	const tokGGUF = new Set(gguf.chat_template.match(RE_SPECIAL_TOKEN) ?? []);
	if (tokGGUF.size > 0) {
		for (const tmpl of OLLAMA_CHAT_TEMPLATE_MAPPING) {
			const tokOllama = new Set(tmpl.ollama.tokens);
			// check for Set equality
			if (tokGGUF.size === tokOllama.size && [...tokGGUF].every((tok) => tokOllama.has(tok))) {
				return tmpl;
			}
		}
	}
	// if fails, try custom matching
	for (const customMatching of CUSTOM_TEMPLATE_MAPPING) {
		const matched = customMatching(gguf.chat_template);
		if (matched) {
			// @ngxson wants to track this
			options?.logDebug?.(
				`🔍 Custom map Jinja to Go:\n\n\`\`\`${matched.ollamaTmpl}\`\`\`\n\nhttps://hf.co/api/models/${options?.debugModelId}`
			);
			return {
				model: "custom-matching",
				gguf: gguf.chat_template,
				ollama: {
					template: matched.ollamaTmpl,
					tokens: [],
					params: matched.stop
						? {
								stop: [matched.stop],
						  }
						: {},
				},
			};
		}
	}
	// if fails, we try converting from jinja
	const convertedToGo = convertJinjaToGoTemplate(gguf);
	if (convertedToGo) {
		const stop = Array.from(convertedToGo.tmpl.match(RE_SPECIAL_TOKEN) ?? []);
		if (gguf.chat_template.match(/###/)) {
			stop.push("###");
		} else if (convertedToGo.stop) {
			stop.push(convertedToGo.stop);
		}
		// @ngxson wants to track this
		options?.logDebug?.(
			`🙏 Converted Jinja to Go:\n\n\`\`\`${convertedToGo.tmpl}\`\`\`\n\nhttps://hf.co/api/models/${options?.debugModelId}`
		);
		return {
			model: "auto-conversion",
			gguf: gguf.chat_template,
			ollama: {
				template: convertedToGo.tmpl,
				tokens: [],
				params: { stop: deduplicateArray(stop) },
			},
		};
	}
	// debug (suggested by @julien-c)
	options?.logDebug?.(
		`❌ Cannot map jinja template:\n\n\`\`\`${gguf.chat_template.substring(
			0,
			200
		)}...\`\`\`\n\nhttps://hf.co/api/models/${options?.debugModelId}`
	);
}

// try formatting the chat template into Go format
// function is exported to be used in test
export function convertJinjaToGoTemplate(gguf: NonNullable<GGUFParsedInfo>):
	| {
			tmpl: string;
			stop?: string;
	  }
	| undefined {
	if (!gguf.chat_template) {
		return undefined;
	}
	try {
		const jinja = new JinjaTemplate(gguf.chat_template);
		const systemMsg = { role: "system", content: "{{ .System }}" };
		const userMsg = { role: "user", content: "{{ .Prompt }}" };
		const assistantMsg = { role: "assistant", content: "{{ .Response }}" };

		const format = (msgs: { role: string; content: string }[], retried = false): string => {
			try {
				return jinja.render({
					messages: msgs,
					bos_token: gguf.bos_token ?? "",
					eos_token: gguf.eos_token ?? "",
					add_generation_prompt: false,
				});
			} catch (e) {
				// retry without system role - some templates does not support that
				return retried ? "" : format(msgs.filter((m) => m.role !== "system"));
			}
		};

		const addedPart = (a: string, b: string) => {
			return b.substring(a.length, b.length);
		};

		// system role
		const formattedSystem = format([systemMsg]);

		// assistant role
		// note: we need to place a dummy user msg after system, because sometimes system+user are fused together
		const formattedResp0 = format([systemMsg, userMsg]);
		const formattedResp1 = format([systemMsg, userMsg, assistantMsg]);
		const formattedResp = addedPart(formattedResp0, formattedResp1);

		// user role
		const formattedUser0 = formattedResp1;
		const formattedUser1 = format([systemMsg, userMsg, assistantMsg, userMsg]);
		const formattedUser = addedPart(formattedUser0, formattedUser1);

		// if the system message contains placeholder, we render it as normal
		let goTmpl = `{{ if .System }}${formattedSystem}{{ end }}{{ if .Prompt }}${formattedUser}{{ end }}${formattedResp}`;

		// otherwise, that means the system message is backed into template, we need to always add it
		if (!formattedSystem.match(/{{ \.System }}/)) {
			const formattedUserContent = formattedUser.replace("{{ .Prompt }}", "{{ .Content }}");
			const formattedRespContent = formattedResp.replace("{{ .Response }}", "{{ .Content }}");
			const addedAssistantPrompt = formattedResp.split("{{ .Response }}")[0];
			goTmpl = `${formattedSystem}{{- range .Messages }}{{- if eq .Role \"user\" }}${formattedUserContent}{{- else if eq .Role \"assistant\" }}${formattedRespContent}{{- end }}{{- end }}${addedAssistantPrompt}`;
		}

		// we get the stop token by only keeping the first part of formattedResp
		// this is useful when assistant role does not have the "###" marker
		const stopSequence = formattedUser.replace(/{{ \.Prompt }}.*/s, "").trim();
		return {
			tmpl: goTmpl,
			stop: stopSequence.length < 2 ? undefined : stopSequence,
		};
	} catch (e) {
		return undefined;
	}
}

function deduplicateArray<T>(arr: T[]): T[] {
	return [...new Set(arr)];
}
