## Use Cases

Text-to-3D models can be used in a wide variety applications that require 3D, such as games, animation, design, architecture, engineering, marketing, and more.

This task is similar to the [image-to-3d](https://huggingface.co/tasks/image-to-3d) task, but takes text input instead of image input. In practice, this is often equivalent to a combination of [text-to-image](https://huggingface.co/tasks/text-to-image) and [image-to-3d](https://huggingface.co/tasks/image-to-3d).

### Meshes

Meshes are the standard representation of 3D in industry.

Meshes can be in `.obj`, `.glb`, `.stl`, or `.gltf` format. Other formats are allowed, but won't be rendered in the gradio [Model3D](https://www.gradio.app/docs/gradio/model3d) component.

### Splats

[Gaussian Splatting](https://huggingface.co/blog/gaussian-splatting) is a differentiable rasterization technique that represents 3D as fuzzy points.

Splats can be in `.ply` or `.splat` format. They can be rendered in the gradio [Model3D](https://www.gradio.app/docs/gradio/model3d) component using the [gsplat.js](https://github.com/huggingface/gsplat.js) library.

## Useful Resources

- [ML for 3D Course](https://huggingface.co/learn/ml-for-3d-course)
- [3D Arena Leaderboard](https://huggingface.co/spaces/dylanebert/3d-arena)
