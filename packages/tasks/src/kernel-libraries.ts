/**
 * Elements configurable by a kernel library.
 */
export interface KernelLibraryUiElement {
	/**
	 * Pretty name of the library.
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
	/**
	 * Code snippet(s) displayed
	 */
	snippets?: (kernelId: string, version?: string) => string[];
}

export const KERNEL_LIBRARIES_UI_ELEMENTS = {
	kernels: {
		prettyLabel: "Kernels",
		repoName: "Kernels",
		repoUrl: "https://github.com/huggingface/kernels",
		docsUrl: "https://huggingface.co/docs/kernels",
		snippets: (kernelId: string, version?: string) => [
			`# !pip install kernels

from kernels import get_kernel

kernel = get_kernel("${kernelId}"${version ? `,version="${version}"` : ""})`,
		],
	},
} satisfies Record<string, KernelLibraryUiElement>;
