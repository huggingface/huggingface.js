<script lang="ts">
	export let currentState: "error" | "loaded" | "unknown" | undefined;
</script>

<div class="blankslate">
	<div class="subtitle text-xs text-gray-500">
		<div class="loaded mt-2 {currentState !== 'loaded' ? 'hidden' : ''}">
			This model is currently loaded and running on Inference API (serverless).
		</div>
		<div class="error mt-2 {currentState !== 'error' ? 'hidden' : ''}">
			⚠️ This model could not be loaded in Inference API (serverless). ⚠️
		</div>
		<div class="unknown mt-2 {currentState !== 'unknown' ? 'hidden' : ''}">
			This model can be loaded in Inference API (serverless).
		</div>
	</div>
</div>
