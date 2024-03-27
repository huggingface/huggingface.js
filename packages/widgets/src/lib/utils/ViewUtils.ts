import type { PipelineType } from "@huggingface/tasks";
import type { ActionReturn } from "svelte/action";

const ESCAPED = {
	'"': "&quot;",
	"'": "&#39;",
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
};

/**
 *  Returns a function that clamps input value to range [min <= x <= max].
 */
export function clamp(x: number, min: number, max: number): number {
	return Math.max(min, Math.min(x, max));
}

/**
 * Similar to lodash's uniqBy. In case of multiple items with the same key,
 * only the first one is kept.
 */
export function uniqBy<T, K>(items: T[], itemToKey: (item: T) => K): T[] {
	const keys = new Set(items.map((item) => itemToKey(item)));

	return items.filter((item) => {
		// Will return true if was in set - e.g. was the first item with its key.
		return keys.delete(itemToKey(item));
	});
}

export function typedKeys<K extends string, V>(obj: { [k in K]: V }): K[] {
	return Object.keys(obj) as K[];
}

/**
 * HTML escapes the passed string
 */
export function escape(html: unknown): string {
	return String(html).replace(/["'&<>]/g, (match) => ESCAPED[match as keyof typeof ESCAPED]);
}

/**
 * Returns a promise that will resolve after the specified time
 * @param ms Number of ms to wait
 */
export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

/**
 * "Real" modulo (always >= 0), not remainder.
 */
export function mod(a: number, n: number): number {
	return ((a % n) + n) % n;
}

/**
 * Sum of elements in array
 */
export function sum(arr: number[]): number {
	return arr.reduce((a, b) => a + b, 0);
}

/**
 * Return a random item from an array
 */
export function randomItem<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Safely parse JSON
 */
export function parseJSON<T>(x: unknown): T | undefined {
	if (!x || typeof x !== "string") {
		return undefined;
	}
	try {
		return JSON.parse(x);
	} catch (e) {
		if (e instanceof SyntaxError) {
			console.error(e.name);
		} else if (e instanceof Error) {
			console.error(e.message);
		} else {
			console.error(e);
		}
		return undefined;
	}
}

/**
 * Return true if an HTML element is scrolled all the way
 */
export function isFullyScrolled(elt: HTMLElement): boolean {
	return elt.scrollHeight - Math.abs(elt.scrollTop) === elt.clientHeight;
}

/**
 * Smoothly scroll an element all the way
 */
export function scrollToMax(elt: HTMLElement, axis: "x" | "y" = "y"): void {
	elt.scroll({
		behavior: "smooth",
		left: axis === "x" ? elt.scrollWidth : undefined,
		top: axis === "y" ? elt.scrollHeight : undefined,
	});
}

/**
 * Converts hex string to rgb array (i.e. [r,g,b])
 * original from https://stackoverflow.com/a/39077686/6558628
 */
export function hexToRgb(hex: string): number[] {
	return (
		hex
			.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_, r, g, b) => "#" + r + r + g + g + b + b)
			.substring(1)
			.match(/.{2}/g)
			?.map((x) => parseInt(x, 16)) || [0, 0, 0]
	);
}

// Get the Task id corresponding to the modelPipeline (should be === in 99% cases)
export function getPipelineTask(modelPipeline: PipelineType): PipelineType {
	return modelPipeline === "text2text-generation" ? "text-generation" : modelPipeline;
}

/**
 * Svelte action that will call inference endpoint when a user hits cmd+Enter on a current html element
 */
export function onCmdEnter(node: HTMLElement, opts: { disabled: boolean }): ActionReturn {
	let currentOpts = opts;

	function onKeyDown(e: KeyboardEvent) {
		if ((node as HTMLInputElement)?.disabled || currentOpts.disabled) {
			return;
		}
		// run inference on cmd+Enter
		if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			node.dispatchEvent(new CustomEvent("cmdEnter"));
		}
	}
	node.addEventListener("keydown", onKeyDown);
	return {
		update(updatedOps: { disabled: boolean }) {
			currentOpts = updatedOps;
		},
		destroy() {
			node.removeEventListener("keydown", onKeyDown);
		},
	};
}

/**
 * Teleports the children of a node to another node....
 */
export function portal(node: HTMLElement, targetNode: HTMLElement): ActionReturn {
	const portalChildren = [...node.children];
	targetNode.append(...portalChildren);
	return {
		destroy() {
			for (const portalChild of portalChildren) {
				portalChild.remove();
			}
		},
	};
}

/**
 * Teleports the children of a node under the body element
 */
export function portalToBody(node: HTMLElement): ActionReturn {
	return portal(node, document.body);
}

/**
 * A debounce function that works in both browser and Nodejs.
 * For pure Nodejs work, prefer the `Debouncer` class.
 */
export function debounce<T extends unknown[]>(callback: (...rest: T) => unknown, limit: number): (...rest: T) => void {
	let timer: ReturnType<typeof setTimeout>;

	return function (...rest) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			callback(...rest);
		}, limit);
	};
}

/**
* For Tailwind:
bg-blue-100 border-blue-100 dark:bg-blue-800 dark:border-blue-800
bg-green-100 border-green-100 dark:bg-green-800 dark:border-green-800
bg-yellow-100 border-yellow-100 dark:bg-yellow-800 dark:border-yellow-800
bg-purple-100 border-purple-100 dark:bg-purple-800 dark:border-purple-800
bg-red-100 border-red-100 dark:bg-red-800 dark:border-red-800
*/
