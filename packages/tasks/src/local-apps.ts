import type { ModelData } from "./model-data";
import type { PipelineType } from "./pipelines";

interface Snippet {
	title: string;
	setup: string;
	command: string;
}

/**
 * Elements configurable by a local app.
 */
export type LocalApp = {
	/**
	 * Name that appears in buttons
	 */
	prettyLabel: string;
	/**
	 * Link to get more info about a local app (website etc)
	 */
	docsUrl: string;
	/**
	 * main category of app
	 */
	mainTask: PipelineType;
	/**
	 * Whether to display a pill "macOS-only"
	 */
	macOSOnly?: boolean;

	comingSoon?: boolean;
	/**
	 * IMPORTANT: function to figure out whether to display the button on a model page's main "Use this model" dropdown.
	 */
	displayOnModelPage: (model: ModelData) => boolean;
} & (
	| {
			/**
			 * If the app supports deeplink, URL to open.
			 */
			deeplink: (model: ModelData, filepath?: string) => URL;
	  }
	| {
			/**
			 * And if not (mostly llama.cpp), snippet to copy/paste in your terminal
			 * Support the placeholder {{GGUF_FILE}} that will be replaced by the gguf file path or the list of available files.
			 */
			snippet: (model: ModelData, filepath?: string) => string | string[] | Snippet | Snippet[];
	  }
);

function isGgufModel(model: ModelData) {
	return model.tags.includes("gguf");
}

const snippetLlamacpp = (model: ModelData, filepath?: string): Snippet[] => {
	const command = (binary: string) =>
		[
			"# Load and run the model:",
			`${binary} \\`,
			`  --hf-repo "${model.id}" \\`,
			`  --hf-file ${filepath ?? "{{GGUF_FILE}}"} \\`,
			'  -p "You are a helpful assistant" \\',
			"  --conversation",
		].join("\n");
	return [
		{
			title: "Install from brew",
			setup: "brew install llama.cpp",
			command: command("llama-cli"),
		},
		{
			title: "Use pre-built binary",
			setup: [
				// prettier-ignore
				"# Download pre-built binary from:",
				"# https://github.com/ggerganov/llama.cpp/releases",
			].join("\n"),
			command: command("./llama-cli"),
		},
		{
			title: "Build from source code",
			setup: [
				"git clone https://github.com/ggerganov/llama.cpp.git",
				"cd llama.cpp",
				"LLAMA_CURL=1 make llama-cli",
			].join("\n"),
			command: command("./llama-cli"),
		},
	];
};

/**
 * Add your new local app here.
 *
 * This is open to new suggestions and awesome upcoming apps.
 *
 * /!\ IMPORTANT
 *
 * If possible, you need to support deeplinks and be as cross-platform as possible.
 *
 * Ping the HF team if we can help with anything!
 */
export const LOCAL_APPS = {
	"llama.cpp": {
		prettyLabel: "llama.cpp",
		docsUrl: "https://github.com/ggerganov/llama.cpp",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		snippet: snippetLlamacpp,
	},
	lmstudio: {
		prettyLabel: "LM Studio",
		docsUrl: "https://lmstudio.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model, filepath) =>
			new URL(`lmstudio://open_from_hf?model=${model.id}${filepath ? `&file=${filepath}` : ""}`),
	},
	jan: {
		prettyLabel: "Jan",
		docsUrl: "https://jan.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`jan://models/huggingface/${model.id}`),
	},
	backyard: {
		prettyLabel: "Backyard AI",
		docsUrl: "https://backyard.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`https://backyard.ai/hf/model/${model.id}`),
	},
	sanctum: {
		prettyLabel: "Sanctum",
		docsUrl: "https://sanctum.ai",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`sanctum://open_from_hf?model=${model.id}`),
	},
	jellybox: {
		prettyLabel: "Jellybox",
		docsUrl: "https://jellybox.com",
		mainTask: "text-generation",
		displayOnModelPage: (model) =>
			isGgufModel(model) ||
			(model.library_name === "diffusers" &&
				model.tags.includes("safetensors") &&
				(model.pipeline_tag === "text-to-image" || model.tags.includes("lora"))),
		deeplink: (model) => {
			if (isGgufModel(model)) {
				return new URL(`jellybox://llm/models/huggingface/LLM/${model.id}`);
			} else if (model.tags.includes("lora")) {
				return new URL(`jellybox://image/models/huggingface/ImageLora/${model.id}`);
			} else {
				return new URL(`jellybox://image/models/huggingface/Image/${model.id}`);
			}
		},
	},
	msty: {
		prettyLabel: "Msty",
		docsUrl: "https://msty.app",
		mainTask: "text-generation",
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`msty://models/search/hf/${model.id}`),
	},
	recursechat: {
		prettyLabel: "RecurseChat",
		docsUrl: "https://recurse.chat",
		mainTask: "text-generation",
		macOSOnly: true,
		displayOnModelPage: isGgufModel,
		deeplink: (model) => new URL(`recursechat://new-hf-gguf-model?hf-model-id=${model.id}`),
	},
	drawthings: {
		prettyLabel: "Draw Things",
		docsUrl: "https://drawthings.ai",
		mainTask: "text-to-image",
		macOSOnly: true,
		displayOnModelPage: (model) =>
			model.library_name === "diffusers" && (model.pipeline_tag === "text-to-image" || model.tags.includes("lora")),
		deeplink: (model) => {
			if (model.tags.includes("lora")) {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.load_lora_weights?repo_id=${model.id}`);
			} else {
				return new URL(`https://drawthings.ai/import/diffusers/pipeline.from_pretrained?repo_id=${model.id}`);
			}
		},
	},
	diffusionbee: {
		prettyLabel: "DiffusionBee",
		docsUrl: "https://diffusionbee.com",
		mainTask: "text-to-image",
		macOSOnly: true,
		comingSoon: true,
		displayOnModelPage: (model) => model.library_name === "diffusers" && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`diffusionbee://open_from_hf?model=${model.id}`),
	},
} satisfies Record<string, LocalApp>;

export type LocalAppKey = keyof typeof LOCAL_APPS;
