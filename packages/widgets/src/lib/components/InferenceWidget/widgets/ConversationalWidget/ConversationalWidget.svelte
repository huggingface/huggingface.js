<script lang="ts">
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import { Template } from "@huggingface/jinja";
	import type { TokenizerConfig, WidgetExampleTextInput } from "@huggingface/tasks";

	import WidgetOutputConvo from "../../shared/WidgetOutputConvo/WidgetOutputConvo.svelte";
	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, callInferenceApi, updateUrl } from "../../shared/helpers.js";
	import { isTextInput } from "../../shared/inputValidation.js";
	import { widgetStates } from "../../stores.js";
	import { extractSpecialTokensMap } from "./ChatTemplate.js";

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

	interface Response {
		generated_text: string;
	}

	type Output = Array<{
		input: string;
		response: string;
	}>;

	let computeTime = "";
	let messages: Message[] = [];
	let error: string = "";
	let isLoading = false;
	let modelLoading = {
		isLoading: false,
		estimatedTime: 0,
	};
	let output: Output = [];
	let outputJson: string;
	let text = "";

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		exampleOutput = undefined,
	}: InferenceRunOpts = {}) {
		const trimmedText = text.trim();

		if (!trimmedText) {
			return;
		}

		// Error checking
		const config = model.config;
		if (config === undefined) {
			outputJson = "";
			output = [];
			error = "Model config not found";
			return;
		}

		const tokenizerConfig = config.tokenizer as TokenizerConfig | undefined;
		if (tokenizerConfig === undefined) {
			outputJson = "";
			output = [];
			error = "Tokenizer config not found";
			return;
		}

		const chatTemplate = tokenizerConfig.chat_template;
		if (chatTemplate === undefined) {
			outputJson = "";
			output = [];
			error = "No chat template found in tokenizer config";
			return;
		}

		if (shouldUpdateUrl && !messages.length) {
			updateUrl({ text: trimmedText });
		}

		// Add user message to chat
		messages = [...messages, { role: "user", content: trimmedText }];

		// Render chat template
		const special_tokens_map = extractSpecialTokensMap(tokenizerConfig);

		const template = new Template(chatTemplate);
		const chatText = template.render({
			messages,
			add_generation_prompt: true,
			...special_tokens_map,
		});

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
				messages = res.output.chat;
				output = res.output.output;
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

	function parseOutput(
		body: unknown,
		chat: Message[]
	): {
		chat: Message[];
		output: Output;
	} {
		if (Array.isArray(body) && body.length) {
			const text = body[0]?.generated_text ?? "";

			if (!text.length) {
				throw new TypeError("Model did not generate a response.");
			}

			const chatWithOutput = [...chat, { role: "assistant", content: text }];

			const output: Output = Array.from({ length: Math.floor(chatWithOutput.length / 2) }, (_, index) => ({
				input: chatWithOutput[2 * index].content,
				response: chatWithOutput[2 * index + 1].content,
			}));

			return { chat: chatWithOutput, output };
		}
		throw new TypeError("Invalid output: output must be of type Array & non-empty");
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
	<WidgetOutputConvo modelId={model.id} {output} />

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
