## Use Cases

Time series forecasting is the task of predicting future values of a sequence given its history. It powers a huge range of practical applications:

### Demand Forecasting

Retailers, e-commerce platforms, and supply chains use forecasting models to predict demand for products across stores and time windows, which informs inventory decisions and staffing.

### Energy & Resource Planning

Utilities forecast electricity load, wind and solar generation, and gas consumption to balance grids and schedule generation capacity.

### Financial Forecasting

Revenue, cash flow, and market indicators are forecast to drive planning, risk, and pricing decisions. Probabilistic forecasts (quantiles or sample paths) let teams reason about tails rather than just point estimates.

### Operations & IT

Capacity planning, anomaly detection, and on-call staffing use short-horizon forecasts of traffic, latency, and resource utilization.

## Task Variants

- **Univariate forecasting**: a single time series per input. This is the most common case.
- **Multivariate forecasting**: multiple correlated channels within a single series (e.g. OHLCV for a financial asset, multiple sensor channels from one device). Encoded as a 2D `target` with more than one channel.
- **Forecasting with covariates**: past or future exogenous variables (weather, promotions, calendar features) that inform the prediction. Some models consume them; others ignore them.

## Inference Endpoints

The Hub hosts a growing catalog of [time-series foundation models](https://huggingface.co/models?pipeline_tag=time-series-forecasting&sort=downloads) that you can call via Inference Providers without loading weights yourself:

```python
from huggingface_hub import InferenceClient

client = InferenceClient(api_key="hf_...")

result = client.time_series_forecasting(
    model="amazon/chronos-bolt-small",
    inputs=[
        {
            # Always 2D: [num_timesteps][num_channels]. Univariate = length-1 channel axis.
            "target": [[120], [135], [142], [158], [163], [170], [185], [190], [198], [210]],
            "metadata": {"item_id": "store_42"},
        }
    ],
    parameters={
        "prediction_length": 12,
        "quantile_levels": [0.1, 0.5, 0.9],
    },
)

for output in result["outputs"]:
    print("mean:", [row[0] for row in output["mean"]])
    for qp in output.get("quantile_predictions", []):
        print(f"  q{qp['level']}:", [row[0] for row in qp["values"]])
```

## Direct Inference

You can also run time series foundation models locally using their native libraries. Examples include `chronos-forecasting`, `uni2ts` (Moirai), `timesfm`, `lag-llama`, `darts`, and `gluonts`. Most of these follow the input shape described above — a 2D array of observations per series — with library-specific helpers for wrapping pandas DataFrames.

## Input Shape

Requests always pass a list of **structured series objects** in `inputs`, rather than a bare array. Each item's `target` is a 2D array `[num_timesteps][num_channels]`:

- **Univariate** series: each timestep has a length-1 channel axis, e.g. `[[120], [135], [142]]`.
- **Multivariate** series: each timestep has one value per channel, e.g. `[[o, h, l, c], [o, h, l, c], ...]`.
- **Missing observations**: encoded as JSON `null` inline, e.g. `[[120], [null], [142]]`.

This shape matches how the dominant time-series libraries represent batches (Darts, GluonTS, AWS SageMaker Chronos) and cleanly handles ragged lengths and per-series optional fields like covariates and metadata.

## Uncertainty

The output `mean` is always present as a point forecast. Two optional uncertainty channels are also available:

- **`quantile_predictions`**: an array of `{level, values}` objects sorted ascending by level, each `values` matching the shape of `mean`. Ask for them via `parameters.quantile_levels`.
- **`samples`**: sample trajectories from probabilistic models, shape `[num_samples][prediction_length][num_channels]`. Ask for them via `parameters.num_samples`. Present only for models that produce samples natively.

Both can coexist in a single response; a deterministic model returns `mean` only.

## Useful Resources

- [Probabilistic Time Series Forecasting with 🤗 Transformers](https://huggingface.co/blog/time-series-transformers)
- [Patch Time Series Transformer in Hugging Face](https://huggingface.co/blog/patchtst)
- [Monash Time Series Forecasting Repository](https://forecastingdata.org/)
- [GluonTS](https://ts.gluon.ai/)
- [Darts](https://unit8co.github.io/darts/)
