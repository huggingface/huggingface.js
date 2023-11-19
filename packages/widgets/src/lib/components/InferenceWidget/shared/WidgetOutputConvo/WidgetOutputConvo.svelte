<script lang="ts">
	import { afterUpdate } from "svelte";

	import { isFullyScrolled, scrollToMax } from "../../../../utils/ViewUtils.js";
	import WidgetOutputConvoBubble from "../WidgetOuputConvoBubble/WidgetOutputConvoBubble.svelte";

	export let modelId: string;
	export let output: Array<{
		input: string;
		response: string;
	}>;

	let wrapperEl: HTMLElement;

	afterUpdate(() => {
		if (wrapperEl && !isFullyScrolled(wrapperEl)) {
			scrollToMax(wrapperEl);
		}
	});
</script>

<div bind:this={wrapperEl} class="h-64 overflow-y-auto rounded-t-lg border border-b-0 leading-tight">
	<div class="p-3 pt-6 text-center text-sm text-gray-400">
		Input a message to start chatting with
		<strong>{modelId}</strong>.
	</div>
	<div class="flex flex-col items-end space-y-4 p-3">
		{#each output as exchange}
			<WidgetOutputConvoBubble position="right" text={exchange.input} />
			<WidgetOutputConvoBubble position="left" text={exchange.response} />
		{/each}
	</div>
</div>
