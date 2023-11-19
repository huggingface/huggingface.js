<script lang="ts">
	import WidgetLabel from "../WidgetLabel/WidgetLabel.svelte";

	export let label: string | undefined = undefined;
	export let placeholder: string = "Your sentence here...";
	export let isDisabled = false;
	export let value: string;
</script>

<WidgetLabel {label}>
	<svelte:fragment slot="after">
		<input
			bind:value
			class="{label ? 'mt-1.5' : ''} form-input-alt block w-full"
			placeholder={isDisabled ? "" : placeholder}
			disabled={isDisabled}
			type="text"
		/>
	</svelte:fragment>
</WidgetLabel>
