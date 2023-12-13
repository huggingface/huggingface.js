<script lang="ts">
	import type { SvelteComponent } from "svelte";
	import type { WidgetProps } from "./shared/types.js";

	import AudioClassificationWidget from "./widgets/AudioClassificationWidget/AudioClassificationWidget.svelte";
	import AudioToAudioWidget from "./widgets/AudioToAudioWidget/AudioToAudioWidget.svelte";
	import AutomaticSpeechRecognitionWidget from "./widgets/AutomaticSpeechRecognitionWidget/AutomaticSpeechRecognitionWidget.svelte";
	import ConversationalWidget from "./widgets/ConversationalWidget/ConversationalWidget.svelte";
	import FeatureExtractionWidget from "./widgets/FeatureExtractionWidget/FeatureExtractionWidget.svelte";
	import FillMaskWidget from "./widgets/FillMaskWidget/FillMaskWidget.svelte";
	import ImageClassificationWidget from "./widgets/ImageClassificationWidget/ImageClassificationWidget.svelte";
	import ImageSegmentationWidget from "./widgets/ImageSegmentationWidget/ImageSegmentationWidget.svelte";
	import ImageToImageWidget from "./widgets/ImageToImageWidget/ImageToImageWidget.svelte";
	import ImageToTextWidget from "./widgets/ImageToTextWidget/ImageToTextWidget.svelte";
	import ObjectDetectionWidget from "./widgets/ObjectDetectionWidget/ObjectDetectionWidget.svelte";
	import QuestionAnsweringWidget from "./widgets/QuestionAnsweringWidget/QuestionAnsweringWidget.svelte";
	import ReinforcementLearningWidget from "./widgets/ReinforcementLearningWidget/ReinforcementLearningWidget.svelte";
	import SentenceSimilarityWidget from "./widgets/SentenceSimilarityWidget/SentenceSimilarityWidget.svelte";
	import SummarizationWidget from "./widgets/SummarizationWidget/SummarizationWidget.svelte";
	import TableQuestionAnsweringWidget from "./widgets/TableQuestionAnsweringWidget/TableQuestionAnsweringWidget.svelte";
	import TabularDataWidget from "./widgets/TabularDataWidget/TabularDataWidget.svelte";
	import TextGenerationWidget from "./widgets/TextGenerationWidget/TextGenerationWidget.svelte";
	import TextToImageWidget from "./widgets/TextToImageWidget/TextToImageWidget.svelte";
	import TextToSpeechWidget from "./widgets/TextToSpeechWidget/TextToSpeechWidget.svelte";
	import TokenClassificationWidget from "./widgets/TokenClassificationWidget/TokenClassificationWidget.svelte";
	import VisualQuestionAnsweringWidget from "./widgets/VisualQuestionAnsweringWidget/VisualQuestionAnsweringWidget.svelte";
	import ZeroShotClassificationWidget from "./widgets/ZeroShotClassificationWidget/ZeroShotClassificationWidget.svelte";
	import ZeroShotImageClassificationWidget from "./widgets/ZeroShotImageClassificationWidget/ZeroShotImageClassificationWidget.svelte";
	import type { PipelineType } from "@huggingface/tasks";
	import WidgetInfo from "./shared/WidgetInfo/WidgetInfo.svelte";

	export let apiToken: WidgetProps["apiToken"] = undefined;
	export let callApiOnMount = false;
	export let apiUrl = "https://api-inference.huggingface.co";
	export let model: WidgetProps["model"];
	export let noTitle = false;
	export let shouldUpdateUrl = false;
	export let includeCredentials = false;
	export let isLoggedIn = false;

	// Note: text2text-generation, text-generation and translation all
	// uses the TextGenerationWidget as they work almost the same.
	// Same goes for fill-mask and text-classification.
	// In the future it may be useful / easier to maintain if we created
	// a single dedicated widget for each pipeline type.
	const WIDGET_COMPONENTS: {
		[key in PipelineType]?: typeof SvelteComponent;
	} = {
		"audio-to-audio": AudioToAudioWidget,
		"audio-classification": AudioClassificationWidget,
		"automatic-speech-recognition": AutomaticSpeechRecognitionWidget,
		conversational: ConversationalWidget,
		"feature-extraction": FeatureExtractionWidget,
		"fill-mask": FillMaskWidget,
		"image-classification": ImageClassificationWidget,
		"image-to-image": ImageToImageWidget,
		"image-to-text": ImageToTextWidget,
		"image-segmentation": ImageSegmentationWidget,
		"object-detection": ObjectDetectionWidget,
		"question-answering": QuestionAnsweringWidget,
		"sentence-similarity": SentenceSimilarityWidget,
		summarization: SummarizationWidget,
		"table-question-answering": TableQuestionAnsweringWidget,
		"text2text-generation": TextGenerationWidget,
		"text-classification": FillMaskWidget,
		"text-generation": TextGenerationWidget,
		"token-classification": TokenClassificationWidget,
		"text-to-image": TextToImageWidget,
		"text-to-speech": TextToSpeechWidget,
		"text-to-audio": TextToSpeechWidget,
		translation: TextGenerationWidget,
		"tabular-classification": TabularDataWidget,
		"tabular-regression": TabularDataWidget,
		"visual-question-answering": VisualQuestionAnsweringWidget,
		"reinforcement-learning": ReinforcementLearningWidget,
		"zero-shot-classification": ZeroShotClassificationWidget,
		"document-question-answering": VisualQuestionAnsweringWidget,
		"zero-shot-image-classification": ZeroShotImageClassificationWidget,
	};

	$: widgetComponent =
		model.pipeline_tag && model.pipeline_tag in WIDGET_COMPONENTS
			? WIDGET_COMPONENTS[model.pipeline_tag as keyof typeof WIDGET_COMPONENTS]
			: undefined;

	// prettier-ignore
	$: widgetProps = ({
		apiToken,
		apiUrl,
		callApiOnMount,
		model,
		noTitle,
		shouldUpdateUrl,
		includeCredentials,
		isLoggedIn,
	}) as WidgetProps;
</script>

{#if widgetComponent}
	<svelte:component this={widgetComponent} {...widgetProps} />
{:else}
	<!-- Still show widget error (such as "pipeline not support", etc.) when there is no widget for a task -->
	<WidgetInfo {model} />
{/if}
