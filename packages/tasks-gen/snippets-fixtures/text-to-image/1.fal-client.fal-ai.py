import fal_client

result = fal_client.subscribe(
	# replace with correct id from fal.ai
	"fal-ai/<fal-ai alias for black-forest-labs/FLUX.1-schnell>",
	arguments={
		"prompt": "Astronaut riding a horse",
	},
)
print(result)
