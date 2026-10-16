import { Calendar as AntCalendar, DatePicker as AntDatePicker } from 'antd';
import type { DateTime } from 'luxon';
import luxonConfig from 'rc-picker/es/generate/luxon';
import '@/shared/lib/date-time';

export const DatePicker = AntDatePicker.generatePicker<DateTime>(luxonConfig);
export const Calendar = AntCalendar.generateCalendar<DateTime>(luxonConfig);
