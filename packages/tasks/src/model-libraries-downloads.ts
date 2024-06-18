/**
 * This file contains the (simplified) types used
 * to represent queries that are made to Elastic
 * in order to count number of model downloads
 *
 * Read this doc about download stats on the Hub:
 *
 * https://huggingface.co/docs/hub/models-download-stats
 * Available fields:
 *  - path: the complete path of the model
 *  - path_prefix: the prefix of the path of the model
 *  - path_extension: the extension of the path of the model
 *  - path_filename: the extension of the path of the model
 * see also:
 * https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html
 */

export type ElasticSearchQuery = string;
