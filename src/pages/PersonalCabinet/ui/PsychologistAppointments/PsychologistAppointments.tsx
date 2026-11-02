import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'antd';
import { appointmentQueries } from '@/entities/appointment/api';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import { AppointmentList } from '@/features/personal-cabinet/ui/AppointmentList/AppointmentList';
import { getRequestErrorMessage } from '@/shared/api/errors';
import { moscowDate } from '@/shared/lib/date-time';
import Loader from '@/shared/ui/loader/loader';
import { normalizeSearch } from '@/shared/utils/normalizeSearch';
import styles from './PsychologistAppointments.module.scss';
import { AppointmentFilters } from './components/AppointmentFilters/AppointmentFilters';

export const PsychologistAppointments = () => {
  const { appointmentFilters, setCurrentPage } = usePsychologistView();
  const {
    currentPage,
    sortDirection,
    statusFilter,
    formatFilter,
    searchQuery,
    dateRange,
  } = appointmentFilters;
  const searchTerm = normalizeSearch(searchQuery);

  const {
    data: allAppointments = [],
    isLoading: isLoadingAppointments,
    isError: isErrorAppointments,
    error: loadError,
  } = useQuery(appointmentQueries.list());

  const filteredAppointments = useMemo(() => {
    let result = allAppointments;

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (formatFilter !== 'all') {
      const appointmentType = formatFilter === 'online' ? 'Online' : 'Offline';
      result = result.filter((a) => a.type === appointmentType);
    }

    if (searchTerm) {
      result = result.filter((a) =>
        normalizeSearch(getUserFullName(a.patient)).includes(searchTerm),
      );
    }

    if (dateRange) {
      const [from, to] = dateRange;
      const fromMs = moscowDate(from).startOf('day').toMillis();
      const toMs = moscowDate(to).endOf('day').toMillis();
      result = result.filter((a) => {
        const t = moscowDate(a.scheduled_time).toMillis();
        return t >= fromMs && t <= toMs;
      });
    }

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...result].sort(
      (a, b) =>
        dir *
        (moscowDate(a.scheduled_time).toMillis() -
          moscowDate(b.scheduled_time).toMillis()),
    );
  }, [
    allAppointments,
    statusFilter,
    formatFilter,
    searchTerm,
    dateRange,
    sortDirection,
  ]);

  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const names = new Set(
      allAppointments.map((appointment) =>
        getUserFullName(appointment.patient),
      ),
    );
    return [...names]
      .filter((name) => normalizeSearch(name).includes(searchTerm))
      .map((name) => ({ value: name }));
  }, [allAppointments, searchTerm]);

  if (isLoadingAppointments) return <Loader />;
  if (isErrorAppointments)
    return (
      <Alert
        description={getRequestErrorMessage(loadError)}
        showIcon
        style={{ margin: '24px 0' }}
        title="Не удалось загрузить записи"
        type="error"
      />
    );

  return (
    <section className={styles.wrapper}>
      <h2>Записи</h2>

      <AppointmentFilters searchSuggestions={searchSuggestions} />

      <AppointmentList
        appointments={filteredAppointments}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </section>
  );
};
