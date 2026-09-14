const FORBIDDEN_TAGS = 'script, iframe, object, embed';

export const sanitizeHtml = (html: string): string => {
  if (!html) {
    return '';
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  doc.body.querySelectorAll(FORBIDDEN_TAGS).forEach((element) => element.remove());

  doc.body.querySelectorAll('*').forEach((element) => {
    for (const { name, value } of [...element.attributes]) {
      const attr = name.toLowerCase();
      const url = value.replace(/\s+/g, '').toLowerCase();
      const isEventHandler = attr.startsWith('on');
      const isUnsafeUrl = (attr === 'href' || attr === 'src') && url.startsWith('javascript:');

      if (isEventHandler || isUnsafeUrl) {
        element.removeAttribute(name);
      }
    }
  });

  return doc.body.innerHTML;
};
