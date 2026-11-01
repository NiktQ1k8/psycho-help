import type { DateTime } from 'luxon';
import { moscowDate } from '@/shared/lib/date-time';

export const CONSULTATION_START_HOUR = 9;
export const CONSULTATION_END_HOUR = 19;

export const isConsultationTimeValid = (date: DateTime): boolean =>
  date.isValid && date.toMillis() > moscowDate().toMillis();
