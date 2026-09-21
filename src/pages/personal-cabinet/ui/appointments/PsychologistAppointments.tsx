import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Empty, Pagination } from 'antd';
import clsx from 'clsx';
import { appointmentQueries } from '@/entities/appointment/api';
import type { Appointment } from '@/entities/appointment/types';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import PsychologistListFilters from '@/features/personal-cabinet/ui/psychologist-filters/PsychologistFilters';
import { AppointmentStatusTag } from '@/pages/personal-cabinet/constants';
import dayjs from '@/shared/lib/dayjs';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistAppointments.module.scss';

const toMoscow = (date: string) => dayjs(date).tz();

const ITEMS_PER_PAGE = 5;

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

const getPatientName = (appointment: Appointment) =>
  [appointment.patient?.last_name, appointment.patient?.first_name]
    .filter(Boolean)
    .join(' ') || 'Имя не указано';

const getTimeRange = (time: string) => {
  const start = toMoscow(time);
  return `${start.format('HH:mm')} - ${start.add(1, 'hour').format('HH:mm')}`;
};

const getVenueDisplay = (appointment: Appointment) => {
  if (appointment.type === 'Online') return appointment.venue || 'Онлайн';
  return appointment.venue || 'Очно';
};

const groupByDate = <T,>(
  items: T[],
  getDateStr: (item: T) => string,
): { date: string; items: T[] }[] => {
  const groups: { date: string; items: T[] }[] = [];
  let currentDate = '';
  for (const item of items) {
    const date = getDateStr(item);
    if (date !== currentDate) {
      currentDate = date;
      groups.push({ date, items: [item] });
    } else {
      groups[groups.length - 1].items.push(item);
    }
  }
  return groups;
};

const PsychologistAppointments = () => {
  const FILTERS_TAB = 'appointments' as const;
  const navigate = useNavigate();

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

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    formatFilter !== 'all' ||
    sortDirection !== 'asc' ||
    dateRange !== null;

  const {
    data: allAppointments = [],
    isLoading: isLoadingAppointments,
    isError: isErrorAppointments,
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

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        getPatientName(a).toLowerCase().includes(q),
      );
    }

    if (dateRange) {
      const [from, to] = dateRange;
      const fromMs = dayjs(from).tz().startOf('day').valueOf();
      const toMs = dayjs(to).tz().endOf('day').valueOf();
      result = result.filter((a) => {
        const t = dayjs(a.scheduled_time).valueOf();
        return t >= fromMs && t <= toMs;
      });
    }

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...result].sort(
      (a, b) =>
        dir *
        (new Date(a.scheduled_time).getTime() -
          new Date(b.scheduled_time).getTime()),
    );
  }, [
    allAppointments,
    statusFilter,
    formatFilter,
    searchQuery,
    dateRange,
    sortDirection,
  ]);

  const currentItems = filteredAppointments;
  const paginated = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const searchSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const names = new Set(allAppointments.map(getPatientName));
    return [...names]
      .filter((name) => name.toLowerCase().includes(q))
      .map((name) => ({ value: name }));
  }, [allAppointments, searchQuery]);

  const isLoading = isLoadingAppointments;

  if (isLoading) return <Loader />;
  if (isErrorAppointments)
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить записи"
        description="Попробуйте обновить страницу"
        style={{ margin: '2.4rem 0' }}
      />
    );

  const renderAppointmentRow = (appointment: Appointment) => {
    const statusUI = AppointmentStatusTag[appointment.status];

    return (
      <article
        className={styles.appointmentRow}
        key={appointment.id}
        role="listitem"
      >
        <div className={styles.contentCol}>
          <div className={styles.timeStatusRow}>
            <div className={styles.timeCol}>
              {getTimeRange(appointment.scheduled_time)}
            </div>
            <div className={styles['status']}>
              <div
                className={clsx(
                  styles['status-dot'],
                  styles[statusUI.className],
                )}
              ></div>
              <span className={styles['status-text']}>{statusUI.text}</span>
            </div>
          </div>
          <div className={styles.infoCol}>
            <span className={styles.patientName}>
              {getPatientName(appointment)}
            </span>
            <span className={styles.location}>
              {getVenueDisplay(appointment)}
            </span>
          </div>
        </div>
        <div className={styles.actionsCol}>
          <button
            className={styles.btnPrimary}
            onClick={() => navigate(`/cabinet/appointment/${appointment.id}`)}
            type="button"
          >
            Открыть
          </button>
        </div>
      </article>
    );
  };

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

      <div className={styles.list} role="list">
        {paginated.length === 0 && <Empty description="Записей нет" />}

        {groupByDate(paginated as Appointment[], (appointment) =>
          toMoscow(appointment.scheduled_time).format('D MMMM'),
        ).map((group) => (
          <div className={styles.dateGroup} key={group.date}>
            <h3 className={styles.dateHeader}>{group.date}</h3>
            {group.items.map(renderAppointmentRow)}
          </div>
        ))}
      </div>

      {currentItems.length > ITEMS_PER_PAGE && (
        <Pagination
          className={styles.pagination}
          current={currentPage}
          total={currentItems.length}
          pageSize={ITEMS_PER_PAGE}
          onChange={(page) => setCurrentPage(FILTERS_TAB, page)}
          showSizeChanger={false}
        />
      )}
    </section>
  );
};

export default PsychologistAppointments;
