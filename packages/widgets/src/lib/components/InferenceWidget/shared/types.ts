import type { ModelData, WidgetExample } from "@huggingface/tasks";

export interface WidgetProps {
	apiToken?: string;
	apiUrl: string;
	callApiOnMount: boolean;
	model: ModelData;
	noTitle: boolean;
	shouldUpdateUrl: boolean;
	includeCredentials: boolean;
	isLoggedIn?: boolean;
}

export interface InferenceRunOpts<TExample = WidgetExample> {
	withModelLoading?: boolean;
	isOnLoadCall?: boolean;
	useCache?: boolean;
	example?: TExample;
}

export interface ExampleRunOpts {
	isPreview?: boolean;
	inferenceOpts?: InferenceRunOpts;
}

export enum LoadState {
	Loadable = "Loadable",
	Loaded = "Loaded",
	TooBig = "TooBig",
	Error = "error",
}

export enum ComputeType {
	CPU = "cpu",
	GPU = "gpu",
}

export interface ModelLoadInfo {
	state: LoadState;
	compute_type?: ComputeType;
}

export interface WidgetState {
	isDisabled?: boolean;
	noInference?: boolean;
	isMaximized?: boolean;
}

export type TableData = Record<string, (string | number)[]>;

export type HighlightCoordinates = Record<string, string>;

interface Box {
	xmin: number;
	ymin: number;
	xmax: number;
	ymax: number;
}

export interface DetectedObject {
	box: Box;
	label: string;
	score: number;
	color?: string;
}
export interface ImageSegment {
	label: string;
	score: number;
	mask: string;
	color?: string;
	imgData?: ImageData;
	bitmap?: ImageBitmap;
}
