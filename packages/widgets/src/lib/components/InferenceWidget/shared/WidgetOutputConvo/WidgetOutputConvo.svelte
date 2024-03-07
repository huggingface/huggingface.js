<script lang="ts">
	import { afterUpdate } from "svelte";

	import { isFullyScrolled, scrollToMax } from "../../../../utils/ViewUtils.js";
	import WidgetOutputConvoBubble from "../WidgetOuputConvoBubble/WidgetOutputConvoBubble.svelte";
	import type { ChatMessage } from "@huggingface/tasks";
	import { widgetStates } from "../../stores.js";

	export let modelId: string;
	export let messages: ChatMessage[];

	let wrapperEl: HTMLElement;
	$: isMaximized = $widgetStates?.[modelId]?.isMaximized;

	afterUpdate(() => {
		if (wrapperEl && !isFullyScrolled(wrapperEl)) {
			scrollToMax(wrapperEl);
		}
	});
</script>

<div
	bind:this={wrapperEl}
	class="overflow-y-auto rounded-t-lg border border-b-0 leading-tight {isMaximized ? 'flex-1' : 'h-64'}"
>
	<div class="p-3 pt-6 text-center text-sm text-gray-400 text-balance">
		Input a message to start chatting with
		<strong>{modelId}</strong>.
	</div>
	<div class="flex flex-col items-end space-y-4 p-3">
		{#each messages as message}
			{@const position = message.role === "user" ? "right" : message.role === "assistant" ? "left" : "center"}
			<WidgetOutputConvoBubble {position} text={message.content} />
		{/each}
	</div>
</div>
