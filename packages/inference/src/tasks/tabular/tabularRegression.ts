import { getProviderHelper } from "../../lib/getProviderHelper";
import type { BaseArgs, Options } from "../../types";
import { innerRequest } from "../../utils/request";

export type TabularRegressionArgs = BaseArgs & {
	inputs: {
		/**
		 * A table of data represented as a dict of list where entries are headers and the lists are all the values, all lists must have the same size.
		 */
		data: Record<string, string[]>;
	};
};

/**
 * a list of predicted values for each row
 */
export type TabularRegressionOutput = number[];

/**
 * Predicts target value for a given set of features in tabular form.
 * Typically, you will want to train a regression model on your training data and use it with your new data of the same format.
 * Example model: scikit-learn/Fish-Weight
 */
export async function tabularRegression(
	args: TabularRegressionArgs,
	options?: Options
): Promise<TabularRegressionOutput> {
	const providerHelper = getProviderHelper(args.provider ?? "hf-inference", "tabular-regression");
	const { data: res } = await innerRequest<TabularRegressionOutput>(args, providerHelper, {
		...options,
		task: "tabular-regression",
	});
	return providerHelper.getResponse(res);
}
