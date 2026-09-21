import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(LocalizedFormat);
dayjs.locale('ru');

export const MOSCOW_TZ = 'Europe/Moscow';
dayjs.tz.setDefault(MOSCOW_TZ);

export default dayjs;
