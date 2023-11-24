<script lang="ts">
	import ModeSwitcher from "$lib/components/DemoThemeSwitcher/DemoThemeSwitcher.svelte";
	import InferenceWidget from "$lib/components/InferenceWidget/InferenceWidget.svelte";

	export let data;
</script>

<a href="/" class="ml-3 block pt-3 underline">← Back to index</a>
<ModeSwitcher />

<div class="container py-24">
	{#if data.model}
		<div>
			<a class="mb-3 block text-xs text-gray-300" href="/{data.model.id}">
				<code>{data.model.id}</code>
			</a>
			<div class="max-w-3xl rounded-xl bg-white p-5 shadow-sm">
				<InferenceWidget model={data.model} />
			</div>
		</div>

		<pre class="mt-16 px-3 py-4 text-xs text-gray-900">
			{JSON.stringify(data.model, null, 2)}
		</pre>
	{:else}
		<div>Error. Probably non existent model. {data.message}</div>
	{/if}
</div>
