<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExample, WidgetExampleAssetInput, WidgetExampleOutputText } from "@huggingface/tasks";

	import WidgetAudioTrack from "../../shared/WidgetAudioTrack/WidgetAudioTrack.svelte";
	import WidgetFileInput from "../../shared/WidgetFileInput/WidgetFileInput.svelte";
	import WidgetOutputText from "../../shared/WidgetOutputText/WidgetOutputText.svelte";
	import WidgetRecorder from "../../shared/WidgetRecorder/WidgetRecorder.svelte";
	import WidgetRealtimeRecorder from "../../shared/WidgetRealtimeRecorder/WidgetRealtimeRecorder.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { callInferenceApi, getBlobFromUrl } from "../../shared/helpers.js";
	import { isValidOutputText } from "../../shared/outputValidation.js";
	import { isAssetInput } from "../../shared/inputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let includeCredentials: WidgetProps["includeCredentials"];
	let isDisabled = false;

	let computeTime = "";
	let error: string = "";
	let file: Blob | File | null = null;
	let filename: string = "";
	let fileUrl: string;
	let isLoading = false;
	let isRecording = false;
	let isRealtimeRecording = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output = "";
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
	}: InferenceRunOpts<WidgetExampleOutputText> = {}) {
		if (exampleOutput) {
			output = exampleOutput.text;
			outputJson = "";
			return;
		}

		if (!file && !selectedSampleUrl) {
			error = "You must select or record an audio file";
			output = "";
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
		output = "";
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
			if (output.length === 0) {
				warning = "No speech was detected";
			}
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true });
		} else if (res.status === "error") {
			error = res.error;
		}
	}

	function parseOutput(body: unknown): string {
		if (isValidOutputText(body)) {
			return body.text;
		}
		throw new TypeError("Invalid output: output must be of type <text:string>");
	}

	function applyWidgetExample(sample: WidgetExampleAssetInput<WidgetExampleOutputText>, opts: ExampleRunOpts = {}) {
		filename = sample.example_title!;
		fileUrl = sample.src;
		if (opts.isPreview) {
			if (isValidOutputText(sample.output)) {
				output = sample.output.text;
				outputJson = "";
			} else {
				output = "";
				outputJson = "";
			}
			return;
		}
		file = null;
		selectedSampleUrl = sample.src;
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	function updateModelLoading(isLoading: boolean, estimatedTime: number = 0) {
		modelLoading = { isLoading, estimatedTime };
	}

	function validateExample(sample: WidgetExample): sample is WidgetExampleAssetInput<WidgetExampleOutputText> {
		return isAssetInput(sample) && (!sample.output || isValidOutputText(sample.output));
	}
</script>

<WidgetWrapper
	{apiUrl}
	{includeCredentials}
	{model}
	let:isDisabled
	let:modelLoadInfo
	let:WidgetInfo
	let:WidgetHeader
	let:WidgetFooter
>
	<WidgetHeader {noTitle} {model} {isLoading} {isDisabled} {callApiOnMount} {applyWidgetExample} {validateExample} />
	<form>
		<div class="flex flex-wrap items-center {isDisabled ? 'pointer-events-none hidden opacity-50' : ''}">
			{#if !isRealtimeRecording}
				<WidgetFileInput accept="audio/*" classNames="mt-1.5" {onSelectFile} />
				<span class="mx-2 mt-1.5">or</span>
				<WidgetRecorder classNames="mt-1.5" {onRecordStart} onRecordStop={onSelectFile} onError={onRecordError} />
			{/if}
			{#if model?.library_name === "transformers"}
				{#if !isRealtimeRecording}
					<span class="mx-2 mt-1.5">or</span>
				{/if}
				<WidgetRealtimeRecorder
					classNames="mt-1.5"
					{apiToken}
					{model}
					{updateModelLoading}
					onRecordStart={() => (isRealtimeRecording = true)}
					onRecordStop={() => (isRealtimeRecording = false)}
					onError={onRecordError}
				/>
			{/if}
		</div>
		{#if !isRealtimeRecording}
			{#if fileUrl}
				<WidgetAudioTrack classNames="mt-3" label={filename} src={fileUrl} />
			{/if}
			<WidgetSubmitBtn
				classNames="mt-2"
				isDisabled={isRecording || isDisabled}
				{isLoading}
				onClick={() => {
					getOutput();
				}}
			/>
			{#if warning}
				<div class="alert alert-warning mt-2">{warning}</div>
			{/if}
		{/if}
	</form>
	<WidgetInfo {model} {computeTime} {error} {modelLoadInfo} {modelLoading} />

	<WidgetOutputText classNames="mt-4" {output} />

	<WidgetFooter {isDisabled} {outputJson} />
</WidgetWrapper>
