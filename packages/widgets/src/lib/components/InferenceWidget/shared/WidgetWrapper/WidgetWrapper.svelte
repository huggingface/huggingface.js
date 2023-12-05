<script lang="ts">
	import { InferenceDisplayability } from "@huggingface/tasks";
	import type { WidgetExample } from "@huggingface/tasks";
	import type { WidgetProps, ModelLoadInfo } from "../types.js";

	type TWidgetExample = $$Generic<WidgetExample>;

	import { onMount, setContext } from "svelte";

	import WidgetFooter from "../WidgetFooter/WidgetFooter.svelte";
	import WidgetHeader from "../WidgetHeader/WidgetHeader.svelte";
	import WidgetInfo from "../WidgetInfo/WidgetInfo.svelte";
	import { getModelLoadInfo } from "../../..//InferenceWidget/shared/helpers.js";
	import { modelLoadStates } from "../../stores.js";

	export let apiUrl: string;
	export let model: WidgetProps["model"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	let isDisabled = model.inference !== InferenceDisplayability.Yes && model.pipeline_tag !== "reinforcement-learning";
	let modelLoadInfo: ModelLoadInfo | undefined = undefined;
	let widgetUndisplayable = false;

	// if WidgetHeader determines that there are no examples with outputs AND model.inference !== InferenceDisplayability.Yes
	// then WidgetHeader will call this function to show InferenceDisplayability error to the user without showing anything else
	setContext("makeWidgetUndisplayable", () => {
		widgetUndisplayable = true;
	});

	onMount(() => {
		(async () => {
			if (model.inference !== InferenceDisplayability.Yes){
				return;
			}

			modelLoadInfo = await getModelLoadInfo(apiUrl, model.id, includeCredentials);
			$modelLoadStates[model.id] = modelLoadInfo;

			if (modelLoadInfo?.state === "TooBig") {
				isDisabled = true;
			}
		})();
	});
</script>

{#if widgetUndisplayable}
	<WidgetHeader {model} noTitle={true} />
	<WidgetInfo {model} {modelLoadInfo} />
{:else if modelLoadInfo || model.inference !== InferenceDisplayability.Yes}
	<form class="flex w-full max-w-full flex-col">
		<slot {isDisabled} {modelLoadInfo} {WidgetInfo} {WidgetHeader} {WidgetFooter} />
	</form>
{/if}
