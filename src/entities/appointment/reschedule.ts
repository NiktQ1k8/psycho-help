import { moscowDate } from '@/shared/lib/date-time';
import type { TAppointmentReschedule } from './types';

export const getRescheduleDescription = (request: TAppointmentReschedule) => {
  const oldTime = moscowDate(request.old_scheduled_time).toFormat(
    'd MMMM yyyy, HH:mm',
  );
  const newTime = moscowDate(request.requested_scheduled_time).toFormat(
    'd MMMM yyyy, HH:mm',
  );
  const details = [
    `Дата и время: ${oldTime === newTime ? oldTime : `${oldTime} → ${newTime}`}`,
  ];
  if (
    request.requested_venue !== null &&
    request.requested_venue !== request.old_venue
  ) {
    details.push(
      `Место или ссылка: ${request.old_venue} → ${request.requested_venue}`,
    );
  }
  if (
    request.requested_comment !== null &&
    request.requested_comment !== request.old_comment
  ) {
    details.push(
      `Комментарий к записи: ${request.old_comment || 'не указан'} → ${request.requested_comment || 'удалён'}`,
    );
  }
  return details.join('\n');
};
