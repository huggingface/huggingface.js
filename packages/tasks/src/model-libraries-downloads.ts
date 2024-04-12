/**
 * This file contains the (simplified) types used
 * to represent queries that are made to Elastic
 * in order to count number of model downloads
 *
 * Read this doc about download stats on the Hub:
 *
 * https://huggingface.co/docs/hub/models-download-stats
 *
 * see also:
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
 */

export type ElasticBoolQueryFilter =
	// match a single filename
	| { term?: { path: string } }
	// match multiple possible filenames
	| { terms?: { path: string[] } }
	// match a wildcard
	| { wildcard?: { path: string } };
