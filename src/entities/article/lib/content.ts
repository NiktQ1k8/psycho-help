import DOMPurify from 'dompurify';
import { HTML_SANITIZE_CONFIG } from '@/shared/lib/html';

export const getArticlePreview = (html: string) => {
  const content = DOMPurify.sanitize(html, {
    ...HTML_SANITIZE_CONFIG,
    RETURN_DOM_FRAGMENT: true,
  });

  content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((element) => {
    element.remove();
  });
  content.querySelectorAll('br, hr').forEach((element) => {
    element.replaceWith(' ');
  });
  content
    .querySelectorAll(
      'p, div, li, blockquote, pre, figure, figcaption, tr, td, th',
    )
    .forEach((element) => {
      element.append(' ');
    });

  return (content.textContent ?? '').replace(/\s+/g, ' ').trim();
};
