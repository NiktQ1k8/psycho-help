import DOMPurify from 'dompurify';

export const HTML_SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style'],
  FORBID_ATTR: ['style'],
};

export const sanitizeHtml = (html: string) =>
  DOMPurify.sanitize(html, HTML_SANITIZE_CONFIG);
