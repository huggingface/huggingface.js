<script lang="ts">
	import { InferenceDisplayability } from "@huggingface/tasks";
	import type { WidgetExample } from "@huggingface/tasks";
	import type { WidgetProps } from "../types.js";

	type TWidgetExample = $$Generic<WidgetExample>;

	import { onMount } from "svelte";

	import WidgetFooter from "../WidgetFooter/WidgetFooter.svelte";
	import WidgetHeader from "../WidgetHeader/WidgetHeader.svelte";
	import WidgetInfo from "../WidgetInfo/WidgetInfo.svelte";
	import { getModelLoadInfo } from "../../..//InferenceWidget/shared/helpers.js";
	import { modelLoadStates, widgetStates, updateWidgetState } from "../../stores.js";

	export let apiUrl: string;
	export let model: WidgetProps["model"];
	export let includeCredentials: WidgetProps["includeCredentials"];

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
		})();
	});
</script>

{#if $widgetStates?.[model.id]?.noInference}
	<WidgetHeader {model} noTitle={true} />
	<WidgetInfo {model} />
{:else if $modelLoadStates[model.id] || model.inference !== InferenceDisplayability.Yes}
	<form class="flex w-full max-w-full flex-col">
		<slot {isDisabled} {WidgetInfo} {WidgetHeader} {WidgetFooter} />
	</form>
{/if}
