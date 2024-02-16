<script lang="ts">
	import { onMount } from "svelte";
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import { Template } from "@huggingface/jinja";
	import type { SpecialTokensMap, TokenizerConfig, WidgetExampleTextInput } from "@huggingface/tasks";
	import { SPECIAL_TOKENS_ATTRIBUTES } from "@huggingface/tasks";

	import WidgetOutputConvo from "../../shared/WidgetOutputConvo/WidgetOutputConvo.svelte";
	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";
	import { widgetStates } from "../../stores.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	interface Message {
		role: string;
		content: string;
	}

	let computeTime = "";
	let messages: Message[] = [];
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let outputJson: string;
	let text = "";

	let compiledTemplate: Template;
	let tokenizerConfig: TokenizerConfig;

	// Check config and compile template
	onMount(() => {
		const config = model.config;
		if (config === undefined) {
			error = "Model config not found";
			return;
		}

		if (config.tokenizer === undefined) {
			error = "Tokenizer config not found";
			return;
		}
		tokenizerConfig = config.tokenizer;

		const chatTemplate = tokenizerConfig.chat_template;
		if (chatTemplate === undefined) {
			error = "No chat template found in tokenizer config";
			return;
		}
		try {
			compiledTemplate = new Template(chatTemplate);
		} catch (e) {
			error = `Invalid chat template: "${(e as Error).message}"`;
			return;
		}
	});

	async function getOutput({ withModelLoading = false, isOnLoadCall = false }: InferenceRunOpts = {}) {
		if (!compiledTemplate) {
			return;
		}

		const trimmedText = text.trim();
		if (!trimmedText) {
			return;
		}

		if (shouldUpdateUrl && !messages.length) {
			updateUrl({ text: trimmedText });
		}

		// Add user message to chat
		messages = [...messages, { role: "user", content: trimmedText }];

		// Render chat template
		const special_tokens_map = extractSpecialTokensMap(tokenizerConfig);

		let chatText;
		try {
			chatText = compiledTemplate.render({
				messages,
				add_generation_prompt: true,
				...special_tokens_map,
			});
		} catch (e) {
			error = `An error occurred while rendering the chat template: "${(e as Error).message}"`;
			return;
		}

		const requestBody = {
			inputs: chatText,
			parameters: {
				return_full_text: false,
				max_new_tokens: 100,
			},
		};
		addInferenceParameters(requestBody, model);

		isLoading = true;

		const res = await callInferenceApi(
			apiUrl,
			model.id,
			requestBody,
			apiToken,
			(body) => parseOutput(body, messages),
			withModelLoading,
			includeCredentials,
			isOnLoadCall
		);

		isLoading = false;
		// Reset values
		computeTime = "";
		error = "";
		modelLoading = { isLoading: false, estimatedTime: 0 };
		outputJson = "";

		if (res.status === "success") {
			computeTime = res.computeTime;
			outputJson = res.outputJson;
			if (res.output) {
				messages = res.output;
			}
			// Emptying input value
			text = "";
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

	function parseOutput(body: unknown, chat: Message[]): Message[] {
		if (Array.isArray(body) && body.length) {
			const text = body[0]?.generated_text ?? "";

			if (!text.length) {
				throw new Error("Model did not generate a response.");
			}

			return [...chat, { role: "assistant", content: text }];
		}
		throw new TypeError("Invalid output: output must be of type Array & non-empty");
	}

	function extractSpecialTokensMap(tokenizerConfig: TokenizerConfig): SpecialTokensMap {
		const specialTokensMap = Object.create(null);
		for (const key of SPECIAL_TOKENS_ATTRIBUTES) {
			const value = tokenizerConfig[key];
			if (typeof value === "string") {
				specialTokensMap[key] = value;
			}
		}
		return specialTokensMap;
	}

	function applyWidgetExample(sample: WidgetExampleTextInput, opts: ExampleRunOpts = {}) {
		text = sample.text;
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
	<WidgetOutputConvo modelId={model.id} {messages} />

	<WidgetQuickInput
		bind:value={text}
		flatTop={true}
		{isLoading}
		{isDisabled}
		onClickSubmitBtn={() => {
			getOutput();
		}}
		submitButtonLabel="Send"
	/>

	<WidgetInfo {model} {computeTime} {error} {modelLoading} />

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
