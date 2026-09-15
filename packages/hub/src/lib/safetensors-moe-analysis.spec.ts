import { assert, describe, it } from "vitest";

import { computeMoeInfoFromHeaders } from "./safetensors-moe-analysis";
import type { ModelConfig, SafetensorsFileHeader } from "./safetensors-analysis-types";

describe("computeMoeInfoFromHeaders", () => {
	const stackedHeader: SafetensorsFileHeader = {
		"model.embed_tokens.weight": { dtype: "F32", shape: [20], data_offsets: [0, 0] },
		"model.layers.0.mlp.experts.weight": { dtype: "F32", shape: [4, 10], data_offsets: [0, 0] },
	};

	const analyzeStacked = (config: unknown) => computeMoeInfoFromHeaders([stackedHeader], config as ModelConfig);

	it("requires a coherent pair of positive integer config values", () => {
		assert.strictEqual(analyzeStacked({ num_experts_per_tok: 1, text_config: { num_local_experts: 4 } }), undefined);
		assert.strictEqual(analyzeStacked({ num_experts_per_tok: 2, num_local_experts: 4.5 }), undefined);
		assert.deepStrictEqual(
			analyzeStacked({
				num_experts_per_tok: "invalid",
				num_local_experts: 4,
				text_config: { num_experts_per_tok: 2, num_local_experts: 4 },
			}),
			{
				numExperts: 4,
				topK: 2,
				perExpert: 10,
				alwaysActive: 20,
				active: 40,
				hasSharedExpert: false,
			},
		);
		assert.strictEqual(analyzeStacked({ num_selected_experts: 1, num_experts: 4 })?.active, 30);
		assert.strictEqual(analyzeStacked({ ffn_config: { moe_top_k: 2, moe_num_experts: 4 } })?.active, 40);
	});

	it("requires a complete, in-range per-expert tensor set across headers", () => {
		const analyzeExpertIds = (expertIds: number[]) => {
			const headers: SafetensorsFileHeader[] = [
				{
					"model.embed_tokens.weight": { dtype: "F32", shape: [11], data_offsets: [0, 0] },
					"model.layers.0.mlp.router.weight": { dtype: "F32", shape: [4], data_offsets: [0, 0] },
					"model.layers.0.mlp.shared_expert.weight": { dtype: "F32", shape: [7], data_offsets: [0, 0] },
					"model.layers.0.mlp.shared_experts.weight": { dtype: "F32", shape: [5], data_offsets: [0, 0] },
				},
				...expertIds.map(
					(expertId): SafetensorsFileHeader => ({
						[`model.layers.0.mlp.experts.${expertId}.weight`]: {
							dtype: "F32",
							shape: [6],
							data_offsets: [0, 0],
						},
					}),
				),
			];
			return computeMoeInfoFromHeaders(headers, { num_experts_per_tok: 2, num_local_experts: 4 });
		};

		assert.deepStrictEqual(analyzeExpertIds([0, 1, 2, 3]), {
			numExperts: 4,
			topK: 2,
			perExpert: 6,
			alwaysActive: 27,
			active: 39,
			hasSharedExpert: true,
		});
		assert.strictEqual(analyzeExpertIds([0, 1, 2]), undefined);
		assert.strictEqual(analyzeExpertIds([0, 1, 2, 4]), undefined);
	});
});
