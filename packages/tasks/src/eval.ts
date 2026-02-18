/**
 * List of supported Evaluation Frameworks supported in the `eval.yaml` file in benchmarks datasets.
 */
export const EVALUATION_FRAMEWORKS = {
	"inspect-ai": {
		name: "inspect-ai",
		description: "Inspect AI is an open-source framework for large language model evaluations.",
		url: "https://inspect.aisi.org.uk/",
	},
	"math-arena": {
		name: "math-arena",
		description: "MathArena is a platform for evaluation of LLMs on latest math competitions and olympiads.",
		url: "https://github.com/eth-sri/matharena",
	},
	mteb: {
		name: "mteb",
		description: "Multimodal toolbox for evaluating embeddings and retrieval systems.",
		url: "https://github.com/embeddings-benchmark/mteb",
	},
	"olmo-bench": {
		name: "olmo-bench",
		description: "olmOCR-Bench is a framework for evaluating document-level OCR of various tools.",
		url: "https://github.com/allenai/olmocr/tree/main/olmocr/bench",
	},
	harbor: {
		name: "harbor",
		description: "Harbor is a framework for evaluating and optimizing agents and language models.",
		url: "https://github.com/laude-institute/harbor",
	},
	archipelago: {
		name: "archipelago",
		description: "Archipelago is a system for running and evaluating AI agents against MCP applications.",
		url: "https://github.com/Mercor-Intelligence/archipelago",
	},
} as const;
