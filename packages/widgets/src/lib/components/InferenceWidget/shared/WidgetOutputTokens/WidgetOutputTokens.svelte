<script lang="ts">
	import { escape, mod, sum } from "../../../../utils/ViewUtils";

	interface Span {
		end: number;
		index?: string;
		start: number;
		type: string;
	}

	interface SpanTag {
		span: Span;
		tag: "start" | "end";
	}

	export let classNames = "";
	export let output: Span[] = [];
	export let text = "";

	const COLORS = ["teal", "indigo", "orange", "sky", "violet", "purple", "fuchsia", "pink"] as const;

	/**
	 * Render a text string and its entity spans
	 *
	 * *see displacy-ent.js*
	 * see https://github.com/explosion/displacy-ent/issues/2
	 */
	function render(text: string, spans: Span[]): string {
		const tags: { [index: number]: SpanTag[] } = {};

		const __addTag = (i: number, s: Span, tag: "start" | "end") => {
			if (Array.isArray(tags[i])) {
				tags[i].push({ span: s, tag: tag });
			} else {
				tags[i] = [{ span: s, tag: tag }];
			}
		};

		for (const s of spans) {
			__addTag(s.start, s, "start");
			__addTag(s.end, s, "end");
		}

		let out = "";
		let offset = 0;

		const indexes = Object.keys(tags)
			.map(k => parseInt(k, 10))
			.sort((a, b) => a - b); /// CAUTION
		for (const i of indexes) {
			const spanTags = tags[i];
			if (i > offset) {
				out += escape(text.slice(offset, i));
			}

			offset = i;

			for (const spanTag of spanTags) {
				const hash = mod(sum(Array.from(spanTag.span.type).map(x => x.charCodeAt(0))), COLORS.length);
				const color = COLORS[hash];
				if (spanTag.tag === "start") {
					out += `<span
							data-entity="${spanTag.span.type}" data-hash="${hash}" data-index="${spanTag.span.index ?? ""}"
							class="bg-${color}-100 text-${color}-800 rounded px-1 py-0.5 dark:text-${color}-100 dark:bg-${color}-700"
						>`;
				} else {
					out += `<span
							class="text-xs select-none bg-${color}-500 text-${color}-100 rounded font-semibold px-0.5 ml-1"
						>${spanTag.span.type}</span></span>`;
				}
			}
		}

		out += escape(text.slice(offset, text.length));
		return out;
	}
</script>

{#if text && output.length}
	<!-- 
		For Tailwind:
		bg-teal-100 text-teal-800 bg-teal-500 text-teal-100 dark:text-teal-100 dark:bg-teal-700
		bg-indigo-100 text-indigo-800 bg-indigo-500 text-indigo-100 dark:text-indigo-100 dark:bg-indigo-700
		bg-orange-100 text-orange-800 bg-orange-500 text-orange-100 dark:text-orange-100 dark:bg-orange-700
		bg-sky-100 text-sky-800 bg-sky-500 text-sky-100 dark:text-sky-100 dark:bg-sky-700
		bg-violet-100 text-violet-800 bg-violet-500 text-violet-100 dark:text-violet-100 dark:bg-violet-700
		bg-purple-100 text-purple-800 bg-purple-500 text-purple-100 dark:text-purple-100 dark:bg-purple-700
		bg-fuchsia-100 text-fuchsia-800 bg-fuchsia-500 text-fuchsia-100 dark:text-fuchsia-100 dark:bg-fuchsia-700
		bg-pink-100 text-pink-800 bg-pink-500 text-pink-100 dark:text-pink-100 dark:bg-pink-700
	-->
	<div class="leading-8 text-gray-800 {classNames}">
		{@html render(text, output)}
	</div>
{/if}
