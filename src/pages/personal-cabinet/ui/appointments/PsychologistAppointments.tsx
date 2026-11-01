import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert } from 'antd';
import { appointmentQueries } from '@/entities/appointment/api';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import { AppointmentList } from '@/features/personal-cabinet/ui/appointment-list/AppointmentList';
import PsychologistListFilters from '@/features/personal-cabinet/ui/psychologist-filters/PsychologistFilters';
import { getErrorMessage } from '@/shared/api/errors';
import { moscowDate } from '@/shared/lib/date-time';
import Loader from '@/shared/ui/loader/loader';
import { normalizeSearch } from '@/shared/utils/normalizeSearch';
import styles from './PsychologistAppointments.module.scss';

const APPOINTMENT_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'awaiting', label: 'Ожидается' },
  { value: 'done', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const APPOINTMENT_FORMAT_OPTIONS = [
  { value: 'all', label: 'Все форматы' },
  { value: 'offline', label: 'Очно' },
  { value: 'online', label: 'Онлайн' },
];

const PsychologistAppointments = () => {
  const FILTERS_TAB = 'appointments' as const;

  const {
    appointmentFilters,
    setCurrentPage,
    setSortDirection,
    setStatusFilter,
    setFormatFilter,
    setSearchQuery,
    setDateRange,
    resetFilters,
  } = usePsychologistView();

  const filters = appointmentFilters;
  const {
    currentPage,
    sortDirection,
    statusFilter,
    formatFilter,
    searchQuery,
    dateRange,
  } = filters;
  const searchTerm = normalizeSearch(searchQuery);

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    formatFilter !== 'all' ||
    sortDirection !== 'asc' ||
    dateRange !== null;

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

  const isLoading = isLoadingAppointments;

  if (isLoading) return <Loader />;
  if (isErrorAppointments)
    return (
      <Alert
        type="error"
        showIcon
        title="Не удалось загрузить записи"
        description={getErrorMessage(loadError)}
        style={{ margin: '2.4rem 0' }}
      />
    );

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.title}>Записи</h2>

      <PsychologistListFilters
        searchQuery={searchQuery}
        searchSuggestions={searchSuggestions}
        onSearchQueryChange={(value) => setSearchQuery(FILTERS_TAB, value)}
        formatFilter={formatFilter}
        formatOptions={APPOINTMENT_FORMAT_OPTIONS}
        onFormatFilterChange={(value) =>
          setFormatFilter(FILTERS_TAB, value as typeof formatFilter)
        }
        statusFilter={statusFilter}
        statusOptions={APPOINTMENT_STATUS_OPTIONS}
        onStatusFilterChange={(value) => setStatusFilter(FILTERS_TAB, value)}
        dateRange={dateRange}
        onDateRangeChange={(range) => setDateRange(FILTERS_TAB, range)}
        sortDirection={sortDirection}
        onSortDirectionChange={(direction) =>
          setSortDirection(FILTERS_TAB, direction)
        }
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => resetFilters(FILTERS_TAB)}
      />

      <AppointmentList
        appointments={filteredAppointments}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(FILTERS_TAB, page)}
      />
    </section>
  );
};

export default PsychologistAppointments;
