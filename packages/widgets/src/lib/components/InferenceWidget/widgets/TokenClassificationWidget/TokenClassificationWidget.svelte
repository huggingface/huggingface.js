<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetOuputTokens from "../../shared/WidgetOutputTokens/WidgetOutputTokens.svelte";
	import WidgetTextarea from "../../shared/WidgetTextarea/WidgetTextarea.svelte";
	import WidgetSubmitBtn from "../../shared/WidgetSubmitBtn/WidgetSubmitBtn.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";
	import { uniqBy } from "../../../../utils/ViewUtils.js";
	import { widgetStates } from "../../stores.js";

	interface EntityGroup {
		entity_group: string;
		score: number;
		word: string;
		start?: number;
		end?: number;
	}

	interface Span {
		end: number;
		index?: string;
		start: number;
		type: string;
	}

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	let computeTime = "";
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Span[] = [];
	let outputJson: string;
	let text = "";
	let outputText = "";
	let warning: string = "";
	let setTextAreaValue: (text: string) => void;

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedText = text.trim();

		if (!trimmedText) {
			error = "You need to input some text";
			output = [];
			outputJson = "";
			return;
		}

		if (shouldUpdateUrl && !isOnLoadCall) {
			updateUrl({ text: trimmedText });
		}

		const requestBody = { inputs: trimmedText };
		addInferenceParameters(requestBody, model);

		isLoading = true;

		const res = await callInferenceApi(
			apiUrl,
			model.id,
			requestBody,
			apiToken,
			parseOutput,
			withModelLoading,
			includeCredentials,
			isOnLoadCall
		);

		isLoading = false;
		// Reset values
		computeTime = "";
		error = "";
		warning = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		output = [];
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			output = res.output;
			outputJson = res.outputJson;
			outputText = text;
			if (output.length === 0) {
				warning = "No token was detected";
			}
		} else if (res.status === "loading-model") {
			modelLoading = {
				isLoading: true,
				estimatedTime: res.estimatedTime,
			};
			getOutput({ withModelLoading: true });
		} else if (res.status === "error") {
			error = res.error;
		}
	}

	function isValidOutput(arg: any): arg is EntityGroup[] {
		return (
			Array.isArray(arg) &&
			arg.every((x) => {
				return typeof x.word === "string" && typeof x.entity_group === "string" && typeof x.score === "number";
			})
		);
	}

	function parseOutput(body: unknown): Span[] {
		if (isValidOutput(body)) {
			// Filter out duplicates
			const filteredEntries = uniqBy(body, (val) => JSON.stringify(val));

			const spans: Span[] = [];
			for (const entry of filteredEntries) {
				const span = getSpanData(entry, spans, text);
				if (span) {
					spans.push(span);
				}
			}

			spans.sort((a, b) => {
				/// `a` should come first when the result is < 0
				return a.start === b.start
					? b.end - a.end /// CAUTION.
					: a.start - b.start;
			});

			// Check existence of **strict overlapping**
			for (let i = 0; i < spans.length; i++) {
				if (i < spans.length - 1) {
					const s = spans[i];
					const sNext = spans[i + 1];
					if (s.start < sNext.start && s.end > sNext.start) {
						console.warn("ERROR", "Spans: strict overlapping");
					}
				}
			}

			return spans;
		}
		throw new TypeError("Invalid output: output must be of type Array<word:string; entity_group:string; score:number>");
	}

	function getSpanData(entityGroup: EntityGroup, spans: Span[], text: string): Span | null {
		// When the API returns start/end information
		if (entityGroup.start && entityGroup.end) {
			const span = {
				type: entityGroup.entity_group,
				start: entityGroup.start,
				end: entityGroup.end,
			};
			return !spans.some((x) => equals(x, span)) ? span : null;
		}

		// This is a fallback when the API doesn't return
		// start/end information (when using python tokenizers for instance).
		const normalizedText = text.toLowerCase();

		let needle = entityGroup.word.toLowerCase();
		let idx = 0;
		while (idx !== -1) {
			idx = normalizedText.indexOf(needle, idx);
			if (idx === -1) {
				break;
			}
			const span: Span = {
				type: entityGroup.entity_group,
				start: idx,
				end: idx + needle.length,
			};
			if (!spans.some((x) => equals(x, span))) {
				return span;
			}
			idx++;
		}

		// Fix for incorrect detokenization in this pipeline.
		// e.g. John - Claude
		// todo: Fix upstream.
		needle = entityGroup.word.toLowerCase().replace(/ /g, "");
		idx = 0;
		while (idx !== -1) {
			idx = normalizedText.indexOf(needle, idx);
			if (idx === -1) {
				break;
			}
			const span: Span = {
				type: entityGroup.entity_group,
				start: idx,
				end: idx + needle.length,
			};
			if (!spans.some((x) => equals(x, span))) {
				return span;
			}
		}
		return null;
	}

	function equals(a: Span, b: Span): boolean {
		return a.type === b.type && a.start === b.start && a.end === b.end;
	}

	function applyWidgetExample(sample: WidgetExampleTextInput, opts: ExampleRunOpts = {}) {
		setTextAreaValue(sample.text);
		if (opts.isPreview) {
			return;
		}
		const exampleOutput = sample.output;
		getOutput({ ...opts.inferenceOpts, exampleOutput });
	}
</script>

<WidgetWrapper {apiUrl} {includeCredentials} {model} let:WidgetInfo let:WidgetHeader let:WidgetFooter>
	<WidgetHeader
		{noTitle}
		{model}
		{isLoading}
		{isDisabled}
		{callApiOnMount}
		{applyWidgetExample}
		validateExample={isTextInput}
	/>

	<WidgetTextarea bind:value={text} bind:setValue={setTextAreaValue} {isDisabled} on:cmdEnter={() => getOutput()} />
	<WidgetSubmitBtn classNames="mt-2" {isLoading} {isDisabled} on:run={() => getOutput()} />
	{#if warning}
		<div class="alert alert-warning mt-2">{warning}</div>
	{/if}

	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	<WidgetOuputTokens classNames="mt-2" {output} text={outputText} />

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
