const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined";

const isWebWorker =
	typeof self === "object" && self.constructor && self.constructor.name === "DedicatedWorkerGlobalScope";

export const isFrontend = isBrowser || isWebWorker;
export const isBackend = !isBrowser && !isWebWorker;
