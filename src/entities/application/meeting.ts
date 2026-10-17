import type { TApplication, TMeetingType } from './types';

export const getApplicationMeetingType = (
  application: Pick<TApplication, 'meeting_type' | 'preferred_campus'>,
): TMeetingType =>
  application.meeting_type ??
  (application.preferred_campus?.trim() ? 'offline' : 'online');

export const getApplicationVenue = (application: TApplication): string =>
  getApplicationMeetingType(application) === 'offline'
    ? application.location_address ||
      application.preferred_campus ||
      'Адрес уточняется'
    : 'Онлайн';
