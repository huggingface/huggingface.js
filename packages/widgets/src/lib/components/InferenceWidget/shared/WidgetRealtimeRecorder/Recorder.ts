export default class Recorder {
	// see developers.google.com/web/updates/2016/01/mediarecorder
	type: "audio" | "video" = "audio";
	private apiToken: string | undefined;
	private audioContext: AudioContext;
	private isLoggedIn = false;
	private isModelLoaded = false;
	private isEmptyBuffer = false;
	private modelId: string;
	private onError: (err: string) => void;
	private updateModelLoading: (isLoading: boolean, estimatedTime?: number) => void;
	private renderText: (txt: string) => void;
	private renderWarning: (warning: string) => void;
	private socket: WebSocket;
	private stream: MediaStream;

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
		const constraints: MediaStreamConstraints = this.type === "video" ? { audio: true, video: true } : { audio: true };
		this.stream = await navigator.mediaDevices.getUserMedia(constraints);

		this.socket = new WebSocket(`wss://api-inference.huggingface.co/asr/live/cpu/${this.modelId}`);

		this.socket.onerror = (_) => {
			this.onError("Webscoket connection error");
		};

		this.socket.onopen = (_) => {
			this.socket.send(`Bearer ${this.apiToken}`);
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
					this.socket.send(JSON.stringify(message));
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
