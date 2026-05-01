/**
 * List of supported Evaluation Frameworks supported in the `eval.yaml` file in benchmarks datasets.
 */
export const EVALUATION_FRAMEWORKS = {
	exgentic: {
		name: "exgentic",
		description:
			"Exgentic is an open evaluation framework for general-purpose AI agents across diverse domains and benchmarks.",
		url: "https://github.com/Exgentic/exgentic",
	},
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
	"olmocr-bench": {
		name: "olmocr-bench",
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
	"apex-evals": {
		name: "apex-evals",
		description: "APEX Evals is a benchmark suite and evaluation harness for evaluating large language models.",
		url: "https://github.com/Mercor-Intelligence/apex-evals",
	},
	"screenspot-pro": {
		name: "screenspot-pro",
		description:
			"ScreenSpot-Pro is a GUI grounding benchmark designed to evaluate how well AI agents can locate and identify UI elements across professional software applications in high-resolution screenshots, covering 1,585 annotated images from 26 professional tools.",
		url: "https://github.com/likaixin2000/ScreenSpot-Pro-GUI-Grounding",
	},
	"swe-bench": {
		name: "swe-bench",
		description: "SWE Bench is a framework for evaluating the performance of LLMs on software engineering tasks.",
		url: "https://github.com/swe-bench/swe-bench",
	},
	"swe-bench-pro": {
		name: "swe-bench-pro",
		description:
			"SWE-Bench Pro is a challenging benchmark evaluating LLMs/Agents on long-horizon software engineering tasks.",
		url: "https://github.com/scaleapi/SWE-bench_Pro-os",
	},
	"nemo-evaluator": {
		name: "nemo-evaluator",
		description:
			"NeMo Evaluator is an open-source platform for robust, reproducible, and scalable evaluation of Large Language Models across 100+ benchmarks.",
		url: "https://github.com/NVIDIA-NeMo/Evaluator",
	},
	"yc-bench": {
		name: "yc-bench",
		description:
			"YC Bench is a long-horizon deterministic benchmark for LLM agents. The agent plays CEO of an AI startup over a simulated 1–3 year run.",
		url: "https://github.com/collinear-ai/yc-bench",
	},
	"open-asr-leaderboard": {
		name: "open-asr-leaderboard",
		description: "The Open ASR Leaderboard ranks and evaluates speech recognition models.",
		url: "https://github.com/huggingface/open_asr_leaderboard",
	},
	mdpbench: {
		name: "mdpbench",
		description:
			"MDPBench is a benchmark for evaluating multilingual document parsing across digital, photographed, Latin, and non-Latin document subsets.",
		url: "https://github.com/Yuliang-Liu/MultimodalOCR",
	},
	parsebench: {
		name: "parsebench",
		description:
			"ParseBench is a benchmark for evaluating document parsing systems on real-world enterprise documents across tables, charts, content faithfulness, semantic formatting, and visual grounding.",
		url: "https://github.com/run-llama/ParseBench",
	},
	"video-mme-v2": {
		name: "video-mme-v2",
		description:
			"Video-MME-v2 is a benchmark for evaluating the next stage of video understanding capabilities of multimodal large language models.",
		url: "https://github.com/MME-Benchmarks/Video-MME-v2",
	},
	"claw-eval": {
		name: "claw-eval",
		description:
			"CLAW-Eval is an evaluation framework for assessing LLMs as autonomous agents across 300 human-verified tasks covering communication, finance, and productivity domains.",
		url: "https://github.com/claw-eval/claw-eval",
	},
} as const;
