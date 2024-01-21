## Use Cases

### Filtering an Image

When filtering for an image, the generated masks might serve as an initial filter to eliminate irrelevant information. For instance, when monitoring vegetation in satellite imaging, mask generation models identify green spots, highlighting the relevant region of the image.

### Pre-processing

Generating masks that can to separate background and foreground (or other interesting properties) in an image can be done to facilitate learning, especially in semi- or unsupervised learning.

### Human-in-the-loop

For applications where humans are in the loop, masks highlight certain region of images for humans to validate. 

## Task Variants

### Binary Masks

In binary masks, one region is labeled with ones (1) while another region is labeled with zeroes (0). 
In this case, matrix multiplication easily retrieves the region of interest.

### Non-Binary Masks

In non-binary masks, the mask contains more than two classes. This is useful when more than one mask is generated for the same image since it makes dealing with the image easier. If there are non-overlapping labeled regions, it is straightforward to recover the mask by selecting which pixels in the image have the corresponding region. If they overlap, a unique way to recover a region might have to be put in place.

### Segmentation Mask

Segmentation masks are the result of a segmentation algorithm. You can learn more about segmentation on its [task page](https://huggingface.co/tasks/image-segmentation).


### Manually Labeled Mask

Manually Labeled Mask are mask that have been generated, partially or entirely, by human annotations. 

## Inference

This section should have useful information about how to pull a model from Hugging Face Hub which is a part of a library specialized in a task and use it.

## Useful Resources

Would you like to learn more about mask generation? Great! Here you can find some curated resources that you may find helpful!

- [Simple mask generation using thresholding in Scikit-learn](https://scikit-image.org/docs/stable/auto_examples/segmentation/plot_thresholding.html)
