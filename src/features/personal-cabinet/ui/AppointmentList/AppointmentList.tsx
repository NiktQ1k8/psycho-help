import { Empty, Pagination } from 'antd';
import clsx from 'clsx';
import { AppointmentStatusTag } from '@/entities/appointment/status';
import type { TAppointment } from '@/entities/appointment/types';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import './AppointmentList.antd.scss';
import styles from './AppointmentList.module.scss';

const ITEMS_PER_PAGE = 5;

type TAppointmentListProps = {
  appointments: TAppointment[];
  currentPage: number;
  onPageChange: (page: number) => void;
};

export const AppointmentList = ({
  appointments,
  currentPage,
  onPageChange,
}: TAppointmentListProps) => {
  const page = Math.min(
    Math.max(1, Math.floor(currentPage)),
    Math.max(1, Math.ceil(appointments.length / ITEMS_PER_PAGE)),
  );
  const paginated = appointments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );
  const groups: { date: string; appointments: TAppointment[] }[] = [];
  for (const appointment of paginated) {
    const date = moscowDate(appointment.scheduled_time).toFormat('d MMMM yyyy');
    const lastGroup = groups.at(-1);
    if (lastGroup?.date === date) lastGroup.appointments.push(appointment);
    else groups.push({ date, appointments: [appointment] });
  }

  return (
    <>
      <div className={styles.list} role="list">
        {!appointments.length && <Empty description="Записей нет" />}
        {groups.map((group) => (
          <div className={styles.dateGroup} key={group.appointments[0].id}>
            <h3 className={styles.dateHeader}>{group.date}</h3>
            {group.appointments.map((appointment) => {
              const status = AppointmentStatusTag[appointment.status];
              const start = moscowDate(appointment.scheduled_time);
              return (
                <article
                  className={styles.appointmentRow}
                  key={appointment.id}
                  role="listitem"
                >
                  <div className={styles.contentCol}>
                    <div className={styles.timeStatusRow}>
                      <div className={styles.timeCol}>
                        {start.toFormat('HH:mm')} -{' '}
                        {start
                          .plus({ minutes: appointment.duration })
                          .toFormat('HH:mm')}
                      </div>
                      <div className={styles.status}>
                        <div
                          className={clsx(
                            styles['status-dot'],
                            styles[status.className],
                          )}
                        />
                        <span className={styles['status-text']}>
                          {status.text}
                        </span>
                      </div>
                    </div>
                    <div className={styles.infoCol}>
                      <span className={styles.patientName}>
                        {getUserFullName(appointment.patient)}
                      </span>
                      <span className={styles.location}>
                        {appointment.venue ||
                          (appointment.type === 'Online' ? 'Онлайн' : 'Очно')}
                      </span>
                    </div>
                  </div>
                  <div className={styles.actionsCol}>
                    <ButtonLink
                      className={styles.btnPrimary}
                      to={`${SLUG.CABINET_APPOINTMENT}/${appointment.id}`}
                    >
                      Открыть
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        ))}
      </div>
      {appointments.length > ITEMS_PER_PAGE && (
        <div className={styles.pagination} data-appointment-pagination>
          <Pagination
            current={page}
            pageSize={ITEMS_PER_PAGE}
            showSizeChanger={false}
            total={appointments.length}
            onChange={onPageChange}
          />
        </div>
      )}
    </>
  );
};
