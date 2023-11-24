export default class Recorder {
	// see developers.google.com/web/updates/2016/01/mediarecorder
	type: "audio" | "video" = "audio";
	private stream?: MediaStream;
	private mediaRecorder?: MediaRecorder;
	private recordedBlobs: Blob[] = [];
	public outputBlob?: Blob;

	get desiredMimeType(): string {
		return this.type === "video" ? "video/webm" : "audio/webm";
	}
	get mimeType(): string {
		if (!this.mediaRecorder) {
			throw new Error("MediaRecorder not initialized");
		}
		return this.mediaRecorder.mimeType;
	}
	async start(): Promise<void> {
		this.recordedBlobs = [];

		const constraints: MediaStreamConstraints = this.type === "video" ? { audio: true, video: true } : { audio: true };
		this.stream = await navigator.mediaDevices.getUserMedia(constraints);
		this.startRecording();
	}
	private startRecording() {
		if (!this.stream) {
			throw new Error("Stream not initialized");
		}
		this.outputBlob = undefined;
		this.mediaRecorder = new MediaRecorder(this.stream, {
			mimeType: this.desiredMimeType,
		});
		this.mediaRecorder.onstop = this.handleStop.bind(this);
		this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this);
		this.mediaRecorder.start(10); // timeslice in ms
	}
	handleStop(): void {}
	handleDataAvailable(evt: BlobEvent): void {
		if (evt.data && evt.data.size > 0) {
			this.recordedBlobs.push(evt.data);
		}
	}
	async stopRecording(): Promise<Blob> {
		if (this.mediaRecorder) {
			this.mediaRecorder.stop();
		}
		if (this.stream) {
			for (const t of this.stream.getTracks()) {
				t.stop(); // Stop stream.
			}
		}

		// handle stopRecording gets called before this.mediaRecorder is initialized
		if (!this.mediaRecorder) {
			return new Blob(this.recordedBlobs);
		}

		await new Promise((resolve) => setTimeout(resolve, 30));
		// Wait for the last blob in handleDataAvailable.
		// Alternative: hook into `onstop` event.
		const superBuffer = new Blob(this.recordedBlobs, {
			type: this.mimeType,
		});
		this.outputBlob = superBuffer;
		return superBuffer;
	}
}
