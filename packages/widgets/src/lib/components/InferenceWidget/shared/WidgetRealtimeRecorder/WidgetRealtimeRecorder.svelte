<script lang="ts">
	import type { WidgetProps } from "../../..//InferenceWidget/shared/types.js";
	import { onDestroy, onMount } from "svelte";
	import IconMagicWand from "../../..//Icons/IconMagicWand.svelte";

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

	class Recorder {
		// see developers.google.com/web/updates/2016/01/mediarecorder
		type: "audio" | "video" = "audio";
		private apiToken: string | undefined;
		private audioContext: AudioContext | undefined;
		private isLoggedIn = false;
		private isModelLoaded = false;
		private isEmptyBuffer = false;
		private modelId: string;
		private onError: (err: string) => void;
		private updateModelLoading: (isLoading: boolean, estimatedTime?: number) => void;
		private renderText: (txt: string) => void;
		private renderWarning: (warning: string) => void;
		private socket: WebSocket | undefined;
		private stream: MediaStream | undefined;

		constructor(
			modelId: string,
			apiToken: string | undefined,
			renderText: (txt: string) => void,
			renderWarning: (warning: string) => void,
			onError: (err: string) => void,
			updateModelLoading: (isLoading: boolean, estimatedTime?: number) => void
		) {
			this.modelId = modelId;
			this.apiToken = apiToken || "";
			this.renderText = renderText;
			this.renderWarning = renderWarning;
			this.onError = onError;
			this.updateModelLoading = updateModelLoading;
		}

		async start(): Promise<void> {
			const constraints: MediaStreamConstraints =
				this.type === "video" ? { audio: true, video: true } : { audio: true };
			this.stream = await navigator.mediaDevices.getUserMedia(constraints);

			this.socket = new WebSocket(`wss://api-inference.huggingface.co/asr/live/cpu/${this.modelId}`);

			this.socket.onerror = () => {
				this.onError("Webscoket connection error");
			};

			this.socket.onopen = () => {
				this.socket?.send(`Bearer ${this.apiToken}`);
			};

			this.updateModelLoading(true);

			this.socket.onmessage = (e: MessageEvent) => {
				const data = JSON.parse(e.data);
				if (data.type === "status" && data.message === "Successful login") {
					this.isLoggedIn = true;
				} else if (data.type === "status" && !!data.estimated_time && !this.isModelLoaded) {
					this.updateModelLoading(true, data.estimated_time);
				} else {
					// data.type === "results"
					this.isModelLoaded = true;
					if (data.text) {
						this.renderText(data.text);
					} else if (!this.isEmptyBuffer) {
						this.renderWarning("result was empty");
					}
				}
			};

			this.audioContext = new AudioContext();
			await this.audioContext.audioWorklet.addModule("/audioProcessor.js");
			const microphone = this.audioContext.createMediaStreamSource(this.stream);
			const dataExtractor = new AudioWorkletNode(this.audioContext, "AudioDataExtractor");
			microphone.connect(dataExtractor).connect(this.audioContext.destination);

			dataExtractor.port.onmessage = (event) => {
				const { buffer, sampling_rate: samplingRate } = event.data;
				this.isEmptyBuffer = buffer.reduce((sum: number, x: number) => sum + x) === 0;
				if (this.isModelLoaded && this.isEmptyBuffer) {
					this.renderWarning("🎤 input is empty: try speaking louder 🗣️ & make sure correct mic source is selected");
				}
				const base64: string = btoa(String.fromCharCode(...new Uint8Array(buffer.buffer)));
				const message = {
					raw: base64,
					sampling_rate: samplingRate,
				};
				if (this.isLoggedIn) {
					try {
						this.socket?.send(JSON.stringify(message));
					} catch (e) {
						this.onError(`Error sending data to websocket: ${e}`);
					}
				}
			};
		}

		stop(): void {
			this.isLoggedIn = false;
			void this.audioContext?.close();
			this.socket?.close();
			if (this.stream) {
				for (const t of this.stream.getTracks()) {
					t.stop();
				}
			}
		}
	}

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
			if (e instanceof Error) {
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
			} else {
				onError(String(e));
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
