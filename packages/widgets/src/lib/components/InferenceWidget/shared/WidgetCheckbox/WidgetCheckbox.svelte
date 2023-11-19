<script lang="ts">
	import WidgetLabel from "../WidgetLabel/WidgetLabel.svelte";

	export let classNames = "";
	export let checked: boolean;
	export let label: string;
</script>

<WidgetLabel classNames="inline-flex items-center {classNames}" {label}>
	<svelte:fragment slot="before">
		<input
			bind:checked
			class="mr-2 cursor-pointer rounded border-transparent bg-gray-200 text-blue-500 checked:bg-blue-500 focus:ring-1 focus:ring-blue-200 focus:ring-offset-2 dark:bg-gray-700 dark:checked:bg-blue-500 dark:focus:ring-gray-500 dark:focus:ring-offset-gray-925"
			type="checkbox"
		/>
	</svelte:fragment>
</WidgetLabel>
