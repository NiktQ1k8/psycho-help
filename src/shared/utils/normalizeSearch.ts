export const normalizeSearch = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLowerCase().replace(/ё/g, 'е');
