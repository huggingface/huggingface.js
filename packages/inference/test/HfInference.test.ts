// @ts-ignore
import { jest } from "@jest/globals"; // 3 minute

import { HfInference} from "../src";
import { readFileSync } from "fs";

jest.setTimeout(60000 * 3);

if (!process.env.HF_ACCESS_TOKEN) {
	throw new Error("Set HF_ACCESS_TOKEN in the env to run the tests")
}
 
describe("HfInference", () => {
	// Individual tests can be ran without providing an api key, however running all tests without an api key will result in rate limiting error.
	const hf = new HfInference(process.env.HF_ACCESS_TOKEN);
	it("throws error if model does not exist", () => {
		expect(
			hf.fillMask({
				model:  "this-model-does-not-exist-123",
				inputs: "[MASK] world!",
			})
		).rejects.toThrowError("Model this-model-does-not-exist-123 does not exist");
	});
	it("fillMask", async () => {
		expect(
			await hf.fillMask({
				model:  "bert-base-uncased",
				inputs: "[MASK] world!",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					score:     expect.any(Number),
					token:     expect.any(Number),
					token_str: expect.any(String),
					sequence:  expect.any(String),
				}),
			])
		);
	});
	it("summarization", async () => {
		expect(
			await hf.summarization({
				model: "facebook/bart-large-cnn",
				inputs:
					"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building, and the tallest structure in Paris. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world, a title it held for 41 years until the Chrysler Building in New York City was finished in 1930.",
				parameters: {
					max_length: 100,
				},
			})
		).toEqual({
			summary_text:
				"The tower is 324 metres (1,063 ft) tall, about the same height as an 81-storey building. Its base is square, measuring 125 metres (410 ft) on each side. During its construction, the Eiffel Tower surpassed the Washington Monument to become the tallest man-made structure in the world.",
		});
	});
	it("questionAnswer", async () => {
		expect(
			await hf.questionAnswer({
				model:  "deepset/roberta-base-squad2",
				inputs: {
					question: "What is the capital of France?",
					context:  "The capital of France is Paris.",
				},
			})
		).toMatchObject({
			answer: "Paris",
			score:  expect.any(Number),
			start:  expect.any(Number),
			end:    expect.any(Number),
		});
	});
	it("table question answer", async () => {
		expect(
			await hf.tableQuestionAnswer({
				model:  "google/tapas-base-finetuned-wtq",
				inputs: {
					query: "How many stars does the transformers repository have?",
					table: {
						Repository:             ["Transformers", "Datasets", "Tokenizers"],
						Stars:                  ["36542", "4512", "3934"],
						Contributors:           ["651", "77", "34"],
						"Programming language": ["Python", "Python", "Rust, Python and NodeJS"],
					},
				},
			})
		).toMatchObject({
			answer:      "AVERAGE > 36542",
			coordinates: [[0, 1]],
			cells:       ["36542"],
			aggregator:  "AVERAGE",
		});
	});
	it("textClassification", async () => {
		expect(
			await hf.textClassification({
				model:  "distilbert-base-uncased-finetuned-sst-2-english",
				inputs: "I like you. I love you.",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					label: expect.any(String),
					score: expect.any(Number),
				}),
			])
		);
	});
	it("textGeneration", async () => {
		expect(
			await hf.textGeneration({
				model:  "gpt2",
				inputs: "The answer to the universe is",
			})
		).toMatchObject({
			generated_text: expect.any(String),
		});
	});
	it("tokenClassification", async () => {
		expect(
			await hf.tokenClassification({
				model:  "dbmdz/bert-large-cased-finetuned-conll03-english",
				inputs: "My name is Sarah Jessica Parker but you can call me Jessica",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					entity_group: expect.any(String),
					score:        expect.any(Number),
					word:         expect.any(String),
					start:        expect.any(Number),
					end:          expect.any(Number),
				}),
			])
		);
	});
	it("translation", async () => {
		expect(
			await hf.translation({
				model:  "t5-base",
				inputs: "My name is Wolfgang and I live in Berlin",
			})
		).toMatchObject({
			translation_text: "Mein Name ist Wolfgang und ich lebe in Berlin",
		});
	});
	it("zeroShotClassification", async () => {
		expect(
			await hf.zeroShotClassification({
				model:  "facebook/bart-large-mnli",
				inputs: [
					"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
				],
				parameters: { candidate_labels: ["refund", "legal", "faq"] },
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					sequence:
						"Hi, I recently bought a device from your company but it is not working as advertised and I would like to get reimbursed!",
					labels: ["refund", "faq", "legal"],
					scores: [0.877787709236145, 0.10522633045911789, 0.01698593981564045],
				}),
			])
		);
	});
	it("conversational", async () => {
		expect(
			await hf.conversational({
				model:  "microsoft/DialoGPT-large",
				inputs: {
					past_user_inputs:    ["Which movie is the best ?"],
					generated_responses: ["It is Die Hard for sure."],
					text:                "Can you explain why ?",
				},
			})
		).toMatchObject({
			generated_text: "It's the best movie ever.",
			conversation:   {
				past_user_inputs:    ["Which movie is the best ?", "Can you explain why ?"],
				generated_responses: ["It is Die Hard for sure.", "It's the best movie ever."],
			},
			warnings: ["Setting `pad_token_id` to `eos_token_id`:50256 for open-end generation."],
		});
	});
	it("featureExtraction", async () => {
		expect(
			await hf.featureExtraction({
				model:  "sentence-transformers/paraphrase-xlm-r-multilingual-v1",
				inputs: {
					source_sentence: "That is a happy person",
					sentences:       ["That is a happy dog", "That is a very happy person", "Today is a sunny day"],
				},
			})
		).toEqual([expect.any(Number), expect.any(Number), expect.any(Number)]);
	});
	it("automaticSpeechRecognition", async () => {
		expect(
			await hf.automaticSpeechRecognition({
				model: "facebook/wav2vec2-large-960h-lv60-self",
				data:  readFileSync("test/sample1.flac"),
			})
		).toMatchObject({
			text: "GOING ALONG SLUSHY COUNTRY ROADS AND SPEAKING TO DAMP AUDIENCES IN DRAUGHTY SCHOOLROOMS DAY AFTER DAY FOR A FORTNIGHT HE'LL HAVE TO PUT IN AN APPEARANCE AT SOME PLACE OF WORSHIP ON SUNDAY MORNING AND HE CAN COME TO US IMMEDIATELY AFTERWARDS",
		});
	});
	it("audioClassification", async () => {
		expect(
			await hf.audioClassification({
				model: "superb/hubert-large-superb-er",
				data:  readFileSync("test/sample1.flac"),
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					score: expect.any(Number),
					label: expect.any(String),
				}),
			])
		);
	});
	it("imageClassification", async () => {
		expect(
			await hf.imageClassification({
				data:  readFileSync("test/cheetah.png"),
				model: "google/vit-base-patch16-224",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					score: expect.any(Number),
					label: expect.any(String),
				}),
			])
		);
	});
	it("objectDetection", async () => {
		expect(
			await hf.imageClassification({
				data:  readFileSync("test/cats.png"),
				model: "facebook/detr-resnet-50",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					score: expect.any(Number),
					label: expect.any(String),
					box:   expect.objectContaining({
						xmin: expect.any(Number),
						ymin: expect.any(Number),
						xmax: expect.any(Number),
						ymax: expect.any(Number),
					}),
				}),
			])
		);
	});
	xit("imageSegmentation", async () => {
		expect(
			await hf.imageClassification({
				data:  readFileSync("test/cats.png"),
				model: "facebook/detr-resnet-50-panoptic",
			})
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					score: expect.any(Number),
					label: expect.any(String),
					mask:  expect.any(String),
				}),
			])
		);
	});
});
