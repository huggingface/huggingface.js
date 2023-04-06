const LF = "\n".charCodeAt(0);
const CR = "\r".charCodeAt(0);
const COLON = ":".charCodeAt(0);

/**
 * Represents server-sent event
 */
export interface ServerSentEvent {
	id: string;
	event: string;
	data: string;
	retry?: number;
}

/**
 * Parses Uint8Array chunks into `ServerSentEvent`
 */
export class Uint8ToSseParser {
	private buffer: Uint8Array = new Uint8Array();
	private decoder: TextDecoder = new TextDecoder();
	private searchOffset = 0;
	private event: ServerSentEvent;
	private ignoreConsecutiveLineFeed = false;
	private fieldSeparatorIdx = -1;
	public onEvent: (event: ServerSentEvent) => void;

	constructor() {
		this.event = this.createEmptyEvent();
	}

	/**
	 * Process chunk
	 */
	public addChunk(chunk: Uint8Array): void {
		this.appendToBuffer(chunk);
		while (this.parseNextLine()) {
			// parse all lines in buffer
		}
	}

	/**
	 * Parse the buffer and dispatch the event.
	 * Returns true if buffer is not fully parsed, false otherwise
	 */
	private parseNextLine(): boolean {
		let eol = -1;
		let crlf = false;

		if (this.ignoreConsecutiveLineFeed) {
			if (this.buffer[0] === LF) {
				// continuation of \r\n, ignore
				return this.trimBuffer(1);
			}
			// reset flag
			this.ignoreConsecutiveLineFeed = false;
		}

		for (let i = this.searchOffset; i < this.buffer.length; i++) {
			if (this.buffer[i] === LF) {
				// \n
				eol = i;
			} else if (this.buffer[i] === CR) {
				// \r or \r\n
				if (i + 1 === this.buffer.length) {
					// buffer may end in the middle of /r/n
					// ignore LF if it appears in the next chunk
					this.ignoreConsecutiveLineFeed = true;
					eol = i;
				} else if (this.buffer[i + 1] === LF) {
					// \r\n
					eol = i;
					crlf = true;
				} else {
					// \r
					eol = i;
				}
			} else if (this.fieldSeparatorIdx === -1 && this.buffer[i] === COLON) {
				// save first occurrence of `:`
				this.fieldSeparatorIdx = i;
			}

			if (eol >= 0) {
				break;
			}
		}

		if (eol === -1) {
			// there's no new line in the buffer, will keep searching in the next chunk
			this.searchOffset = this.buffer.length;
			return false;
		}

		if (eol === 0) {
			// empty line, means end of event
			this.dispatchEvent();
			return this.trimBuffer(crlf ? 2 : 1);
		}

		if (this.fieldSeparatorIdx !== -1) {
			// save field and its value
			const fieldName: string = this.decoder.decode(this.buffer.subarray(0, this.fieldSeparatorIdx));
			const fieldValue: string = this.decoder.decode(this.buffer.subarray(this.fieldSeparatorIdx + 1, eol));
			this.fillEvent(fieldName, fieldValue);
		} else {
			// there's no field separator, consider line to be field name with empty value
			const fieldName: string = this.decoder.decode(this.buffer.subarray(0, eol));
			this.fillEvent(fieldName, "");
		}

		// advance to next field
		this.fieldSeparatorIdx = -1;
		return this.trimBuffer(eol + (crlf ? 2 : 1));
	}

	/**
	 * Adds field data to current event
	 */
	private fillEvent(field: string, value: string) {
		switch (field) {
			case "data":
				if (this.event.data) {
					this.event.data += value;
				} else {
					this.event.data = value;
				}
				break;
			case "id":
				this.event.id = value;
				break;
			case "event":
				this.event.event = value;
				break;
			case "retry":
				this.event.retry = parseInt(value);
				break;
			default:
				// unknown field name
				break;
		}
	}

	/**
	 * Dispatches current event via `onEvent` callback
	 */
	private dispatchEvent() {
		this.onEvent(this.event);
		this.event = this.createEmptyEvent();
	}

	/**
	 * Returns empty `ServerSentEvent`
	 */
	private createEmptyEvent() {
		const event: ServerSentEvent = {
			id: "",
			event: "",
			data: "",
			retry: undefined,
		};
		return event;
	}

	/**
	 *
	 */
	private trimBuffer(offset: number) {
		this.buffer = this.buffer.subarray(offset);
		this.searchOffset = 0;
		return this.buffer.length > 0;
	}

	/**
	 * Appends chunk to buffer
	 */
	private appendToBuffer(chunk: Uint8Array) {
		const res = new Uint8Array(this.buffer.length + chunk.length);
		res.set(this.buffer);
		res.set(chunk, this.buffer.length);
		this.buffer = res;
	}
}
