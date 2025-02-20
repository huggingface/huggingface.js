import fal_client

result = fal_client.subscribe(
	"<fal-ai alias for black-forest-labs/FLUX.1-schnell>",
	arguments={
		"prompt": "Astronaut riding a horse",
	},
)
print(result)
