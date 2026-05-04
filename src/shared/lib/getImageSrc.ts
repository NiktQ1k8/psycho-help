export const getImageSrc = (image: string): string => {
  if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(image)) {
    return image;
  }

  const baseUrl = import.meta.env.VITE_REACT_APP_IMAGE_URL;
  return baseUrl ? `${baseUrl.replace(/\/?$/, '/')}${image}` : image;
};
