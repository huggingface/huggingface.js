/**
 * Elements configurable by a dataset library.
 */
export interface DatasetLibraryUiElement {
	/**
	 * Pretty name of the library.
	 * displayed (in tags?, and) on the main
	 * call-to-action button on the dataset page.
	 */
	prettyLabel: string;
	/**
	 * Repo name of the library's (usually on GitHub) code repo
	 */
	repoName: string;
	/**
	 * URL to library's (usually on GitHub) code repo
	 */
	repoUrl: string;
	/**
	 * URL to library's docs
	 */
	docsUrl?: string;
}

export const DATASET_LIBRARIES_UI_ELEMENTS = {
	mlcroissant: {
		prettyLabel: "Croissant",
		repoName: "croissant",
		repoUrl: "https://github.com/mlcommons/croissant/tree/main/python/mlcroissant",
		docsUrl: "https://github.com/mlcommons/croissant/blob/main/python/mlcroissant/README.md",
	},
	webdataset: {
		prettyLabel: "WebDataset",
		repoName: "webdataset",
		repoUrl: "https://github.com/webdataset/webdataset",
		docsUrl: "https://huggingface.co/docs/hub/datasets-webdataset",
	},
	datasets: {
		prettyLabel: "Datasets",
		repoName: "datasets",
		repoUrl: "https://github.com/huggingface/datasets",
		docsUrl: "https://huggingface.co/docs/hub/datasets-usage",
	},
	pandas: {
		prettyLabel: "pandas",
		repoName: "pandas",
		repoUrl: "https://github.com/pandas-dev/pandas",
		docsUrl: "https://huggingface.co/docs/hub/datasets-pandas",
	},
	dask: {
		prettyLabel: "Dask",
		repoName: "dask",
		repoUrl: "https://github.com/dask/dask",
		docsUrl: "https://huggingface.co/docs/hub/datasets-dask",
	},
} satisfies Record<string, DatasetLibraryUiElement>;

/// List of the dataset libraries supported by the Hub
export type DatasetLibraryKey = keyof typeof DATASET_LIBRARIES_UI_ELEMENTS;
