export enum InferenceDisplayability {
	/**
	 * Yes
	 */
	Yes = "Yes",
	/**
	 * And then, all the possible reasons why it's no:
	 */
	ExplicitOptOut = "ExplicitOptOut",
	CustomCode = "CustomCode",
	LibraryNotDetected = "LibraryNotDetected",
	PipelineNotDetected = "PipelineNotDetected",
	PipelineLibraryPairNotSupported = "PipelineLibraryPairNotSupported",
}
