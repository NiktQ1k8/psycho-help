import { DateTime, Settings } from 'luxon';

export const MOSCOW_TZ = 'Europe/Moscow';
Settings.defaultZone = MOSCOW_TZ;
Settings.defaultLocale = 'ru';

// ISO с часовым поясом переводится в Москву; без пояса считается московским.
export const moscowDate = (value?: string) =>
  value === undefined ? DateTime.now() : DateTime.fromISO(value);

export const toApiDate = (date: DateTime): string => date.toUTC().toISO()!;
