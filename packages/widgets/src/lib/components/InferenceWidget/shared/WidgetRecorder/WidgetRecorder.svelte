<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from "svelte";

	import IconMicrophone from "../../..//Icons/IconMicrophone.svelte";

	import Recorder from "./Recorder.js";

	export let classNames = "";

	const dispatch = createEventDispatcher<{ start: void; stop: Blob; error: string }>();

	let isRecording = false;
	let recorder: Recorder;

	onMount(() => {
		recorder = new Recorder();
	});

	onDestroy(() => {
		if (recorder) {
			recorder.stopRecording();
		}
	});

	async function onClick() {
		try {
			isRecording = !isRecording;
			if (isRecording) {
				await recorder.start();
				dispatch("start");
			} else {
				const blob = await recorder.stopRecording();
				dispatch("stop", blob);
			}
		} catch (e) {
			isRecording = false;
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
						dispatch("error", `Encountered error "${e.name}: ${e.message}"`);
						break;
					}
				}
			} else {
				dispatch("error", String(e));
			}
		}
	}
</script>

<button class="btn-widget {classNames}" on:click={onClick} type="button">
	<div class="flex items-center {isRecording ? 'animate-pulse text-red-500' : ''}">
		<IconMicrophone classNames="-ml-1 mr-1.5" />
		<span>
			{isRecording ? "Click to stop recording" : "Record from browser"}
		</span>
	</div>
</button>
