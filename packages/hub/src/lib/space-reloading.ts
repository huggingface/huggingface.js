import { fetchEventSource } from "../vendor/fetch-event-source/fetch";
import type {
	ApiCreateReloadRequest,
	ApiCreateReloadResponse,
	ApiFetchContentsRequest,
	ApiFetchContentsResponse,
	ApiGetReloadEventSourceData,
	ApiGetReloadRequest,
	ApiGetStatusRequest,
	ApiGetStatusResponse,
} from "../types/api/api-space-reloading";

export class ReloadClient {
	baseUrl: string;
	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	private async post<TReq, TRes>(path: string, req: TReq): Promise<TRes> {
		const res = await fetch(`${this.baseUrl}${path}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(req),
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json() as Promise<TRes>;
	}

	getStatus(req: ApiGetStatusRequest): Promise<ApiGetStatusResponse> {
		return this.post<ApiGetStatusRequest, ApiGetStatusResponse>("/get-status", req);
	}

	fetchContents(req: ApiFetchContentsRequest): Promise<ApiFetchContentsResponse> {
		return this.post<ApiFetchContentsRequest, ApiFetchContentsResponse>("/fetch-contents", req);
	}

	createReload(req: ApiCreateReloadRequest): Promise<ApiCreateReloadResponse> {
		return this.post<ApiCreateReloadRequest, ApiCreateReloadResponse>("/create-reload", req);
	}

	async *getReload(req: ApiGetReloadRequest): AsyncGenerator<ApiGetReloadEventSourceData, void, void> {
		const controller = new AbortController();
		let resolveNext: ((value: ApiGetReloadEventSourceData | null) => void) | null = null;

		const nextMessage = () =>
			new Promise<ApiGetReloadEventSourceData | null>((resolve) => {
				resolveNext = resolve;
			});

		void fetchEventSource(`${this.baseUrl}/get-reload`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(req),
			signal: controller.signal,
			onmessage(ev) {
				if (ev.data) {
					const data = JSON.parse(ev.data) as ApiGetReloadEventSourceData;
					resolveNext?.(data);
					resolveNext = null;
				}
			},
			onerror() {
				resolveNext?.(null);
				controller.abort();
			},
			onclose() {
				resolveNext?.(null);
				controller.abort();
			},
		});

		try {
			while (true) {
				const msg = await nextMessage();
				if (msg === null) break;
				yield msg;
			}
		} finally {
			controller.abort();
		}
	}
}
