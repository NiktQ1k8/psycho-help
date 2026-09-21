import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvironmentOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker } from 'antd';
import clsx from 'clsx';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { appointmentQueries } from '@/entities/appointment/api';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistDashboard.module.scss';

const DAY_HOURS = Array.from({ length: 11 }, (_, i) => i + 9);
const HOUR_HEIGHT = 80;

interface PsychologistDashboardProps {
  onBookClick?: () => void;
}

const PsychologistDashboard: React.FC<PsychologistDashboardProps> = ({
  onBookClick,
}) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

  const { data: appointments = [], isLoading: isLoadingApts } = useQuery(
    appointmentQueries.list(),
  );

  const todaysAppointments = useMemo(() => {
    const startOfDay = currentDate.startOf('day').valueOf();
    const endOfDay = currentDate.endOf('day').valueOf();

    return appointments.filter((apt) => {
      const aptTime = dayjs(apt.scheduled_time).valueOf();
      return aptTime >= startOfDay && aptTime <= endOfDay;
    });
  }, [appointments, currentDate]);

  const selectedAppointment = useMemo(() => {
    return todaysAppointments.find((a) => a.id === selectedAptId) || null;
  }, [todaysAppointments, selectedAptId]);

  const weekDays = useMemo(() => {
    const startOfWeek = currentDate.startOf('week');
    return Array.from({ length: 7 }).map((_, i) => startOfWeek.add(i, 'day'));
  }, [currentDate]);

  const handleDaySelect = (day: Dayjs) => {
    setCurrentDate(day);
    setSelectedAptId(null);
  };

  const getTimeRange = (timeStr: string) => {
    const start = dayjs(timeStr);
    const end = start.add(1, 'hour');
    return `${start.format('HH:mm')} - ${end.format('HH:mm')}`;
  };

  if (isLoadingApts) return <Loader />;

  return (
    <>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Расписание</h1>
        <button className={styles.btnAdd} onClick={onBookClick}>
          Добавить запись <PlusOutlined />
        </button>
      </div>

      <div className={styles.navigationRow}>
        <div className={styles.weekSelector}>
          {weekDays.map((day) => {
            const isSelected = day.isSame(currentDate, 'day');
            return (
              <div
                key={day.format('DD')}
                className={clsx(styles.dayItem, isSelected && styles.dayActive)}
                onClick={() => handleDaySelect(day)}
              >
                <span className={styles.dayName}>{day.format('dd')}</span>
                <span className={styles.dayNumber}>{day.format('D')}</span>
              </div>
            );
          })}
        </div>

        <DatePicker
          value={currentDate}
          onChange={(date) => date && handleDaySelect(date)}
          format="DD.MM.YYYY"
          allowClear={false}
          className={styles.datePicker}
          placeholder="Выберите дату"
        />
      </div>

      <section className={styles.wrapper}>
        <div className={styles.mainContent}>
          <div className={styles.scheduleGrid}>
            <div className={styles.timeLabels}>
              {DAY_HOURS.map((hour) => (
                <div
                  key={hour}
                  className={styles.timeLabelRow}
                  style={{ height: HOUR_HEIGHT }}
                >
                  <span
                    className={styles.timeText}
                  >{`${hour.toString().padStart(2, '0')}:00`}</span>
                  <div className={styles.gridLine} />
                </div>
              ))}
            </div>

            <div className={styles.eventsContainer}>
              {todaysAppointments.map((apt) => {
                const aptTime = dayjs(apt.scheduled_time);
                const isSelected = selectedAptId === apt.id;

                const startHour = 9;
                const topPosition =
                  (aptTime.hour() - startHour) * HOUR_HEIGHT +
                  (aptTime.minute() / 60) * HOUR_HEIGHT;
                const durationHeight = HOUR_HEIGHT;

                const venueStr =
                  apt.type === 'Online'
                    ? 'Онлайн'
                    : apt.venue
                      ? `${apt.venue}`
                      : 'Очно';

                if (aptTime.hour() < 9 || aptTime.hour() > 19) return null;

                return (
                  <div
                    key={apt.id}
                    className={clsx(
                      styles.eventCard,
                      isSelected && styles.eventCardActive,
                    )}
                    style={{
                      top: `${topPosition}px`,
                      height: `${durationHeight}px`,
                    }}
                    onClick={() => setSelectedAptId(apt.id)}
                  >
                    <div className={styles.eventTime}>
                      {getTimeRange(apt.scheduled_time)}
                    </div>
                    <div className={styles.eventName}>
                      {[apt.patient.first_name, apt.patient.last_name].join(
                        ' ',
                      ) || 'Пациент не указан'}
                    </div>
                    <div className={styles.eventVenue}>{venueStr}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className={styles.detailsPanel}>
          {selectedAppointment ? (
            <div className={styles.detailsCard}>
              <h2 className={styles.detailsTime}>
                {getTimeRange(selectedAppointment.scheduled_time)}
              </h2>

              <div className={styles.detailsInfoList}>
                <div className={styles.infoRow}>
                  <UserOutlined className={styles.infoIcon} />
                  <span>
                    {[
                      selectedAppointment.patient.first_name,
                      selectedAppointment.patient.last_name,
                    ].join(' ') || 'Пациент не указан'}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <EnvironmentOutlined className={styles.infoIcon} />
                  <span>
                    {selectedAppointment.type === 'Online'
                      ? 'Онлайн'
                      : selectedAppointment.venue || 'Кабинет не указан'}
                  </span>
                </div>
              </div>

              <div className={styles.commentBlock}>
                <h4 className={styles.commentLabel}>Комментарий</h4>
                <p className={styles.commentText}>
                  {selectedAppointment.comment || 'Комментарий отсутствует'}
                </p>
              </div>

              <Button
                type="primary"
                className={styles.btnNavigate}
                onClick={() =>
                  navigate(`/cabinet/appointment/${selectedAppointment.id}`)
                }
              >
                Перейти к записи
              </Button>
            </div>
          ) : (
            <div className={styles.emptyDetails}>
              <p>Выберите запись в расписании для просмотра информации</p>
            </div>
          )}
        </aside>
      </section>
    </>
  );
};

export default PsychologistDashboard;
