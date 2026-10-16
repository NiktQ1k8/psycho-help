import type { DateTime } from 'luxon';
import { MOSCOW_TZ, moscowDate } from '@/shared/lib/date-time';

export const CONSULTATION_START_HOUR = 9;
export const CONSULTATION_END_HOUR = 19;
const LAST_START_HOUR = CONSULTATION_END_HOUR - 1;

export const CONSULTATION_TIME_HINT =
  'Приём с 09:00 до 19:00 по Москве. Начало встреч — только в целый час, последняя запись — в 18:00.';

export const CONSULTATION_TIMES = Array.from(
  { length: LAST_START_HOUR - CONSULTATION_START_HOUR + 1 },
  (_, i) => `${String(CONSULTATION_START_HOUR + i).padStart(2, '0')}:00`,
);

export const isConsultationTimeValid = (date: DateTime): boolean => {
  const moscow = date.setZone(MOSCOW_TZ);
  return (
    date.isValid &&
    date.toMillis() > moscowDate().toMillis() &&
    moscow.hour >= CONSULTATION_START_HOUR &&
    moscow.hour <= LAST_START_HOUR &&
    moscow.minute === 0 &&
    moscow.second === 0 &&
    moscow.millisecond === 0
  );
};

export const disabledConsultationTime = () => ({
  disabledHours: () =>
    Array.from({ length: 24 }, (_, hour) => hour).filter(
      (hour) => hour < CONSULTATION_START_HOUR || hour > LAST_START_HOUR,
    ),
  disabledMinutes: () => Array.from({ length: 59 }, (_, i) => i + 1),
});
