import { useEffect, useState } from 'react';
import type { CSSProperties, FC } from 'react';
import { theme } from 'antd';
import type { DateTime } from 'luxon';
import type { TAppointment } from '@/entities/appointment/types';
import { useAppointment } from '@/features/personal-cabinet/model/appointment';
import { moscowDate } from '@/shared/lib/date-time';
import { Calendar } from '@/shared/ui/date-picker/MoscowDatePicker';
import styles from './Calendar.module.scss';
import Marker from './marker/marker';

// Accepted, Approved, Cancelled, Done
const specialDatesTypes: Record<string, string> = {
  Accepted: '#FFCF52',
  Approved: '#33C175',
  // '2025-04-10': '#7D8488'
};

type TCalendarProps = {
  appointments?: TAppointment[];
};

const ACalendar: FC<TCalendarProps> = ({ appointments }) => {
  const setAppointment = useAppointment((state) => state.setAppointment);
  const { token } = theme.useToken();

  const [selectedDate, setSelectedDate] = useState<DateTime>(moscowDate());
  const [specialDates, setSpecialDates] = useState<Record<string, string>>({});

  // выбор сегодняшней даты по умолчанию
  useEffect(() => {
    setAppointment({ scheduled_time: moscowDate().toFormat('yyyy-MM-dd') });
    setSelectedDate(moscowDate());
  }, [setAppointment]);

  // формирования объекта с помеченными датами
  useEffect(() => {
    if (appointments) {
      setSpecialDates(
        Object.assign(
          {},
          ...appointments.map((el) => {
            return {
              [moscowDate(el.scheduled_time).toFormat('yyyy-MM-dd')]: el.status,
            };
          }),
        ),
      );
    }
  }, [appointments]);

  // изменение при выборе даты
  const onChange = (value: DateTime) => {
    setAppointment({ scheduled_time: value.toFormat('yyyy-MM-dd') });
    setSelectedDate(value.startOf('day'));
  };

  // полностью перезаписываем содержимое ячейки
  const dateFullCellRender = (value: DateTime) => {
    const key = value.toFormat('yyyy-MM-dd');
    const specialBg = specialDatesTypes[specialDates[key]];

    // определяем, чем мы хотим пометить
    const isToday =
      value.toFormat('yyyy-MM-dd') === moscowDate().toFormat('yyyy-MM-dd');
    const isSelected = value.hasSame(selectedDate, 'day');

    const style: CSSProperties = {
      // фон: выбранная, или спец., или дефолт
      backgroundColor: isSelected
        ? '#1890ff'
        : specialBg
          ? specialBg
          : undefined,
      ...(isToday ? { boxShadow: '0 0 0 1px #555555 inset' } : {}),
    };

    return (
      <div className={styles.cell} style={style}>
        {value.day}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', borderRadius: token.borderRadiusLG }}>
      <Calendar
        fullscreen={false}
        onChange={onChange}
        value={selectedDate}
        fullCellRender={dateFullCellRender}
      />
      <div className={styles.markers}>
        <Marker text="Прием подтвержден" type="Approved" />
        <Marker text="Прием не подтвержден" type="Accepted" />
        <Marker text="Выбранная дата" type="selected" />
      </div>
    </div>
  );
};

export default ACalendar;
