if (!process.env.HF_ACCESS_TOKEN) {
	const originalFetch = global.fetch;

	global.fetch = (...args) => {
		console.log(args);
		return originalFetch(...args);
	};
}

async function run() {
	await fetch("https://aschen.tech");
}

run();
