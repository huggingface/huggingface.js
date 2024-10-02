import type { ModelData } from "./model-data";
import type { PipelineType } from "./pipelines";

export interface LocalAppSnippet {
	/**
	 * Title of the snippet
	 */
	title: string;
	/**
	 * Optional setup guide
	 */
	setup?: string;
	/**
	 * Content (or command) to be run
	 */
	content: string;
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
			snippet: (model: ModelData, filepath?: string) => string | string[] | LocalAppSnippet | LocalAppSnippet[];
	  }
);

function isAwqModel(model: ModelData): boolean {
	return model.config?.quantization_config?.quant_method === "awq";
}

function isGptqModel(model: ModelData): boolean {
	return model.config?.quantization_config?.quant_method === "gptq";
}

function isAqlmModel(model: ModelData): boolean {
	return model.config?.quantization_config?.quant_method === "aqlm";
}

function isMarlinModel(model: ModelData): boolean {
	return model.config?.quantization_config?.quant_method === "marlin";
}

function isTransformersModel(model: ModelData): boolean {
	return model.tags.includes("transformers");
}

function isLlamaCppGgufModel(model: ModelData) {
	return !!model.gguf?.context_length;
}

const snippetLlamacpp = (model: ModelData, filepath?: string): LocalAppSnippet[] => {
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
			content: command("llama-cli"),
		},
		{
			title: "Use pre-built binary",
			setup: [
				// prettier-ignore
				"# Download pre-built binary from:",
				"# https://github.com/ggerganov/llama.cpp/releases",
			].join("\n"),
			content: command("./llama-cli"),
		},
		{
			title: "Build from source code",
			setup: [
				"git clone https://github.com/ggerganov/llama.cpp.git",
				"cd llama.cpp",
				"LLAMA_CURL=1 make llama-cli",
			].join("\n"),
			content: command("./llama-cli"),
		},
	];
};

const snippetLocalAI = (model: ModelData, filepath?: string): LocalAppSnippet[] => {
	const command = (binary: string) =>
		["# Load and run the model:", `${binary} huggingface://${model.id}/${filepath ?? "{{GGUF_FILE}}"}`].join("\n");
	return [
		{
			title: "Install from binary",
			setup: "curl https://localai.io/install.sh | sh",
			content: command("local-ai run"),
		},
		{
			title: "Use Docker images",
			setup: [
				// prettier-ignore
				"# Pull the image:",
				"docker pull localai/localai:latest-cpu",
			].join("\n"),
			content: command(
				"docker run -p 8080:8080 --name localai -v $PWD/models:/build/models localai/localai:latest-cpu"
			),
		},
	];
};

const snippetVllm = (model: ModelData): LocalAppSnippet[] => {
	const runCommand = [
		"",
		"# Call the server using curl:",
		`curl -X POST "http://localhost:8000/v1/chat/completions" \\ `,
		`	-H "Content-Type: application/json" \\ `,
		`	--data '{`,
		`		"model": "${model.id}"`,
		`		"messages": [`,
		`			{"role": "user", "content": "Hello!"}`,
		`		]`,
		`	}'`,
	];
	return [
		{
			title: "Install from pip",
			setup: ["# Install vLLM from pip:", "pip install vllm"].join("\n"),
			content: ["# Load and run the model:", `vllm serve "${model.id}"`, ...runCommand].join("\n"),
		},
		{
			title: "Use Docker images",
			setup: [
				"# Deploy with docker on Linux:",
				`docker run --runtime nvidia --gpus all \\`,
				`	--name my_vllm_container \\`,
				`	-v ~/.cache/huggingface:/root/.cache/huggingface \\`,
				` 	--env "HUGGING_FACE_HUB_TOKEN=<secret>" \\`,
				`	-p 8000:8000 \\`,
				`	--ipc=host \\`,
				`	vllm/vllm-openai:latest \\`,
				`	--model ${model.id}`,
			].join("\n"),
			content: [
				"# Load and run the model:",
				`docker exec -it my_vllm_container bash -c "vllm serve ${model.id}"`,
				...runCommand,
			].join("\n"),
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
		displayOnModelPage: isLlamaCppGgufModel,
		snippet: snippetLlamacpp,
	},
	vllm: {
		prettyLabel: "vLLM",
		docsUrl: "https://docs.vllm.ai",
		mainTask: "text-generation",
		displayOnModelPage: (model: ModelData) =>
			isAwqModel(model) ||
			isGptqModel(model) ||
			isAqlmModel(model) ||
			isMarlinModel(model) ||
			isLlamaCppGgufModel(model) ||
			isTransformersModel(model),
		snippet: snippetVllm,
	},
	lmstudio: {
		prettyLabel: "LM Studio",
		docsUrl: "https://lmstudio.ai",
		mainTask: "text-generation",
		displayOnModelPage: isLlamaCppGgufModel,
		deeplink: (model, filepath) =>
			new URL(`lmstudio://open_from_hf?model=${model.id}${filepath ? `&file=${filepath}` : ""}`),
	},
	localai: {
		prettyLabel: "LocalAI",
		docsUrl: "https://github.com/mudler/LocalAI",
		mainTask: "text-generation",
		displayOnModelPage: isLlamaCppGgufModel,
		snippet: snippetLocalAI,
	},
	jan: {
		prettyLabel: "Jan",
		docsUrl: "https://jan.ai",
		mainTask: "text-generation",
		displayOnModelPage: isLlamaCppGgufModel,
		deeplink: (model) => new URL(`jan://models/huggingface/${model.id}`),
	},
	backyard: {
		prettyLabel: "Backyard AI",
		docsUrl: "https://backyard.ai",
		mainTask: "text-generation",
		displayOnModelPage: isLlamaCppGgufModel,
		deeplink: (model) => new URL(`https://backyard.ai/hf/model/${model.id}`),
	},
	sanctum: {
		prettyLabel: "Sanctum",
		docsUrl: "https://sanctum.ai",
		mainTask: "text-generation",
		displayOnModelPage: isLlamaCppGgufModel,
		deeplink: (model) => new URL(`sanctum://open_from_hf?model=${model.id}`),
	},
	jellybox: {
		prettyLabel: "Jellybox",
		docsUrl: "https://jellybox.com",
		mainTask: "text-generation",
		displayOnModelPage: (model) =>
			isLlamaCppGgufModel(model) ||
			(model.library_name === "diffusers" &&
				model.tags.includes("safetensors") &&
				(model.pipeline_tag === "text-to-image" || model.tags.includes("lora"))),
		deeplink: (model) => {
			if (isLlamaCppGgufModel(model)) {
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
		displayOnModelPage: isLlamaCppGgufModel,
		deeplink: (model) => new URL(`msty://models/search/hf/${model.id}`),
	},
	recursechat: {
		prettyLabel: "RecurseChat",
		docsUrl: "https://recurse.chat",
		mainTask: "text-generation",
		macOSOnly: true,
		displayOnModelPage: isLlamaCppGgufModel,
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
		displayOnModelPage: (model) => model.library_name === "diffusers" && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`https://diffusionbee.com/huggingface_import?model_id=${model.id}`),
	},
	joyfusion: {
		prettyLabel: "JoyFusion",
		docsUrl: "https://joyfusion.app",
		mainTask: "text-to-image",
		macOSOnly: true,
		displayOnModelPage: (model) =>
			model.tags.includes("coreml") && model.tags.includes("joyfusion") && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`https://joyfusion.app/import_from_hf?repo_id=${model.id}`),
	},
	invoke: {
		prettyLabel: "Invoke",
		docsUrl: "https://github.com/invoke-ai/InvokeAI",
		mainTask: "text-to-image",
		displayOnModelPage: (model) => model.library_name === "diffusers" && model.pipeline_tag === "text-to-image",
		deeplink: (model) => new URL(`https://models.invoke.ai/huggingface/${model.id}`),
	},
} satisfies Record<string, LocalApp>;

export type LocalAppKey = keyof typeof LOCAL_APPS;
