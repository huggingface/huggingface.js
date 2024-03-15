<script lang="ts">
	export let position: "left" | "right" | "center";
	export let text: string;

	const CLASSES: Record<typeof position, string> = {
		left: "rounded-2xl mr-7 place-self-start bg-gray-50 dark:bg-gray-850 dark:text-gray-200",
		right: "rounded-2xl ml-7 bg-blue-600 text-white",
		center: "self-center justify-center border-b text-center pb-4",
	};
</script>

<div class="px-3 py-2 text-smd {CLASSES[position]}">
	{text}
</div>
