<script lang="ts">
	import type { SpecialTokensMap } from "@huggingface/tasks";
	import { marked, type MarkedOptions } from "marked";

	export let position: "left" | "right" | "center";
	export let text: string;
	export let specialTokensMap: SpecialTokensMap | undefined = undefined;

	$: tokens = marked.lexer(sanitizeMd(text));

	const PUBLIC_SEP_TOKEN = "</s>";
	const CLASSES: Record<typeof position, string> = {
		left: "rounded-2xl mr-7 place-self-start bg-gray-50 dark:bg-gray-850 dark:text-gray-200",
		right: "rounded-2xl ml-7 bg-blue-600 text-white",
		center: "self-center justify-center border-b text-center pb-4",
	};

	function sanitizeMd(md: string) {
		let ret = md
			.replace(/<\|[a-z]*$/, "")
			.replace(/<\|[a-z]+\|$/, "")
			.replace(/<$/, "")
			.replaceAll(PUBLIC_SEP_TOKEN, " ")
			.replaceAll(/<\|[a-z]+\|>/g, " ")
			.replaceAll(/<br\s?\/?>/gi, "\n")
			.replaceAll("<", "&lt;")
			.trim();

		const stopTokens = ["<|endoftext|>"];
		if (typeof specialTokensMap?.eos_token === "string") {
			stopTokens.push(specialTokensMap.eos_token);
		}
		for (const stop of stopTokens) {
			if (ret.endsWith(stop)) {
				ret = ret.slice(0, -stop.length).trim();
			}
		}

		return ret;
	}

	const renderer = new marked.Renderer();
	renderer.codespan = (code) => `<div class="font-mono">${code.replaceAll("&amp;", "&")}</div>`;
	renderer.code = (code) => `<div class="font-mono whitespace-pre-wrap">${code.replaceAll("&amp;", "&")}</div>`;

	renderer.link = (href, title, text) =>
		`<a href="${href?.replace(/>$/, "")}" target="_blank" rel="noreferrer">${text}</a>`;

	const { extensions, ...defaults } = marked.getDefaults() as MarkedOptions & {
		extensions: any;
	};
	const options: MarkedOptions = {
		...defaults,
		gfm: true,
		breaks: true,
		renderer,
	};
</script>

<div class="px-3 py-2 text-smd {CLASSES[position]}">
	{#each tokens as token}
		{@html marked.parse(token.raw, options)}
	{/each}
</div>
