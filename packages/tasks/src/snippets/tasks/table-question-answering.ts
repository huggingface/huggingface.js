export default (): string =>
	`{
		"query": "How many stars does the transformers repository have?",
		"table": {
			"Repository": ["Transformers", "Datasets", "Tokenizers"],
			"Stars": ["36542", "4512", "3934"],
			"Contributors": ["651", "77", "34"],
			"Programming language": [
				"Python",
				"Python",
				"Rust, Python and NodeJS"
			]
		}
	}`;
