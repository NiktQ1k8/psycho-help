import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Alert, Button } from 'antd';
import clsx from 'clsx';
import type { DateTime } from 'luxon';
import { appointmentQueries } from '@/entities/appointment/api';
import {
  CONSULTATION_END_HOUR,
  CONSULTATION_START_HOUR,
} from '@/features/personal-cabinet/model/consultation-time';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import { AppointmentStatusTag } from '@/pages/personal-cabinet/constants';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistDashboard.module.scss';

const HOUR_HEIGHT = 80;

const PsychologistDashboard = () => {
  const navigate = useNavigate();
  const currentDate =
    usePsychologistView((state) => state.dashboardDate) ?? moscowDate();
  const setCurrentDate = usePsychologistView((state) => state.setDashboardDate);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

  const {
    data: appointments = [],
    isLoading: isLoadingApts,
    error,
  } = useQuery(appointmentQueries.list());

  const todaysAppointments = useMemo(() => {
    const startOfDay = currentDate.startOf('day').toMillis();
    const endOfDay = currentDate.endOf('day').toMillis();

    return appointments.filter((apt) => {
      const aptTime = moscowDate(apt.scheduled_time).toMillis();
      return (
        apt.status !== 'cancelled' &&
        aptTime >= startOfDay &&
        aptTime <= endOfDay
      );
    });
  }, [appointments, currentDate]);

  const dayHours = useMemo(() => {
    const hours = todaysAppointments.map(
      (apt) => moscowDate(apt.scheduled_time).hour,
    );
    const firstHour = Math.min(CONSULTATION_START_HOUR, ...hours);
    const lastHour = Math.max(CONSULTATION_END_HOUR, ...hours);
    return Array.from(
      { length: lastHour - firstHour + 1 },
      (_, i) => firstHour + i,
    );
  }, [todaysAppointments]);

  const selectedAppointment = useMemo(() => {
    return todaysAppointments.find((a) => a.id === selectedAptId) || null;
  }, [todaysAppointments, selectedAptId]);

  const weekDays = useMemo(() => {
    const startOfWeek = currentDate.startOf('week');
    return Array.from({ length: 7 }).map((_, i) =>
      startOfWeek.plus({ days: i }),
    );
  }, [currentDate]);

  const handleDaySelect = (day: DateTime) => {
    setCurrentDate(day.startOf('day'));
    setSelectedAptId(null);
  };

  const getTimeRange = (timeStr: string) => {
    const start = moscowDate(timeStr);
    const end = start.plus({ hours: 1 });
    return `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;
  };

  if (isLoadingApts) return <Loader />;
  if (error)
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить расписание"
        description={getErrorMessage(error)}
      />
    );

  return (
    <>
      <div className={styles.headerRow}>
        <h1 className={styles.pageTitle}>Расписание</h1>
      </div>

      <div className={styles.navigationRow}>
        <div className={styles.weekSelector}>
          {weekDays.map((day) => {
            const isSelected = day.hasSame(currentDate, 'day');
            return (
              <div
                key={day.toFormat('dd')}
                className={clsx(styles.dayItem, isSelected && styles.dayActive)}
                onClick={() => handleDaySelect(day)}
              >
                <span className={styles.dayName}>{day.toFormat('ccc')}</span>
                <span className={styles.dayNumber}>{day.toFormat('d')}</span>
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
              {dayHours.map((hour) => (
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
                const aptTime = moscowDate(apt.scheduled_time);
                const isSelected = selectedAptId === apt.id;

                const startHour = dayHours[0];
                const topPosition =
                  (aptTime.hour - startHour) * HOUR_HEIGHT +
                  (aptTime.minute / 60) * HOUR_HEIGHT;
                const durationHeight = HOUR_HEIGHT;

                const venueStr =
                  apt.type === 'Online' ? 'Онлайн' : apt.venue || 'Очно';

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
                      {getTimeRange(apt.scheduled_time)} ·{' '}
                      {AppointmentStatusTag[apt.status].text}
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
                      ? selectedAppointment.venue || 'Онлайн'
                      : selectedAppointment.venue || 'Кабинет не указан'}
                  </span>
                </div>
              </div>

              <div className={styles.commentBlock}>
                <h4 className={styles.commentLabel}>Комментарий</h4>
                <p className={styles.commentText}>
                  {selectedAppointment.venue || 'Комментарий отсутствует'}
                </p>
              </div>

              <Button
                type="primary"
                className={styles.btnNavigate}
                onClick={() =>
                  navigate(
                    `${SLUG.CABINET_APPOINTMENT}/${selectedAppointment.id}`,
                  )
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
