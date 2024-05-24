<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExample, WidgetExampleAssetInput, WidgetExampleOutputLabels } from "@huggingface/tasks";

	import WidgetAudioTrack from "../../shared/WidgetAudioTrack/WidgetAudioTrack.svelte";
	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetOutputChart from "../../shared/WidgetOutputChart/WidgetOutputChart.svelte";
	import WidgetRecorder from "../../shared/WidgetRecorder/WidgetRecorder.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { callInferenceApi, getBlobFromUrl } from "../../shared/helpers.js";
	import { isValidOutputLabels } from "../../shared/outputValidation.js";
	import { isAssetInput } from "../../shared/inputValidation.js";
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	let computeTime = "";
	let error: string = "";
	let file: Blob | File | null = null;
	let filename: string = "";
	let fileUrl: string;
	let isLoading = false;
	let isRecording = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Array<{ label: string; score: number }> = [];
	let outputJson: string;
	let selectedSampleUrl = "";
	let warning: string = "";

	function onRecordStart() {
		file = null;
		filename = "";
		fileUrl = "";
		isRecording = true;
	}

	function onRecordError(err: string) {
		error = err;
	}

	function onSelectFile(updatedFile: Blob | File) {
		isRecording = false;
		selectedSampleUrl = "";

		if (updatedFile.size !== 0) {
			const date = new Date();
			const time = date.toLocaleTimeString("en-US");
			filename = "name" in updatedFile ? updatedFile.name : `Audio recorded from browser [${time}]`;
			file = updatedFile;
			fileUrl = URL.createObjectURL(file);
		}
	}

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts<WidgetExampleOutputLabels> = {}) {
		if (exampleOutput) {
			output = exampleOutput;
			outputJson = "";
			return;
		}

		if (!file && !selectedSampleUrl) {
			error = "You must select or record an audio file";
			output = [];
			outputJson = "";
			return;
		}

		if (!file && selectedSampleUrl) {
			file = await getBlobFromUrl(selectedSampleUrl);
		}

		const requestBody = { file };

		isLoading = true;

		const res = await callInferenceApi(
			apiUrl,
			model.id,
			requestBody,
			apiToken,
			parseOutput,
			withModelLoading,
			includeCredentials,
			isOnLoadCall
		);

		isLoading = false;
		// Reset values
		computeTime = "";
		error = "";
		warning = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		output = [];
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
			if (output.length === 0) {
				warning = "No classes were detected";
			}
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true });
		} else if (res.status === "error" && !isOnLoadCall) {
			error = res.error;
		}
	}

	function parseOutput(body: unknown): Array<{ label: string; score: number }> {
		if (isValidOutputLabels(body)) {
			return body;
		}
		throw new TypeError("Invalid output: output must be of type Array<label: string, score:number>");
	}

	function applyWidgetExample(sample: WidgetExampleAssetInput<WidgetExampleOutputLabels>, opts: ExampleRunOpts = {}) {
		filename = sample.example_title!;
		fileUrl = sample.src;

		if (opts.isPreview) {
			if (isValidOutputLabels(sample.output)) {
				output = sample.output;
				outputJson = "";
			} else {
				output = [];
				outputJson = "";
			}
			return;
		}
		file = null;
		selectedSampleUrl = sample.src;
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	function validateExample(sample: WidgetExample): sample is WidgetExampleAssetInput<WidgetExampleOutputLabels> {
		return isAssetInput(sample) && (!sample.output || isValidOutputLabels(sample.output));
	}
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
	<WidgetHeader {noTitle} {model} {isLoading} {isDisabled} {callApiOnMount} {applyWidgetExample} {validateExample} />

	<div class="flex flex-wrap items-center {isDisabled ? 'pointer-events-none hidden opacity-50' : ''}">
		<WidgetFileInput accept="audio/*" classNames="mt-1.5 mr-2" on:run={(e) => onSelectFile(e.detail)} />
		<span class="mr-2 mt-1.5">or</span>
		<WidgetRecorder
			classNames="mt-1.5"
			on:start={() => onRecordStart()}
			on:stop={(e) => onSelectFile(e.detail)}
			on:error={(e) => onRecordError(e.detail)}
		/>
	</div>
	{#if fileUrl}
		<WidgetAudioTrack classNames="mt-3" label={filename} src={fileUrl} />
	{/if}
	<WidgetSubmitBtn classNames="mt-2" isDisabled={isRecording || isDisabled} {isLoading} on:run={() => getOutput()} />
	{#if warning}
		<div class="alert alert-warning mt-2">{warning}</div>
	{/if}

	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	<WidgetOutputChart classNames="pt-4" {output} />

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
