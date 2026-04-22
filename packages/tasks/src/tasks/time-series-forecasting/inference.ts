/**
 * Inference code generated from the JSON schema spec in ./spec
 *
 * Using src/scripts/inference-codegen
 */
/**
 * Inputs for Time Series Forecasting inference. Each input series lies on a regular grid
 * defined by its `start` and `parameters.frequency`. Missing observations are encoded as
 * `null` inside `target`; clients with irregular data should resample before calling.
 */
export interface TimeSeriesForecastingInput {
	/**
	 * One or more historical time series to forecast. Output order matches input order.
	 */
	inputs: TimeSeriesForecastingInputItem[];
	parameters?: TimeSeriesForecastingParameters;
	[property: string]: unknown;
}
export interface TimeSeriesForecastingInputItem {
	/**
	 * Optional named covariates known over the forecast horizon. Each key maps to a 1D array of
	 * length `parameters.prediction_length`.
	 */
	future_covariates?: {
		[key: string]: number[];
	};
	/**
	 * Opaque per-series metadata. Echoed verbatim in the corresponding output item. Not
	 * consumed by any model. Maximum 4KB per item.
	 */
	metadata?: {
		[key: string]: unknown;
	};
	/**
	 * Optional named covariates observed over the historical window. Each key maps to a 1D
	 * array aligned 1:1 with the time axis of `target`. Missing values are encoded as `null`.
	 * Models that don't support covariates silently ignore this field.
	 */
	past_covariates?: {
		[key: string]: (number | null)[];
	};
	/**
	 * Optional ISO-8601 timestamp of the first observation. Combined with
	 * `parameters.frequency` it defines the time index for both the input and the returned
	 * forecast timestamps. If omitted, observations are treated as an integer sequence and the
	 * response has no `timestamps`.
	 */
	start?: Date;
	/**
	 * Optional static (time-invariant) numeric features for the series.
	 */
	static_covariates?: {
		[key: string]: number;
	};
	/**
	 * Historical values on a regular grid. Always a 2D array of shape
	 * [num_timesteps][num_channels]. Univariate series use a length-1 channel axis. Missing
	 * observations are encoded as `null`.
	 */
	target: Array<(number | null)[]>;
	[property: string]: unknown;
}
export interface TimeSeriesForecastingParameters {
	/**
	 * Optional pandas offset alias defining the grid spacing. Common values: 's' (second),
	 * 'min' (minute), 'h' (hour), 'D' (day), 'B' (business day), 'W' (week), 'ME' / 'MS' (month
	 * end/start), 'QE' / 'QS' (quarter), 'YE' / 'YS' (year). Accepts multipliers and anchors
	 * (e.g. '15min', 'W-MON'). When provided alongside a per-item `start`, the response
	 * includes `timestamps`. Servers reject aliases they don't support.
	 */
	frequency?: string;
	/**
	 * For sample-based probabilistic models, the number of sample paths to draw. Ignored by
	 * models that don't produce samples. May be combined with `quantile_levels`.
	 */
	num_samples?: number;
	/**
	 * Number of future timesteps to forecast. Defaults to the model's native horizon.
	 */
	prediction_length?: number;
	/**
	 * Quantile levels in (0, 1) to return alongside the mean. Omit to receive only the mean.
	 */
	quantile_levels?: number[];
	[property: string]: unknown;
}
/**
 * Outputs of inference for the Time Series Forecasting task. Entries in `outputs`
 * correspond 1:1 with the request's `inputs` in order.
 */
export interface TimeSeriesForecastingOutput {
	outputs: TimeSeriesForecastingOutputItem[];
	[property: string]: unknown;
}
export interface TimeSeriesForecastingOutputItem {
	/**
	 * Point forecast. Same shape as the corresponding input's `target`: outer dimension is time
	 * (length = prediction_length), inner dimension is channels.
	 */
	mean: Array<number[]>;
	/**
	 * Verbatim echo of the input item's `metadata`, if set.
	 */
	metadata?: {
		[key: string]: unknown;
	};
	/**
	 * Optional per-quantile forecasts, sorted ascending by level. Each entry has the same shape
	 * as `mean`.
	 */
	quantile_predictions?: QuantilePrediction[];
	/**
	 * Optional sample trajectories from probabilistic models. Outer dimension is the sample
	 * index; each sample has the same shape as `mean`. Present when `parameters.num_samples`
	 * was supplied and the model produces samples.
	 */
	samples?: Array<Array<number[]>>;
	/**
	 * Optional ISO-8601 timestamps for each forecast step. Present when the input item had
	 * `start` and `parameters.frequency` was supplied.
	 */
	timestamps?: Date[];
	[property: string]: unknown;
}
export interface QuantilePrediction {
	/**
	 * Quantile level in (0, 1).
	 */
	level: number;
	/**
	 * Quantile forecast with the same shape as `mean`.
	 */
	values: Array<number[]>;
	[property: string]: unknown;
}
