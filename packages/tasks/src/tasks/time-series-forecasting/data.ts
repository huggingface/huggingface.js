import type { TaskDataCustom } from "../index.js";

const taskData: TaskDataCustom = {
	datasets: [
		{
			description:
				"A curated collection of ~30 time-series datasets from diverse domains used to pretrain and evaluate foundation models.",
			id: "monash_tsf",
		},
		{
			description:
				"A large-scale benchmark for evaluating probabilistic time-series forecasters across many domains and frequencies.",
			id: "Salesforce/gift-eval",
		},
		{
			description:
				"The GluonTS reference datasets for electricity load, traffic, and exchange rates at multiple frequencies.",
			id: "autogluon/chronos_datasets",
		},
	],
	demo: {
		inputs: [
			{
				label: "Input series (univariate, 10 observations)",
				content: "[120, 135, 142, 158, 163, 170, 185, 190, 198, 210]",
				type: "text",
			},
		],
		outputs: [
			{
				label: "Forecast mean (12-step horizon)",
				content: "[217.5, 224.2, 230.8, 237.1, 243.3, 249.6, 255.5, 261.2, 266.7, 271.9, 276.9, 281.7]",
				type: "text",
			},
		],
	},
	metrics: [
		{
			description:
				"Mean Absolute Scaled Error, which scales MAE by an in-sample naive forecast so it is comparable across series with different magnitudes.",
			id: "mase",
		},
		{
			description:
				"Continuous Ranked Probability Score, which evaluates probabilistic forecasts by measuring the difference between forecast and observation CDFs.",
			id: "crps",
		},
		{
			description:
				"Weighted Quantile Loss, a common aggregation of pinball losses for probabilistic forecasts at specified quantile levels.",
			id: "wql",
		},
	],
	models: [
		{
			description: "Fast, compact T5-based probabilistic forecaster with strong zero-shot performance.",
			id: "amazon/chronos-bolt-small",
		},
		{
			description: "Latest-generation Chronos that supports multivariate inputs and covariates.",
			id: "amazon/chronos-2",
		},
		{
			description:
				"Universal forecaster with a masked encoder architecture; supports multiple frequencies and covariates.",
			id: "Salesforce/moirai-1.1-R-base",
		},
		{
			description: "Decoder-only time-series foundation model from Google with strong zero-shot accuracy.",
			id: "google/timesfm-2.5-200m-pytorch",
		},
		{
			description: "Tiny time-mixer model from IBM, designed for very fast forecasting with compact compute footprint.",
			id: "ibm-granite/granite-timeseries-ttm-r2",
		},
		{
			description: "Llama-based time-series foundation model that outputs Student-T distribution parameters per step.",
			id: "time-series-foundation-models/Lag-Llama",
		},
	],
	spaces: [],
	summary:
		"Time series forecasting predicts future values of a sequence given its history. Modern foundation models handle univariate and multivariate series in zero-shot or few-shot settings, returning either point forecasts, probabilistic quantile bands, or full sample trajectories.",
	widgetModels: ["amazon/chronos-bolt-small"],
};

export default taskData;
