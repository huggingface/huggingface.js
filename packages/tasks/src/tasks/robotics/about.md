## Use Cases

### Manipulation from demonstrations

A policy trained on teleoperated episodes controls an arm from camera images, joint state and an instruction such as "put the mug on the plate". Inference runs once per control tick and returns a chunk of future actions.

### Evaluation and rollouts

The same inference API serves evaluation in simulation or on recorded observations, where many robots or environments are stepped per tick.

## Inference

Inputs are the observation: images keyed by camera name (base64 or URL), the state vector and the instruction; optional parameters are a seed for the policy's own random draws and the number of actions to return. The output is the action chunk, one row per future control step.

```python
from huggingface_hub import InferenceClient

client = InferenceClient(provider="zenedgex")
out = client.robotics(
    model="lerobot/smolvla_base",
    inputs={"images": {"camera": image_b64}, "state": [0.1, -0.3, 0.8, 0.0, 0.2, 0.0], "instruction": "pick up the red cube"},
)
actions = out["actions"]  # chunk x action_dim
```

## Useful Resources

- [LeRobot](https://github.com/huggingface/lerobot): training and evaluating robot policies on the Hub.
