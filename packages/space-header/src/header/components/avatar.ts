export const Avatar = (username: string) => {
  const element = document.createElement("img");
  element.src = `https://huggingface.co/api/users/${username}/avatar`;

  element.style.width = "0.875rem";
  element.style.height = "0.875rem";
  element.style.borderRadius = "50%";
  element.style.flex = "none";
  element.style.marginRight = "0.375rem";

  return element;
}