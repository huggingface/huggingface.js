<script lang="ts">
	import { onMount, tick } from "svelte";
	import type { WidgetProps, ExampleRunOpts, InferenceRunOpts } from "../../shared/types.js";
	import type { Options } from "@huggingface/inference";
	import { Template } from "@huggingface/jinja";
	import type {
		SpecialTokensMap,
		TokenizerConfig,
		WidgetExampleTextInput,
		TextGenerationInput,
		WidgetExampleOutputText,
		WidgetExampleChatInput,
		WidgetExample,
		AddedToken,
	} from "@huggingface/tasks";
	import { SPECIAL_TOKENS_ATTRIBUTES } from "@huggingface/tasks";
	import { HfInference } from "@huggingface/inference";

	import type { ChatMessage } from "@huggingface/tasks";
	import WidgetOutputConvo from "../../shared/WidgetOutputConvo/WidgetOutputConvo.svelte";
	import WidgetQuickInput from "../../shared/WidgetQuickInput/WidgetQuickInput.svelte";
	import WidgetWrapper from "../../shared/WidgetWrapper/WidgetWrapper.svelte";
	import { addInferenceParameters, updateUrl } from "../../shared/helpers.js";
	import { widgetStates, getTgiSupportedModels, isLoggedIn } from "../../stores.js";
	import type { Writable } from "svelte/store";
	import { isChatInput, isTextInput } from "../../shared/inputValidation.js";
	import { isValidOutputText } from "../../shared/outputValidation.js";

	export let apiToken: WidgetProps["apiToken"];
	export let apiUrl: WidgetProps["apiUrl"];
	export let callApiOnMount: WidgetProps["callApiOnMount"];
	export let model: WidgetProps["model"];
	export let noTitle: WidgetProps["noTitle"];
	export let shouldUpdateUrl: WidgetProps["shouldUpdateUrl"];
	export let includeCredentials: WidgetProps["includeCredentials"];

	type Example = WidgetExampleTextInput<WidgetExampleOutputText> | WidgetExampleChatInput<WidgetExampleOutputText>;

	let tgiSupportedModels: Writable<Set<string> | undefined>;

	$: isDisabled = $widgetStates?.[model.id]?.isDisabled;

	let messages: ChatMessage[] = [];
	let error: string = "";
	let isLoading: boolean = false;
	let outputJson: string;
	let text = "";

	let compiledTemplate: Template;
	let tokenizerConfig: TokenizerConfig;
	let inferenceClient: HfInference | undefined = undefined;
	let abort: AbortController | undefined = undefined;

	// Check config and compile template
	onMount(() => {
		const config = model.config;
		if (config === undefined) {
			error = "Model config not found";
			return;
		}

		if (config.tokenizer_config === undefined) {
			error = "Tokenizer config not found";
			return;
		}
		tokenizerConfig = config.tokenizer_config;

		let chatTemplate = tokenizerConfig.chat_template;
		if (chatTemplate === undefined) {
			error = "No chat template found in tokenizer config";
			return;
		}
		if (Array.isArray(chatTemplate)) {
			chatTemplate = chatTemplate.find((template) => template.name === "default")?.template ?? chatTemplate[0]?.template;
		}
		if (!chatTemplate) {
			error = "No chat template found in tokenizer config";
			return;
		}
		try {
			compiledTemplate = new Template(chatTemplate);
		} catch (e) {
			error = `Invalid chat template: "${(e as Error).message}"`;
			return;
		}

		inferenceClient = new HfInference(apiToken);
	});

	async function handleNewMessage(): Promise<void> {
		if (isLoading) {
			return;
		}
		isLoading = true;
		try {
			const trimmedText = text.trim();
			if (!trimmedText) {
				return;
			}

			if (shouldUpdateUrl && !messages.length) {
				updateUrl({ text: trimmedText });
			}

			// Add user message to chat
			messages = [...messages, { role: "user", content: trimmedText }];
			await tick();
			await getOutput();
		} finally {
			isLoading = false;
		}
	}

	async function getOutput({
		withModelLoading = false,
		isOnLoadCall = false,
		useCache = true,
		exampleOutput = undefined,
	}: InferenceRunOpts<WidgetExampleOutputText> = {}) {
		if (exampleOutput) {
			error = "";
			messages = [...messages, { role: "assistant", content: exampleOutput.text }];
			await tick();
			return;
		}
		if (!compiledTemplate) {
			return;
		}
		if (!inferenceClient) {
			error = "Inference client not ready";
			return;
		}
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

		const input: TextGenerationInput & Required<Pick<TextGenerationInput, "parameters">> = {
			inputs: chatText,
			parameters: {
				return_full_text: false,
			},
		};
		addInferenceParameters(input, model);

		isLoading = true;
		abort = new AbortController();
		text = "";
		error = "";
		try {
			const opts = {
				dont_load_model: isOnLoadCall || !$isLoggedIn,
				includeCredentials,
				signal: abort?.signal,
				use_cache: useCache || !$isLoggedIn,
				wait_for_model: withModelLoading,
			} satisfies Options;

			tgiSupportedModels = await getTgiSupportedModels(apiUrl);
			if ($tgiSupportedModels?.has(model.id)) {
				console.debug("Starting text generation using the TGI streaming API");
				let newMessage = {
					role: "assistant",
					content: "",
				} satisfies ChatMessage;
				const previousMessages = [...messages];
				const tokenStream = inferenceClient.textGenerationStream(
					{
						...input,
						model: model.id,
						accessToken: apiToken,
					},
					opts
				);
				for await (const newToken of tokenStream) {
					if (newToken.token.special) continue;
					newMessage.content = newMessage.content + newToken.token.text;
					messages = [...previousMessages, newMessage];
					await tick();
				}
			} else {
				console.debug("Starting text generation using the synchronous API");
				input.parameters.max_new_tokens = 100;
				const output = await inferenceClient.textGeneration({ ...input, model: model.id, accessToken: apiToken }, opts);
				messages = [...messages, { role: "assistant", content: output.generated_text }];
				await tick();
			}
		} catch (e) {
			if (!!e && typeof e === "object" && "message" in e && typeof e.message === "string") {
				error = e.message;
			} else {
				error = `Something went wrong with the request.`;
			}
		} finally {
			isLoading = false;
			abort = undefined;
		}
	}

	function extractSpecialTokensMap(tokenizerConfig: TokenizerConfig): SpecialTokensMap {
		const specialTokensMap = Object.create(null);
		for (const key of SPECIAL_TOKENS_ATTRIBUTES) {
			const value = tokenizerConfig[key];
			if (typeof value === "string") {
				specialTokensMap[key] = value;
			} else if (typeof value === "object" && !!value && value.__type === "AddedToken" && value.content) {
				specialTokensMap[key] = (value as AddedToken).content;
			}
		}
		return specialTokensMap;
	}

	async function applyWidgetExample(example: Example, opts: ExampleRunOpts = {}): Promise<void> {
		if ("text" in example) {
			messages = [{ role: "user", content: example.text }];
		} else {
			messages = [...example.messages];
		}
		if (opts.isPreview) {
			return;
		}
		const exampleOutput = example.output;
		await getOutput({ ...opts.inferenceOpts, exampleOutput });
	}

	function validateExample(sample: WidgetExample): sample is Example {
		return (isTextInput(sample) || isChatInput(sample)) && (!sample.output || isValidOutputText(sample.output));
	}

	async function clearConversation() {
		error = "";
		abort?.abort();
		messages = [];
		text = "";
		await tick();
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
		{validateExample}
		on:reset={clearConversation}
		showReset={!!messages.length}
	/>
	<WidgetOutputConvo modelId={model.id} {messages} />

	<WidgetQuickInput
		bind:value={text}
		flatTop={true}
		{isLoading}
		{isDisabled}
		onClickSubmitBtn={handleNewMessage}
		submitButtonLabel="Send"
		on:cmdEnter={handleNewMessage}
	/>

	<WidgetInfo {model} {error} />

	<WidgetFooter {model} {isDisabled} {outputJson} />
</WidgetWrapper>
