<script lang="ts">
	import type { WidgetProps } from "../../shared/types";

	import { onDestroy, onMount } from "svelte";

	import IconMagicWand from "../../../Icons/IconMagicWand.svelte";

	import Recorder from "./Recorder";

	export let apiToken: WidgetProps["apiUrl"] | undefined = undefined;
	export let classNames = "";
	export let model: WidgetProps["model"];
	export let updateModelLoading: (isLoading: boolean, estimatedTime?: number) => void;
	export let onRecordStart: () => void = () => null;
	export let onRecordStop: () => void = () => null;
	export let onError: (err: string) => void = () => null;

	let isRecording = false;
	let recorder: Recorder;
	let txt = "";
	let warning = "";

	async function onClick() {
		try {
			isRecording = !isRecording;
			if (isRecording) {
				onRecordStart();
				await recorder.start();
			} else {
				onRecordStop();
				txt = "";
				updateModelLoading(false);
				recorder.stop();
			}
		} catch (e) {
			isRecording = false;
			onRecordStop();
			updateModelLoading(false);
			switch (e.name) {
				case "NotAllowedError": {
					onError("Please allow access to your microphone & refresh the page");
					break;
				}
				case "NotFoundError": {
					onError("No microphone found on your device");
					break;
				}
				default: {
					onError(`${e.name}: ${e.message}`);
					break;
				}
			}
		}
	}

	function renderText(_txt: string) {
		warning = "";
		txt = _txt;
		onError("");
		updateModelLoading(false);
	}

	function renderWarning(_warning: string) {
		warning = _warning;
		onError("");
		updateModelLoading(false);
	}

	onMount(() => {
		recorder = new Recorder(model.id, apiToken, renderText, renderWarning, onError, updateModelLoading);
	});

	onDestroy(() => {
		if (recorder) {
			recorder.stop();
		}
	});
</script>

<button class="btn-widget {classNames}" on:click={onClick} type="button">
	<div class="flex items-center {isRecording ? 'animate-pulse text-red-500' : ''}">
		<IconMagicWand classNames="-ml-1 mr-1.5" />
		<span>
			{isRecording ? "Stop speech recognition" : "Realtime speech recognition"}
		</span>
	</div>
</button>

{#if isRecording}
	<div class="relative top-0 left-0 my-2 inline-flex w-full items-center justify-center {!!warning && 'animate-pulse'}">
		{#if warning}
			<p class="opacity-50">{warning}</p>
		{:else}
			<p class="font-mono lowercase">{txt}</p>
		{/if}
	</div>
{/if}
