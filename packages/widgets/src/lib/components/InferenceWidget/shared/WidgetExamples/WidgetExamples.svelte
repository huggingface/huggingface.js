<script lang="ts" generics="TWidgetExample extends WidgetExample">
	import type { ExampleRunOpts, WidgetProps } from "../types.js";
	import type { WidgetExample, WidgetExampleAttribute } from "@huggingface/tasks";

	import { onMount } from "svelte";
	import { slide } from "svelte/transition";

	import { randomItem } from "../../../../utils/ViewUtils.js";
	import IconCaretDownV2 from "../../..//Icons/IconCaretDownV2.svelte";
	import WidgetExamplesGroup from "./WidgetExamplesGroup.svelte";
	import { getQueryParamVal } from "../../..//InferenceWidget/shared/helpers.js";

	export let isLoading = false;
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let classNames: string;
	export let exampleQueryParams: WidgetExampleAttribute[] = [];
	export let applyWidgetExample: (sample: TWidgetExample, opts?: ExampleRunOpts) => void;

	export let validExamples: TWidgetExample[];

	interface ExamplesGroup {
		group: string;
		examples: TWidgetExample[];
	}

	$: exampleGroups = getExamplesGroups(validExamples);
	$: examples = exampleGroups?.[0]?.examples ?? [];
	// for examples with multiple groups, a group needs to be selected first, before an example can be clicked
	$: clickable = exampleGroups?.length === 1;
	let containerEl: HTMLElement;
	let isOptionsVisible = false;
	let title = "Examples";

	function getExamplesGroups(_examples: TWidgetExample[]): ExamplesGroup[] {
		const examples = _examples.map((sample, idx) => ({
			example_title: `Example ${++idx}`,
			group: "Group 1",
			...sample,
		}));
		const examplesGroups: ExamplesGroup[] = [];
		for (const example of examples) {
			const groupExists = examplesGroups.find(({ group }) => group === example.group);
			if (!groupExists) {
				examplesGroups.push({ group: example.group as string, examples: [] });
			}
			examplesGroups.find(({ group }) => group === example.group)?.examples.push(example);
		}
		return examplesGroups;
	}

	function _applyWidgetExample(idx: number) {
		if(!isOptionsVisible){
			return;
		}
		hideOptions();
		const sample = examples[idx];
		title = sample.example_title as string;
		applyWidgetExample(sample);
	}

	function _previewInputSample(idx: number) {
		if(!isOptionsVisible){
			return;
		}
		const sample = examples[idx];
		applyWidgetExample(sample, { isPreview: true });
	}

	function toggleOptionsVisibility() {
		isOptionsVisible = !isOptionsVisible;
	}

	function onClick(e: MouseEvent | TouchEvent) {
		let targetElement = e.target;
		do {
			if (targetElement === containerEl) {
				// This is a click inside. Do nothing, just return.
				return;
			}
			targetElement = (targetElement as HTMLElement).parentElement;
		} while (targetElement);
		// This is a click outside
		hideOptions();
	}

	function hideOptions() {
		isOptionsVisible = false;
	}
	function changeGroup(e: CustomEvent<string>) {
		const selectedGroup = e.detail;
		const newGroup = exampleGroups.find(({ group }) => group === selectedGroup);
		if (!newGroup) {
			return;
		}
		examples = newGroup?.examples ?? [];
		title = "Examples";
		clickable = true;
	}

	onMount(() => {
		// run random example onMount
		(async () => {
			const exampleFromQueryParams = {} as TWidgetExample;
			for (const key of exampleQueryParams) {
				const val = getQueryParamVal(key);
				if (val) {
					// @ts-expect-error complicated type
					exampleFromQueryParams[key] = val;
				}
			}
			if (Object.keys(exampleFromQueryParams).length) {
				// run widget example from query params
				applyWidgetExample(exampleFromQueryParams);
			} else {
				// run random widget example
				const example = randomItem(validExamples);
				if (callApiOnMount && example) {
					applyWidgetExample(example, { inferenceOpts: { isOnLoadCall: true } });
				}
			}
		})();
	});
</script>

<svelte:window on:click={onClick} />

<div class={classNames}>
	<!-- Example Groups -->
	{#if exampleGroups.length > 1}
		<WidgetExamplesGroup
			on:groupSelected={changeGroup}
			{isLoading}
			groupNames={exampleGroups.map(({ group }) => group)}
		/>
	{/if}

	<!-- Example picker -->
	<div
		class="relative mb-1.5
			{isLoading || !clickable ? 'pointer-events-none opacity-50' : ''} 
			{isOptionsVisible ? 'z-10' : ''}"
		bind:this={containerEl}
	>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div
			class="inline-flex w-32 justify-between rounded-md border border-gray-100 px-4 py-1"
			on:click={toggleOptionsVisibility}
		>
			<div class="truncate text-sm">{title}</div>
			<IconCaretDownV2
				classNames="-mr-1 ml-2 h-5 w-5 transition ease-in-out transform {isOptionsVisible && '-rotate-180'}"
			/>
		</div>

		{#if isOptionsVisible}
			<div
				class="absolute right-0 mt-1 w-full origin-top-right rounded-md ring-1 ring-black ring-opacity-10"
				transition:slide
			>
				<div class="rounded-md bg-white py-1" role="none">
					{#each examples as { example_title }, i}
						<!-- svelte-ignore a11y-click-events-have-key-events a11y-mouse-events-have-key-events -->
						<div
							class="cursor-pointer truncate px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-200"
							on:mouseover={() => _previewInputSample(i)}
							on:click={() => _applyWidgetExample(i)}
						>
							{example_title}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
