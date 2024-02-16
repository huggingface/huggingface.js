<script lang="ts">
	import { InferenceDisplayability } from "@huggingface/tasks";
	import type { WidgetExample } from "@huggingface/tasks";
	import type { WidgetProps } from "../types.js";

	type TWidgetExample = $$Generic<WidgetExample>;

	import { onMount } from "svelte";

	import WidgetFooter from "../WidgetFooter/WidgetFooter.svelte";
	import WidgetHeader from "../WidgetHeader/WidgetHeader.svelte";
	import WidgetInfo from "../WidgetInfo/WidgetInfo.svelte";
	import IconCross from "../../..//Icons/IconCross.svelte";
	import { getModelLoadInfo, getTgiSupportedModels } from "../../..//InferenceWidget/shared/helpers.js";
	import { modelLoadStates, widgetStates, updateWidgetState, tgiSupportedModels } from "../../stores.js";

	export let apiUrl: string;
	export let model: WidgetProps["model"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isMaximized = $widgetStates?.[model.id]?.isMaximized;

	const isDisabled = model.inference !== InferenceDisplayability.Yes && model.pipeline_tag !== "reinforcement-learning";
	updateWidgetState(model.id, "isDisabled", isDisabled);

	onMount(() => {
		(async () => {
			if (model.inference !== InferenceDisplayability.Yes) {
				return;
			}

			const modelLoadInfo = await getModelLoadInfo(apiUrl, model.id, includeCredentials);
			$modelLoadStates[model.id] = modelLoadInfo;

			if (modelLoadInfo?.state === "TooBig") {
				updateWidgetState(model.id, "isDisabled", true);
			}

			if (!$tgiSupportedModels) {
				tgiSupportedModels.set(await getTgiSupportedModels(apiUrl));
			}
		})();
	});
</script>

{#if $widgetStates?.[model.id]?.noInference}
	<WidgetHeader {model} noTitle={true} />
	<WidgetInfo {model} />
{:else if $modelLoadStates[model.id] || model.inference !== InferenceDisplayability.Yes}
	<form
		class="flex w-full max-w-full flex-col
	{isMaximized ? 'fixed inset-0 z-20 bg-white p-12' : ''}"
	>
		{#if isMaximized}
			<button class="absolute right-12 top-6" on:click={() => updateWidgetState(model.id, "isMaximized", false)}>
				<IconCross classNames="text-xl text-gray-500 hover:text-black" />
			</button>
		{/if}
		<slot {WidgetInfo} {WidgetHeader} {WidgetFooter} />
	</form>
{/if}
