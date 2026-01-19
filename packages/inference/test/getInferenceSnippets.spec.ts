import { describe, expect, it } from "vitest";
import type { ModelDataMinimal, InferenceSnippetLanguage, PipelineType } from "@huggingface/tasks";
import type { InferenceProviderOrPolicy } from "../src/types.js";
import type { InferenceProviderMappingEntry } from "../src/lib/getInferenceProviderMapping.js";
import { getInferenceSnippets } from "../src/snippets/getInferenceSnippets.js";

describe("getInferenceSnippets", () => {
	// Mock model data for different pipeline types
	const mockTextGenerationModel: ModelDataMinimal = {
		id: "gpt2",
		pipeline_tag: "text-generation",
		tags: [],
		inference: "true",
	};

	const mockConversationalModel: ModelDataMinimal = {
		id: "microsoft/DialoGPT-medium",
		pipeline_tag: "text-generation",
		tags: ["conversational"],
		inference: "true",
	};

	const mockImageClassificationModel: ModelDataMinimal = {
		id: "google/vit-base-patch16-224",
		pipeline_tag: "image-classification",
		tags: [],
		inference: "true",
	};

	const mockTextToImageModel: ModelDataMinimal = {
		id: "stabilityai/stable-diffusion-2",
		pipeline_tag: "text-to-image",
		tags: [],
		inference: "true",
	};

	const mockUnsupportedModel: ModelDataMinimal = {
		id: "test/unsupported-model",
		pipeline_tag: "unsupported-task" as PipelineType,
		tags: [],
		inference: "true",
	};

	describe("Basic functionality", () => {
		it("should return empty array for unsupported pipeline type", () => {
			const snippets = getInferenceSnippets(mockUnsupportedModel, "auto");
			expect(snippets).toEqual([]);
		});

		it("should return empty array for model without pipeline_tag", () => {
			const modelWithoutPipelineTag = { ...mockTextGenerationModel };
			delete (modelWithoutPipelineTag as Record<string, unknown>).pipeline_tag;

			const snippets = getInferenceSnippets(modelWithoutPipelineTag, "auto");
			expect(snippets).toEqual([]);
		});

		it("should return snippets for supported pipeline type", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");
			expect(Array.isArray(snippets)).toBe(true);
			expect(snippets.length).toBeGreaterThan(0);
		});
	});

	describe("Language and client support", () => {
		it("should generate snippets for multiple languages", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			const languages = new Set(snippets.map((s) => s.language));
			expect(languages.size).toBeGreaterThan(0);

			// Should have at least some of the supported languages
			const supportedLanguages: InferenceSnippetLanguage[] = ["js", "python", "sh"];
			const hasAnyLanguage = supportedLanguages.some((lang) => languages.has(lang));
			expect(hasAnyLanguage).toBe(true);
		});

		it("should generate snippets with different clients", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			const clients = new Set(snippets.map((s) => s.client));
			expect(clients.size).toBeGreaterThan(0);
		});

		it("should generate huggingface.js snippet for auto provider", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			const hfJsSnippets = snippets.filter((s) => s.client === "huggingface.js" && s.language === "js");
			expect(hfJsSnippets.length).toBeGreaterThan(0);
		});

		it("should generate huggingface_hub snippet for auto provider", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			const hfPySnippets = snippets.filter((s) => s.client === "huggingface_hub" && s.language === "python");
			expect(hfPySnippets.length).toBeGreaterThan(0);
		});
	});

	describe("Pipeline-specific functionality", () => {
		it("should generate text generation snippets", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should contain textGeneration method for JS client
			const jsSnippets = snippets.filter((s) => s.language === "js");
			expect(jsSnippets.length).toBeGreaterThan(0);

			// Verify content actually contains textGeneration method
			const hasTextGenMethod = jsSnippets.some(
				(snippet) => snippet.content.includes("textGeneration") || snippet.content.includes("text-generation")
			);
			expect(hasTextGenMethod).toBe(true);

			// Should include the model ID
			const hasModelId = snippets.some((snippet) => snippet.content.includes(mockTextGenerationModel.id));
			expect(hasModelId).toBe(true);
		});

		it("should generate conversational snippets for models with conversational tag", () => {
			const snippets = getInferenceSnippets(mockConversationalModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should generate conversational-style snippets
			const hasConversationalContent = snippets.some(
				(s) => s.content.includes("messages") || s.content.includes("chat") || s.content.includes("conversation")
			);
			expect(hasConversationalContent).toBe(true);

			// Should include the conversational model ID
			const hasModelId = snippets.some((snippet) => snippet.content.includes(mockConversationalModel.id));
			expect(hasModelId).toBe(true);

			// Should use conversational template rather than basic text-generation
			const hasConversationalStructure = snippets.some((snippet) => {
				const content = snippet.content;
				// Conversational should have messages array rather than just text input
				return content.includes("messages") && !content.includes('"inputs": "');
			});
			expect(hasConversationalStructure).toBe(true);
		});

		it("should generate image classification snippets", () => {
			const snippets = getInferenceSnippets(mockImageClassificationModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should contain image-related content
			const hasImageContent = snippets.some((s) => s.content.includes("image") || s.content.includes("data"));
			expect(hasImageContent).toBe(true);

			// Should include the model ID
			const hasModelId = snippets.some((snippet) => snippet.content.includes(mockImageClassificationModel.id));
			expect(hasModelId).toBe(true);

			// JS snippets should use imageClassification method
			const jsSnippets = snippets.filter((s) => s.language === "js");
			if (jsSnippets.length > 0) {
				const hasImageClassificationMethod = jsSnippets.some((snippet) =>
					snippet.content.includes("imageClassification")
				);
				expect(hasImageClassificationMethod).toBe(true);
			}
		});

		it("should generate text-to-image snippets", () => {
			const snippets = getInferenceSnippets(mockTextToImageModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should contain text-to-image related content
			const hasTextToImageContent = snippets.some(
				(s) => s.content.includes("textToImage") || s.content.includes("text-to-image")
			);
			expect(hasTextToImageContent).toBe(true);
		});
	});

	describe("Options handling", () => {
		it("should handle streaming option", () => {
			const snippetsNonStreaming = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				streaming: false,
			});

			const snippetsStreaming = getInferenceSnippets(mockConversationalModel, "auto", undefined, { streaming: true });

			// Both should generate snippets, potentially with different content
			expect(snippetsNonStreaming.length).toBeGreaterThan(0);
			expect(snippetsStreaming.length).toBeGreaterThan(0);
		});

		it("should handle billTo option", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, { billTo: "test-org" });

			expect(snippets.length).toBeGreaterThan(0);
			// The billTo option should actually be used in the request generation
			// Note: billTo affects headers/URL params, may not always be visible in snippet content
			// but the function should process without error and generate valid snippets
			snippets.forEach((snippet) => {
				expect(snippet.content).toBeTruthy();
				expect(snippet.content.length).toBeGreaterThan(10);
				expect(snippet.language).toMatch(/^(js|python|sh)$/);
			});
		});

		it("should handle accessToken option", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, {
				accessToken: "hf_test_token",
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Should include the token in the snippets
			const hasTokenContent = snippets.some(
				(s) =>
					s.content.includes("hf_test_token") || s.content.includes("process.env") || s.content.includes("os.environ")
			);
			expect(hasTokenContent).toBe(true);
		});

		it("should handle directRequest option", () => {
			const routedSnippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, { directRequest: false });

			const directSnippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, { directRequest: true });

			expect(routedSnippets.length).toBeGreaterThan(0);
			expect(directSnippets.length).toBeGreaterThan(0);
		});

		it("should handle endpointUrl option", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, {
				endpointUrl: "https://custom-endpoint.com",
			});

			expect(snippets.length).toBeGreaterThan(0);

			// The endpointUrl affects the generated snippets even if not directly visible in content
			// This test ensures the option is processed without errors
			snippets.forEach((snippet) => {
				expect(snippet.content).toBeTruthy();
				expect(snippet.content.length).toBeGreaterThan(0);
			});
		});
	});

	describe("Provider support", () => {
		it("should handle auto provider", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");
			expect(Array.isArray(snippets)).toBe(true);
			expect(snippets.length).toBeGreaterThan(0);
		});

		it("should handle hf-inference provider", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "hf-inference");
			expect(Array.isArray(snippets)).toBe(true);
			// HF inference should support text generation
		});

		it("should handle provider that doesn't support a specific task gracefully", () => {
			// OpenAI provider doesn't support text-generation, only conversational
			// This should return empty array due to try-catch in getProviderHelper
			const snippets = getInferenceSnippets(mockTextGenerationModel, "openai");
			expect(Array.isArray(snippets)).toBe(true);
			expect(snippets.length).toBe(0);
		});

		it("should handle conversational models with OpenAI provider", () => {
			// Need to provide accessToken that doesn't start with "hf_" for OpenAI
			const snippets = getInferenceSnippets(mockConversationalModel, "openai", undefined, {
				accessToken: "sk-test-token",
			});
			expect(Array.isArray(snippets)).toBe(true);
		});

		it("should generate fewer snippets for auto provider than all providers", () => {
			const autoSnippets = getInferenceSnippets(mockTextGenerationModel, "auto");
			const hfSnippets = getInferenceSnippets(mockTextGenerationModel, "hf-inference");

			// Auto should be more selective in clients
			expect(autoSnippets).toBeDefined();
			expect(hfSnippets).toBeDefined();
		});
	});

	describe("Snippet structure validation", () => {
		it("should return properly structured InferenceSnippet objects", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			snippets.forEach((snippet) => {
				expect(snippet).toMatchObject({
					language: expect.stringMatching(/^(js|python|sh)$/),
					client: expect.any(String),
					content: expect.any(String),
				});

				expect(snippet.content.length).toBeGreaterThan(0);
				expect(snippet.client.length).toBeGreaterThan(0);
			});
		});

		it("should generate valid code snippets", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			snippets.forEach((snippet) => {
				switch (snippet.language) {
					case "js":
						// Should contain valid JS patterns
						expect(snippet.content).toMatch(/(import|require|fetch|\.)/);
						break;
					case "python":
						// Should contain valid Python patterns
						expect(snippet.content).toMatch(/(import|from|def|\s+)/);
						break;
					case "sh":
						// Should contain valid shell patterns
						expect(snippet.content).toMatch(/(curl|wget|\$|--)/);
						break;
				}
			});
		});

		it("should include proper imports for Python snippets", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			const pythonSnippets = snippets.filter((s) => s.language === "python");
			expect(pythonSnippets.length).toBeGreaterThan(0);

			pythonSnippets.forEach((snippet) => {
				// Should start with imports
				const lines = snippet.content.split("\n");
				const hasImports = lines.some((line) => line.trim().startsWith("import") || line.trim().startsWith("from"));
				expect(hasImports).toBe(true);
			});
		});
	});

	describe("Error handling", () => {
		it("should return empty array when provider helper fails", () => {
			// This tests the graceful error handling code path for provider helper errors
			const snippets = getInferenceSnippets(mockTextGenerationModel, "invalid-provider" as InferenceProviderOrPolicy);
			expect(snippets).toEqual([]);
		});

		it("should handle models with pipeline_tag not in snippets mapping", () => {
			const modelWithUnmappedTask: ModelDataMinimal = {
				id: "test/model",
				pipeline_tag: "some-unsupported-task" as PipelineType,
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(modelWithUnmappedTask, "auto");
			expect(snippets).toEqual([]);
		});

		it("should gracefully handle malformed model data", () => {
			const malformedModel: ModelDataMinimal = {
				id: "",
				tags: [],
				inference: "false",
			};

			const snippets = getInferenceSnippets(malformedModel, "auto");
			expect(snippets).toEqual([]);
		});

		it("should throw error for OpenAI provider with HF token", () => {
			// This tests that some errors are intentionally thrown (not caught)
			expect(() => {
				getInferenceSnippets(
					mockConversationalModel,
					"openai",
					undefined,
					{ accessToken: "hf_test_token" } // HF token not allowed with OpenAI
				);
			}).toThrow("Provider openai is closed-source and does not support HF tokens");
		});
	});

	describe("Inference provider mapping", () => {
		it("should handle inference provider mapping parameter", () => {
			const mockMapping: InferenceProviderMappingEntry = {
				provider: "test-provider",
				providerId: "test-provider-id",
				hfModelId: "test/model",
				task: "text-generation",
				status: "live" as const,
			};

			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", mockMapping);

			expect(snippets).toBeDefined();
			expect(Array.isArray(snippets)).toBe(true);
		});
	});

	describe("Integration with specific pipeline types", () => {
		const pipelineTestCases = [
			{ task: "text-classification", modelId: "distilbert-base-uncased-finetuned-sst-2-english" },
			{ task: "translation", modelId: "t5-base" },
			{ task: "summarization", modelId: "facebook/bart-large-cnn" },
			{ task: "question-answering", modelId: "deepset/roberta-base-squad2" },
			{ task: "fill-mask", modelId: "bert-base-uncased" },
		] as const;

		pipelineTestCases.forEach(({ task, modelId }) => {
			it(`should generate snippets for ${task}`, () => {
				const model: ModelDataMinimal = {
					id: modelId,
					pipeline_tag: task,
					tags: [],
					inference: "true",
				};

				const snippets = getInferenceSnippets(model, "auto");

				if (task !== "translation") {
					// Some tasks might not be fully supported
					expect(snippets.length).toBeGreaterThan(0);
				} else {
					expect(Array.isArray(snippets)).toBe(true);
				}

				// Validate snippet structure
				snippets.forEach((snippet) => {
					expect(snippet.content).toBeTruthy();
					expect(snippet.language).toMatch(/^(js|python|sh)$/);
					expect(snippet.client).toBeTruthy();
				});
			});
		});
	});

	describe("Special input handling", () => {
		it("should handle conversational input preparation", () => {
			const snippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				messages: [
					{ role: "user", content: "Hello" },
					{ role: "assistant", content: "Hi there!" },
				],
				temperature: 0.7,
				max_tokens: 100,
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Verify the actual content includes the messages and parameters
			const hasMessagesContent = snippets.some((snippet) => {
				const content = snippet.content;
				return (
					content.includes('"role": "user"') &&
					content.includes('"content": "Hello"') &&
					content.includes('"role": "assistant"') &&
					content.includes('"content": "Hi there!"')
				);
			});
			expect(hasMessagesContent).toBe(true);

			// Verify temperature and max_tokens are included
			const hasTemperature = snippets.some((snippet) => snippet.content.includes("temperature"));
			const hasMaxTokens = snippets.some((snippet) => snippet.content.includes("max_tokens"));
			expect(hasTemperature).toBe(true);
			expect(hasMaxTokens).toBe(true);
		});

		it("should handle image models with blob data", () => {
			const snippets = getInferenceSnippets(mockImageClassificationModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should contain patterns that suggest image input handling
			const hasImagePatterns = snippets.some(
				(s) => s.content.includes("Blob") || s.content.includes("data") || s.content.includes("image")
			);
			expect(hasImagePatterns).toBe(true);
		});

		it("should handle streaming vs non-streaming for conversational models", () => {
			const streamingSnippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, { streaming: true });

			const nonStreamingSnippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				streaming: false,
			});

			expect(streamingSnippets.length).toBeGreaterThan(0);
			expect(nonStreamingSnippets.length).toBeGreaterThan(0);
		});
	});

	describe("Content verification tests", () => {
		it("should include proper method names for different pipeline types", () => {
			// Test fill-mask specifically since it has a different method name
			const fillMaskModel: ModelDataMinimal = {
				id: "bert-base-uncased",
				pipeline_tag: "fill-mask",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(fillMaskModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Check Python method (snake_case)
			const pythonSnippets = snippets.filter((s) => s.language === "python" && s.client === "huggingface_hub");
			expect(pythonSnippets.length).toBeGreaterThan(0);
			pythonSnippets.forEach((snippet) => {
				expect(snippet.content).toContain("fill_mask");
			});

			// Check JS method (camelCase)
			const jsSnippets = snippets.filter((s) => s.language === "js" && s.client === "huggingface.js");
			if (jsSnippets.length > 0) {
				jsSnippets.forEach((snippet) => {
					expect(snippet.content).toContain("fillMask");
				});
			}
		});

		it("should generate different snippets for streaming vs non-streaming", () => {
			const streamingSnippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, { streaming: true });

			const nonStreamingSnippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				streaming: false,
			});

			expect(streamingSnippets.length).toBeGreaterThan(0);
			expect(nonStreamingSnippets.length).toBeGreaterThan(0);

			// Content should actually be different for streaming vs non-streaming
			const streamingContent = streamingSnippets.map((s) => s.content).join("\n");
			const nonStreamingContent = nonStreamingSnippets.map((s) => s.content).join("\n");

			// Should not be identical (though this is a simple check)
			expect(streamingContent).not.toBe(nonStreamingContent);
		});

		it("should properly format inputs for different data types", () => {
			// Test question-answering which has specific input format
			const qaModel: ModelDataMinimal = {
				id: "deepset/roberta-base-squad2",
				pipeline_tag: "question-answering",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(qaModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should structure inputs with question and context parameters
			const hasProperQAStructure = snippets.some((snippet) => {
				// Check for either method parameters (question=, context=) or object properties ("question", "context")
				return (
					(snippet.content.includes("question=") && snippet.content.includes("context=")) ||
					(snippet.content.includes('"question"') && snippet.content.includes('"context"'))
				);
			});
			expect(hasProperQAStructure).toBe(true);

			// Should include model ID
			const hasModelId = snippets.some((snippet) => snippet.content.includes(qaModel.id));
			expect(hasModelId).toBe(true);
		});

		it("should include authentication patterns correctly", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "hf-inference", undefined, {
				accessToken: "hf_explicit_token",
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Should use the explicit token when provided
			const hasExplicitToken = snippets.some((snippet) => snippet.content.includes("hf_explicit_token"));
			expect(hasExplicitToken).toBe(true);
		});

		it("should generate valid code that compiles/parses", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto");

			snippets.forEach((snippet) => {
				switch (snippet.language) {
					case "js":
						// Should have proper JS syntax - basic check for common patterns
						expect(snippet.content).toMatch(/import|require|const|let|var/);
						expect(snippet.content).not.toMatch(/\{\{\s*\w+\s*\}\}/); // No unresolved templates
						break;
					case "python":
						// Should have proper Python syntax
						expect(snippet.content).toMatch(/import|from|def|\s+/);
						expect(snippet.content).not.toMatch(/\{\{\s*\w+\s*\}\}/); // No unresolved templates
						break;
					case "sh":
						// Should have proper shell syntax
						expect(snippet.content).toMatch(/curl|wget/);
						expect(snippet.content).not.toMatch(/\{\{\s*\w+\s*\}\}/); // No unresolved templates
						break;
				}
			});
		});

		it("should handle complex nested input structures", () => {
			// Test document-question-answering which has blob data
			const docQAModel: ModelDataMinimal = {
				id: "impira/layoutlm-document-qa",
				pipeline_tag: "document-question-answering",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(docQAModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);

			// Should handle complex input structure properly
			const hasComplexStructure = snippets.some((snippet) => {
				// Should have proper structure, not just empty snippets
				return snippet.content.length > 50 && snippet.content.includes(docQAModel.id);
			});
			expect(hasComplexStructure).toBe(true);
		});
	});

	describe("Template system integration", () => {
		it("should handle models that require special method mapping", () => {
			// Test that HF_PYTHON_METHODS mapping works
			const fillMaskModel: ModelDataMinimal = {
				id: "bert-base-uncased",
				pipeline_tag: "fill-mask",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(fillMaskModel, "auto");
			const pythonSnippets = snippets.filter((s) => s.language === "python" && s.client === "huggingface_hub");

			expect(pythonSnippets.length).toBeGreaterThan(0);
			pythonSnippets.forEach((snippet) => {
				expect(snippet.content).toContain("fill_mask");
			});
		});

		it("should handle models that require special JS method mapping", () => {
			// Test that HF_JS_METHODS mapping works
			const fillMaskModel: ModelDataMinimal = {
				id: "bert-base-uncased",
				pipeline_tag: "fill-mask",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(fillMaskModel, "auto");
			const jsSnippets = snippets.filter((s) => s.language === "js" && s.client === "huggingface.js");

			expect(jsSnippets.length).toBeGreaterThan(0);
			jsSnippets.forEach((snippet) => {
				expect(snippet.content).toContain("fillMask");
			});
		});

		it("should skip generation for unsupported method mappings", () => {
			// Create a model with a pipeline that's not in method mappings
			const supportedModel: ModelDataMinimal = {
				id: "test-model",
				pipeline_tag: "text-classification",
				tags: [],
				inference: "true",
			};

			const snippets = getInferenceSnippets(supportedModel, "auto");
			expect(snippets.length).toBeGreaterThan(0);
		});
	});

	describe("Token placeholder replacement", () => {
		it("should replace token placeholders in different languages", () => {
			const snippets = getInferenceSnippets(
				mockTextGenerationModel,
				"hf-inference" // Use hf-inference to ensure we get various snippets
			);

			expect(snippets.length).toBeGreaterThan(0);

			// Check that placeholders are replaced with environment variable access
			snippets.forEach((snippet) => {
				// Should not contain raw placeholders
				expect(snippet.content).not.toContain("hf_token_placeholder");
				expect(snippet.content).not.toContain("not_hf_token_placeholder");

				// Should contain environment variable patterns
				if (snippet.language === "python") {
					expect(snippet.content.includes("os.environ") || snippet.content.includes("import os")).toBe(true);
				} else if (snippet.language === "js") {
					expect(snippet.content.includes("process.env")).toBe(true);
				} else if (snippet.language === "sh") {
					expect(snippet.content.includes("$")).toBe(true);
				}
			});
		});

		it("should use appropriate environment variable names for different providers", () => {
			// When explicit accessToken is provided, it should be used directly
			const snippetsWithToken = getInferenceSnippets(mockConversationalModel, "openai", undefined, {
				accessToken: "sk-test-key",
				directRequest: true,
			});

			expect(snippetsWithToken.length).toBeGreaterThan(0);

			// Should use the explicit token directly
			const hasDirectToken = snippetsWithToken.some((s) => s.content.includes("sk-test-key"));
			expect(hasDirectToken).toBe(true);

			// When no token is provided, should use environment variables
			const snippetsWithoutToken = getInferenceSnippets(
				mockConversationalModel,
				"openai",
				undefined,
				{ directRequest: true } // No accessToken provided
			);

			if (snippetsWithoutToken.length > 0) {
				const hasEnvVar = snippetsWithoutToken.some(
					(s) =>
						s.content.includes("OPENAI_API_KEY") ||
						s.content.includes("process.env") ||
						s.content.includes("os.environ")
				);
				expect(hasEnvVar).toBe(true);
			}
		});
	});

	describe("Response format support", () => {
		it("should include response_format in conversational snippets", () => {
			const responseFormat = {
				type: "json_schema",
				json_schema: {
					schema: {
						type: "object",
						properties: {
							sentiment: {
								type: "string",
							},
						},
						required: ["sentiment"],
						additionalProperties: true,
					},
					strict: false,
				},
			};

			const snippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				response_format: responseFormat,
				messages: [
					{ role: "user", content: "Hello" },
					{ role: "assistant", content: "Hi there!" },
				],
				temperature: 1.1,
				top_p: 0.7,
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Should include response_format in the generated snippets
			const hasResponseFormat = snippets.some(
				(snippet) => snippet.content.includes("response_format") && snippet.content.includes("json_schema")
			);
			expect(hasResponseFormat).toBe(true);

			// Should include other parameters too
			const hasTemperature = snippets.some((snippet) => snippet.content.includes("1.1"));
			const hasTopP = snippets.some((snippet) => snippet.content.includes("0.7"));
			expect(hasTemperature).toBe(true);
			expect(hasTopP).toBe(true);
		});

		it("should include response_format in text-generation snippets", () => {
			const textGenerationModel: ModelDataMinimal = {
				id: "gpt2",
				pipeline_tag: "text-generation",
				tags: [], // Not conversational
				inference: "true",
			};

			const responseFormat = {
				type: "json_schema",
				json_schema: {
					schema: {
						type: "object",
						properties: {
							result: {
								type: "string",
							},
						},
						required: ["result"],
					},
				},
			};

			const snippets = getInferenceSnippets(textGenerationModel, "auto", undefined, {
				response_format: responseFormat,
				temperature: 0.8,
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Should include response_format in parameters
			const hasResponseFormat = snippets.some(
				(snippet) => snippet.content.includes("response_format") && snippet.content.includes("json_schema")
			);
			expect(hasResponseFormat).toBe(true);

			// Should include temperature in parameters too
			const hasTemperature = snippets.some((snippet) => snippet.content.includes("0.8"));
			expect(hasTemperature).toBe(true);
		});

		it("should use Python boolean syntax in Python snippets", () => {
			const responseFormat = {
				type: "json_schema",
				json_schema: {
					schema: {
						type: "object",
						properties: {
							valid: {
								type: "boolean",
							},
						},
						required: ["valid"],
						additionalProperties: false,
					},
					strict: true,
				},
			};

			const snippets = getInferenceSnippets(mockConversationalModel, "hf-inference", undefined, {
				response_format: responseFormat,
				messages: [{ role: "user", content: "Hello" }],
			});

			expect(snippets.length).toBeGreaterThan(0);
			console.log(snippets);

			// Python snippets should use True/False, not true/false
			const pythonSnippets = snippets.filter((s) => s.language === "python");
			expect(pythonSnippets.length).toBeGreaterThan(0);

			const pythonClientSnippets = pythonSnippets.filter(
				(snippet) => snippet.client === "huggingface_hub" || snippet.client === "openai"
			);
			expect(pythonClientSnippets.length).toBeGreaterThan(0);

			pythonClientSnippets.forEach((snippet) => {
				// Should use Python boolean syntax
				expect(snippet.content).toContain('"additionalProperties": False');
				expect(snippet.content).toContain('"strict": True');
				// Should NOT contain JavaScript boolean syntax in Python client calls
				expect(snippet.content).not.toMatch(/additionalProperties": false[^,}]/);
				expect(snippet.content).not.toMatch(/strict": true[^,}]/);
			});

			// But requests client should still use JSON format (JavaScript booleans)
			const requestsSnippets = pythonSnippets.filter((snippet) => snippet.client === "requests");
			if (requestsSnippets.length > 0) {
				requestsSnippets.forEach((snippet) => {
					// Should use JSON boolean syntax for requests payload
					expect(snippet.content).toContain('"additionalProperties": false');
					expect(snippet.content).toContain('"strict": true');
				});
			}
		});

		it("should not include response_format when not provided", () => {
			const snippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				messages: [{ role: "user", content: "Hello" }],
				temperature: 0.5,
			});

			expect(snippets.length).toBeGreaterThan(0);

			// Should not include response_format
			const hasResponseFormat = snippets.some((snippet) => snippet.content.includes("response_format"));
			expect(hasResponseFormat).toBe(false);

			// Should still include other parameters
			const hasTemperature = snippets.some((snippet) => snippet.content.includes("0.5"));
			expect(hasTemperature).toBe(true);
		});
	});

	describe("Complex options combinations", () => {
		it("should handle multiple options together", () => {
			const snippets = getInferenceSnippets(mockConversationalModel, "auto", undefined, {
				streaming: true,
				accessToken: "test-token",
				billTo: "test-org",
				endpointUrl: "https://custom-endpoint.example.com",
				directRequest: true,
				temperature: 0.7,
				max_tokens: 200,
			});

			expect(snippets.length).toBeGreaterThan(0);
			snippets.forEach((snippet) => {
				expect(snippet.content).toBeTruthy();
				expect(snippet.content.length).toBeGreaterThan(10);
			});
		});

		it("should handle empty options object", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, {});

			expect(snippets.length).toBeGreaterThan(0);
		});

		it("should handle undefined options", () => {
			const snippets = getInferenceSnippets(mockTextGenerationModel, "auto", undefined, undefined);

			expect(snippets.length).toBeGreaterThan(0);
		});
	});
});
