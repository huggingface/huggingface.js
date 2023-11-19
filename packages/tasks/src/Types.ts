import type { ModelLibraryKey } from "./modelLibraries";
import type { PipelineType } from "./pipelines";

export interface ExampleRepo {
	description: string;
	id: string;
}

export type TaskDemoEntry =
	| {
			filename: string;
			type: "audio";
	  }
	| {
			data: Array<{
				label: string;
				score: number;
			}>;
			type: "chart";
	  }
	| {
			filename: string;
			type: "img";
	  }
	| {
			table: string[][];
			type: "tabular";
	  }
	| {
			content: string;
			label: string;
			type: "text";
	  }
	| {
			text: string;
			tokens: Array<{
				end: number;
				start: number;
				type: string;
			}>;
			type: "text-with-tokens";
	  };

export interface TaskDemo {
	inputs: TaskDemoEntry[];
	outputs: TaskDemoEntry[];
}

export interface TaskData {
	datasets: ExampleRepo[];
	demo: TaskDemo;
	id: PipelineType;
	isPlaceholder?: boolean;
	label: string;
	libraries: ModelLibraryKey[];
	metrics: ExampleRepo[];
	models: ExampleRepo[];
	spaces: ExampleRepo[];
	summary: string;
	widgetModels: string[];
	youtubeId?: string;
}

export type TaskDataCustom = Omit<TaskData, "id" | "label" | "libraries">;
