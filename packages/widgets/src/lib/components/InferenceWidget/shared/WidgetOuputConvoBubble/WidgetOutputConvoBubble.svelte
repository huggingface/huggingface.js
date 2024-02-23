<script lang="ts">
	export let position: "left" | "right";
	export let text: string;
</script>

<div
	class="rounded-2xl px-3 py-2 text-smd {position === 'right'
		? 'ml-7 bg-blue-600 text-white'
		: 'mr-7 place-self-start bg-gray-50 dark:bg-gray-850 dark:text-gray-200'}"
>
	{text}
</div>
