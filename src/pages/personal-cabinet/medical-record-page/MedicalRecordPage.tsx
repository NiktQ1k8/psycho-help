import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Empty } from 'antd';
import { appointmentQueries } from '@/entities/appointment/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { Role } from '@/entities/role/helpers';
import { AppointmentList } from '@/features/personal-cabinet/ui/appointment-list/AppointmentList';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import { getTabsForRole } from '@/pages/personal-cabinet/config/tabs';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import Loader from '@/shared/ui/loader/loader';
import layout from '../personal-cabinet.module.scss';
import styles from './MedicalRecordPage.module.scss';

const MedicalRecordPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuth((state) => state.user);
  const isStaff = new Role(user?.roles ?? []).isStaff();
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    ...appointmentQueries.list(),
    enabled: isStaff,
  });

  if (!isStaff) return <Navigate to={SLUG.CABINET} replace />;

  const patientAppointments = appointments
    .filter((appointment) => appointment.patient.id === id)
    .sort(
      (a, b) =>
        moscowDate(b.scheduled_time).toMillis() -
        moscowDate(a.scheduled_time).toMillis(),
    );
  const patient = patientAppointments[0]?.patient;
  const completed = patientAppointments.filter(
    (appointment) => appointment.status === 'done',
  );
  const now = moscowDate().toMillis();
  const nextAppointment = [...patientAppointments]
    .reverse()
    .find(
      (appointment) =>
        appointment.status === 'awaiting' &&
        moscowDate(appointment.scheduled_time).toMillis() >= now,
    );
  const history = nextAppointment ? [nextAppointment, ...completed] : completed;
  const leadingPsychologist = completed[0]?.psychologist.user;

  return (
    <div className={layout.layout}>
      <div className={layout.sidebarWrapper}>
        <Sidebar
          user={user}
          activeTab="medicalRecords"
          tabs={getTabsForRole('psychologist')}
        />
      </div>
      <main className={styles.wrapper}>
        <BackButton text="Вернуться назад" />
        <h1 className={styles.title}>Медицинская карта пользователя</h1>
        {isLoading ? (
          <Loader />
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            message="Не удалось загрузить медицинскую карту"
            description={getErrorMessage(error)}
          />
        ) : !patient ? (
          <Empty description="Медицинская карта не найдена" />
        ) : (
          <>
            <dl className={styles.details}>
              <dt>Фамилия</dt>
              <dd>{patient.last_name}</dd>
              <dt>Имя</dt>
              <dd>{patient.first_name}</dd>
              <dt>Отчество</dt>
              <dd>{patient.middle_name || '—'}</dd>
              <dt>Академическая группа/отделение</dt>
              <dd>{patient.study_group || '—'}</dd>
              <dt>Ведущий психолог</dt>
              <dd>
                {leadingPsychologist
                  ? getUserFullName(leadingPsychologist)
                  : '—'}
              </dd>
            </dl>
            <h2>История приёмов</h2>
            <AppointmentList
              appointments={history}
              currentPage={Number(searchParams.get('page')) || 1}
              onPageChange={(page) =>
                setSearchParams({ page: String(page) }, { replace: true })
              }
            />
          </>
        )}
      </main>
    </div>
  );
};

export default MedicalRecordPage;
