<script lang="ts">
	import type { WidgetProps } from "../../..//InferenceWidget/shared/types.js";
	import { createEventDispatcher, onDestroy, onMount } from "svelte";
	import IconMagicWand from "../../..//Icons/IconMagicWand.svelte";
	import Recorder from "./Recorder.js";

	export let apiToken: WidgetProps["apiUrl"] | undefined = undefined;
	export let classNames = "";
	export let model: WidgetProps["model"];
	export let updateModelLoading: (isLoading: boolean, estimatedTime?: number) => void;

	const dispatch = createEventDispatcher<{ start: void; stop: void; error: string }>();

	let isRecording = false;
	let recorder: Recorder;
	let txt = "";
	let warning = "";

	async function onClick() {
		try {
			isRecording = !isRecording;
			if (isRecording) {
				dispatch("start");
				await recorder.start();
			} else {
				dispatch("stop");
				txt = "";
				updateModelLoading(false);
				recorder.stop();
			}
		} catch (e) {
			isRecording = false;
			dispatch("stop");
			updateModelLoading(false);
			if (e instanceof Error) {
				switch (e.name) {
					case "NotAllowedError": {
						dispatch("error", "Please allow access to your microphone & refresh the page");
						break;
					}
					case "NotFoundError": {
						dispatch("error", "No microphone found on your device");
						break;
					}
					default: {
						dispatch("error", `${e.name}: ${e.message}`);
						break;
					}
				}
			} else {
				dispatch("error", String(e));
			}
		}
	}

	function renderText(_txt: string) {
		warning = "";
		txt = _txt;
		dispatch("error", "");
		updateModelLoading(false);
	}

	function renderWarning(_warning: string) {
		warning = _warning;
		dispatch("error", "");
		updateModelLoading(false);
	}

	onMount(() => {
		recorder = new Recorder(
			model.id,
			apiToken,
			renderText,
			renderWarning,
			(err: string) => dispatch("error", err),
			updateModelLoading
		);
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
