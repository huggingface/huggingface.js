<script lang="ts">
	import { InferenceDisplayability } from "@huggingface/tasks";
	import { type WidgetProps, type ModelLoadInfo, LoadState, ComputeType } from "../types.js";
	import WidgetModelLoading from "../WidgetModelLoading/WidgetModelLoading.svelte";
	import IconAzureML from "../../..//Icons/IconAzureML.svelte";
	import IconInfo from "../../..//Icons/IconInfo.svelte";
	import { modelLoadStates } from "../../stores.js";

	export let model: WidgetProps["model"];
	export let computeTime: string = "";
	export let error: string = "";
	export let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};

	$: modelTooBig = $modelLoadStates[model.id]?.state === "TooBig";

	const state = {
		[LoadState.Loadable]: "This model can be loaded on the Inference API on-demand.",
		[LoadState.Loaded]: "This model is currently loaded and running on the Inference API.",
		[LoadState.TooBig]:
			"Model is too large to load onto the free Inference API. To try the model, launch it on Inference Endpoints instead.",
		[LoadState.Error]: "⚠️ This model could not be loaded by the inference API. ⚠️",
	} as const;

	const azureState = {
		[LoadState.Loadable]: "This model can be loaded loaded on AzureML Managed Endpoint",
		[LoadState.Loaded]: "This model is loaded and running on AzureML Managed Endpoint",
		[LoadState.TooBig]:
			"Model is too large to load onto the free Inference API. To try the model, launch it on Inference Endpoints instead.",
		[LoadState.Error]: "⚠️ This model could not be loaded.",
	} as const;

	function getStatusReport(modelLoadStates: ModelLoadInfo | undefined, statuses: Record<LoadState, string>): string {
		if (!modelLoadStates) {
			return "Model state unknown";
		}
		return statuses[modelLoadStates.state];
	}
</script>

<div class="mt-2">
	<div class="text-xs text-gray-400">
		{#if model.id === "bigscience/bloom"}
			<div class="flex items-baseline">
				<div class="flex items-center whitespace-nowrap text-gray-700">
					<IconAzureML classNames="mr-1 flex-none" /> Powered by&nbsp;
					<a
						class="underline hover:text-gray-800"
						href="https://azure.microsoft.com/products/machine-learning"
						target="_blank">AzureML</a
					>
				</div>
				<div class="border-dotter mx-2 flex flex-1 -translate-y-px border-b border-gray-100" />
				<div>
					{@html getStatusReport($modelLoadStates[model.id], azureState)}
				</div>
			</div>
		{:else if computeTime}
			Computation time on {$modelLoadStates[model.id]?.compute_type ?? ComputeType.CPU}: {computeTime}
		{:else if (model.inference === InferenceDisplayability.Yes || model.pipeline_tag === "reinforcement-learning") && !modelTooBig}
			{@html getStatusReport($modelLoadStates[model.id], state)}
		{:else if model.inference === InferenceDisplayability.ExplicitOptOut}
			<span class="text-sm text-gray-500">Inference API has been turned off for this model.</span>
		{:else if model.inference === InferenceDisplayability.CustomCode}
			<span class="text-sm text-gray-500">Inference API does not yet support model repos that contain custom code.</span
			>
		{:else if model.inference === InferenceDisplayability.LibraryNotDetected}
			<span class="text-sm text-gray-500">
				Unable to determine this model's library. Check the
				<a class="color-inherit" href="/docs/hub/model-cards#specifying-a-library">
					docs <IconInfo classNames="inline" />
				</a>.
			</span>
		{:else if model.inference === InferenceDisplayability.PipelineNotDetected}
			<span class="text-sm text-gray-500">
				Unable to determine this model’s pipeline type. Check the
				<a class="color-inherit" href="/docs/hub/models-widgets#enabling-a-widget">
					docs <IconInfo classNames="inline" />
				</a>.
			</span>
		{:else if model.inference === InferenceDisplayability.PipelineLibraryPairNotSupported}
			<span class="text-sm text-gray-500">
				Inference API does not yet support {model.library_name} models for this pipeline type.
			</span>
		{:else if modelTooBig}
			<span class="text-sm text-gray-500">
				Model is too large to load onto the free Inference API. To try the model, launch it on <a
					class="underline"
					href="https://ui.endpoints.huggingface.co/new?repository={encodeURIComponent(model.id)}"
					>Inference Endpoints</a
				>
				instead.
			</span>
		{:else}
			<!-- added as a failsafe but this case cannot currently happen -->
			<span class="text-sm text-gray-500">
				Inference API is disabled for an unknown reason. Please open a
				<a class="color-inherit underline" href="/{model.id}/discussions/new">Discussion in the Community tab</a>.
			</span>
		{/if}
	</div>
	{#if error}
		<div class="alert alert-error mt-3">{error}</div>
	{/if}
	{#if modelLoading.isLoading}
		<WidgetModelLoading estimatedTime={modelLoading.estimatedTime} />
	{/if}
</div>
