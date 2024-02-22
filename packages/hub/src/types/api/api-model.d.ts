import type { ModelsLibraryKey, TransformersInfo } from "@huggingface/tasks";
import type { PipelineType } from "../public";

export interface ApiModelInfo {
	_id: string;
	id: string;
	arxivIds: string[];
	author?: string;
	cardData?: ApiModelMetadata;
	cardError: unknown;
	cardExists?: true;
	config: unknown;
	contributors: Array<{ user: string; _id: string }>;
	disabled: boolean;
	discussionsDisabled: boolean;
	doi?: { id: string; commit: string };
	downloads: number;
	downloadsAllTime: number;
	files: string[];
	gitalyUid: string;
	lastAuthor: { email: string; user?: string };
	lastModified: string; // convert to date
	library_name?: ModelsLibraryKey;
	likes: number;
	likesRecent: number;
	private: boolean;
	gated: false | "auto" | "manual";
	sha: string;
	spaces: string[];
	updatedAt: string; // convert to date
	createdAt: string; // convert to date
	pipeline_tag: PipelineType;
	tags: string[];
	"model-index": unknown;
	safetensors?: {
		parameters: Record<string, number>;
		total: number;
	};
	transformersInfo?: TransformersInfo;
}

export interface ApiModelMetadata {
	datasets?: string | string[];
	license?:
		| "apache-2.0"
		| "mit"
		| "openrail"
		| "bigscience-openrail-m"
		| "creativeml-openrail-m"
		| "bigscience-bloom-rail-1.0"
		| "bigcode-openrail-m"
		| "afl-3.0"
		| "artistic-2.0"
		| "bsl-1.0"
		| "bsd"
		| "bsd-2-clause"
		| "bsd-3-clause"
		| "bsd-3-clause-clear"
		| "c-uda"
		| "cc"
		| "cc0-1.0"
		| "cc-by-2.0"
		| "cc-by-2.5"
		| "cc-by-3.0"
		| "cc-by-4.0"
		| "cc-by-sa-3.0"
		| "cc-by-sa-4.0"
		| "cc-by-nc-2.0"
		| "cc-by-nc-3.0"
		| "cc-by-nc-4.0"
		| "cc-by-nd-4.0"
		| "cc-by-nc-nd-3.0"
		| "cc-by-nc-nd-4.0"
		| "cc-by-nc-sa-2.0"
		| "cc-by-nc-sa-3.0"
		| "cc-by-nc-sa-4.0"
		| "cdla-sharing-1.0"
		| "cdla-permissive-1.0"
		| "cdla-permissive-2.0"
		| "wtfpl"
		| "ecl-2.0"
		| "epl-1.0"
		| "epl-2.0"
		| "etalab-2.0"
		| "eupl-1.1"
		| "agpl-3.0"
		| "gfdl"
		| "gpl"
		| "gpl-2.0"
		| "gpl-3.0"
		| "lgpl"
		| "lgpl-2.1"
		| "lgpl-3.0"
		| "isc"
		| "lppl-1.3c"
		| "ms-pl"
		| "mpl-2.0"
		| "odc-by"
		| "odbl"
		| "openrail++"
		| "osl-3.0"
		| "postgresql"
		| "ofl-1.1"
		| "ncsa"
		| "unlicense"
		| "zlib"
		| "pddl"
		| "lgpl-lr"
		| "deepfloyd-if-license"
		| "llama2"
		| "unknown"
		| "other"
		| (
				| "apache-2.0"
				| "mit"
				| "openrail"
				| "bigscience-openrail-m"
				| "creativeml-openrail-m"
				| "bigscience-bloom-rail-1.0"
				| "bigcode-openrail-m"
				| "afl-3.0"
				| "artistic-2.0"
				| "bsl-1.0"
				| "bsd"
				| "bsd-2-clause"
				| "bsd-3-clause"
				| "bsd-3-clause-clear"
				| "c-uda"
				| "cc"
				| "cc0-1.0"
				| "cc-by-2.0"
				| "cc-by-2.5"
				| "cc-by-3.0"
				| "cc-by-4.0"
				| "cc-by-sa-3.0"
				| "cc-by-sa-4.0"
				| "cc-by-nc-2.0"
				| "cc-by-nc-3.0"
				| "cc-by-nc-4.0"
				| "cc-by-nd-4.0"
				| "cc-by-nc-nd-3.0"
				| "cc-by-nc-nd-4.0"
				| "cc-by-nc-sa-2.0"
				| "cc-by-nc-sa-3.0"
				| "cc-by-nc-sa-4.0"
				| "cdla-sharing-1.0"
				| "cdla-permissive-1.0"
				| "cdla-permissive-2.0"
				| "wtfpl"
				| "ecl-2.0"
				| "epl-1.0"
				| "epl-2.0"
				| "etalab-2.0"
				| "eupl-1.1"
				| "agpl-3.0"
				| "gfdl"
				| "gpl"
				| "gpl-2.0"
				| "gpl-3.0"
				| "lgpl"
				| "lgpl-2.1"
				| "lgpl-3.0"
				| "isc"
				| "lppl-1.3c"
				| "ms-pl"
				| "mpl-2.0"
				| "odc-by"
				| "odbl"
				| "openrail++"
				| "osl-3.0"
				| "postgresql"
				| "ofl-1.1"
				| "ncsa"
				| "unlicense"
				| "zlib"
				| "pddl"
				| "lgpl-lr"
				| "deepfloyd-if-license"
				| "llama2"
				| "unknown"
				| "other"
		  )[];
	license_name?: string;
	license_link?: "LICENSE" | "LICENSE.md" | string;
	license_details?: string;
	inference?:
		| boolean
		| {
				parameters?: {
					aggregation_strategy?: string;
					top_k?: number;
					top_p?: number;
					temperature?: number;
					max_new_tokens?: number;
					do_sample?: boolean;
					negative_prompt?: string;
					guidance_scale?: number;
					num_inference_steps?: number;
				};
		  };
	language?: string | string[];
	language_bcp47?: string[];
	language_details?: string;
	tags?: string[];
	pipeline_tag?: string;
	co2_eq_emissions?:
		| number
		| {
				/**
				 * Emissions in grams of CO2
				 */
				emissions: number;
				/**
				 * source of the information, either directly from AutoTrain, code carbon or from a scientific article documenting the model
				 */
				source?: string;
				/**
				 * pre-training or fine-tuning
				 */
				training_type?: string;
				/**
				 * as granular as possible, for instance Quebec, Canada or Brooklyn, NY, USA
				 */
				geographical_location?: string;
				/**
				 * how much compute and what kind, e.g. 8 v100 GPUs
				 */
				hardware_used?: string;
		  };
	library_name?: string;
	thumbnail?: string | null;
	description?: string | null;
	mask_token?: string;
	widget?: WidgetExampleFromModelcard[];
	"model-index"?: ModelIndex[];
	finetuned_from?: string;
	base_model?: string | string[];
	instance_prompt?: string | null;
	extra_gated_prompt?: string;
	extra_gated_fields?: {
		/**
		 * "text" | "checkbox" | "date_picker" | "country" | "ip_location" | { type: "text" | "checkbox" | "date_picker" | "country" | "ip_location" } | { type: "select", options: Array<string | { label: string; value: string; }> } Property
		 */
		[x: string]:
			| "text"
			| "checkbox"
			| "date_picker"
			| "country"
			| "ip_location"
			| { type: "text" | "checkbox" | "date_picker" | "country" | "ip_location" }
			| { type: "select"; options: Array<string | { label: string; value: string }> };
	};
	extra_gated_heading?: string;
	extra_gated_description?: string;
	extra_gated_button_content?: string;
}
