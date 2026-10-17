import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Empty, Pagination } from 'antd';
import clsx from 'clsx';
import {
  acceptApplication,
  applicationQueries,
  applicationQueryKey,
} from '@/entities/application/api';
import {
  getApplicationMeetingType,
  getApplicationVenue,
} from '@/entities/application/meeting';
import type {
  TApplication,
  TApplicationStatus,
} from '@/entities/application/types';
import { useAuth } from '@/entities/auth/model/useAuth';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import PsychologistListFilters from '@/features/personal-cabinet/ui/psychologist-filters/PsychologistFilters';
import { ApplicationStatusTag } from '@/pages/personal-cabinet/constants';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import Loader from '@/shared/ui/loader/loader';
import { normalizeSearch } from '@/shared/utils/normalizeSearch';
import styles from './PsychologistApplications.module.scss';

const ITEMS_PER_PAGE = 5;

const CLOSED_STATUSES: TApplicationStatus[] = [
  'rejected',
  'cancelled',
  'expired',
];

const APPLICATION_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'awaiting_user_confirmation', label: 'На подтверждении' },
  { value: 'closed', label: 'Отменено' },
];

const APPLICATION_FORMAT_OPTIONS = [
  { value: 'all', label: 'Все форматы' },
  { value: 'offline', label: 'Очно' },
  { value: 'online', label: 'Онлайн' },
];

const getPatientName = (application: TApplication) =>
  [
    application.user?.last_name,
    application.user?.first_name,
    application.user?.middle_name,
  ]
    .filter(Boolean)
    .join(' ') || 'Имя не указано';

const getShortPsychologistName = (
  user?: {
    last_name?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
  } | null,
) => {
  if (!user) return '';

  const initials = [user.first_name?.[0], user.middle_name?.[0]]
    .filter(Boolean)
    .map((initial) => `${initial}.`)
    .join('');

  return [user.last_name, initials].filter(Boolean).join(' ');
};

const getSortTime = (application: TApplication): number => {
  const date = application.scheduled_at;
  return date ? moscowDate(date).toMillis() : 0;
};

const getTimeRange = (time: string | null) => {
  if (!time) return 'Время ещё не указано';
  const start = moscowDate(time);
  return `${start.toFormat('HH:mm')} - ${start.plus({ hours: 1 }).toFormat('HH:mm')}`;
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

const PsychologistApplications = () => {
  const { message } = App.useApp();
  const FILTERS_TAB = 'applications' as const;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const userId = user?.id;

  const {
    applicationFilters,
    setCurrentPage,
    setSortDirection,
    setStatusFilter,
    setFormatFilter,
    setSearchQuery,
    setDateRange,
    resetFilters,
  } = usePsychologistView();

  const filters = applicationFilters;
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
    data: allApplications = [],
    isLoading: isLoadingApplications,
    isError: isErrorApplications,
    error: loadError,
  } = useQuery(applicationQueries.list());

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      acceptApplication(applicationId, userId!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
    onError: (error) => {
      message.error(getErrorMessage(error, 'Не удалось выполнить операцию'));
    },
  });

  const filteredApplications = useMemo(() => {
    let result = allApplications;

    if (statusFilter === 'closed') {
      result = result.filter((a) => CLOSED_STATUSES.includes(a.status));
    } else if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (searchTerm) {
      result = result.filter((a) =>
        normalizeSearch(getPatientName(a)).includes(searchTerm),
      );
    }

    if (formatFilter !== 'all') {
      result = result.filter(
        (a) => getApplicationMeetingType(a) === formatFilter,
      );
    }

    if (dateRange) {
      const [from, to] = dateRange;
      const fromMs = moscowDate(from).startOf('day').toMillis();
      const toMs = moscowDate(to).endOf('day').toMillis();
      result = result.filter((a) => {
        const date = a.scheduled_at;
        if (!date) return false;
        const t = moscowDate(date).toMillis();
        return t >= fromMs && t <= toMs;
      });
    }

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...result].sort((a, b) => dir * (getSortTime(a) - getSortTime(b)));
  }, [
    allApplications,
    statusFilter,
    formatFilter,
    searchTerm,
    dateRange,
    sortDirection,
  ]);

  const currentItems = filteredApplications;
  const page = Math.min(
    currentPage,
    Math.max(1, Math.ceil(currentItems.length / ITEMS_PER_PAGE)),
  );
  const paginated = currentItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const searchSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    const names = new Set(allApplications.map(getPatientName));
    return [...names]
      .filter((name) => normalizeSearch(name).includes(searchTerm))
      .map((name) => ({ value: name }));
  }, [allApplications, searchTerm]);

  const isLoading = isLoadingApplications;

  if (isLoading) return <Loader />;
  if (isErrorApplications)
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить заявки"
        description={getErrorMessage(loadError)}
        style={{ margin: '2.4rem 0' }}
      />
    );

  const renderApplicationRow = (application: TApplication) => {
    const statusUI = ApplicationStatusTag[application.status];
    const psychologistName = getShortPsychologistName(
      application.psychologist?.user,
    );

    return (
      <article
        className={styles.appointmentRow}
        key={application.id}
        role="listitem"
      >
        <div className={styles.contentCol}>
          <div className={styles.timeStatusRow}>
            <div className={styles.timeCol}>
              {getTimeRange(application.scheduled_at)}
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
            {psychologistName && (
              <div className={styles.timeCol}>{psychologistName}</div>
            )}
          </div>
          <div className={styles.infoCol}>
            <span className={styles.patientName}>
              {getPatientName(application)}
            </span>
            <span className={styles.location}>
              {getApplicationVenue(application)}
            </span>
          </div>
        </div>
        <div className={styles.actionsCol}>
          {application.status === 'new' && (
            <button
              className={styles.btnConfirm}
              onClick={() => acceptMutation.mutate(application.id)}
              disabled={acceptMutation.isPending}
              type="button"
            >
              {acceptMutation.isPending ? 'Сохранение...' : 'В работу'}
            </button>
          )}
          <button
            className={styles.btnOpen}
            onClick={() =>
              navigate(`${SLUG.CABINET_APPLICATION}/${application.id}`)
            }
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
      <h2 className={styles.title}>Заявки</h2>

      <PsychologistListFilters
        searchQuery={searchQuery}
        searchSuggestions={searchSuggestions}
        onSearchQueryChange={(value) => setSearchQuery(FILTERS_TAB, value)}
        formatFilter={formatFilter}
        formatOptions={APPLICATION_FORMAT_OPTIONS}
        onFormatFilterChange={(value) =>
          setFormatFilter(FILTERS_TAB, value as typeof formatFilter)
        }
        statusFilter={statusFilter}
        statusOptions={APPLICATION_STATUS_OPTIONS}
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
        {paginated.length === 0 && <Empty description="Заявок нет" />}
        {groupByDate(paginated, (application) => {
          const date = application.scheduled_at;
          return date
            ? moscowDate(date).toFormat('d MMMM yyyy')
            : 'Дата ещё не указана';
        }).map((group) => (
          <div className={styles.dateGroup} key={group.date}>
            <h3 className={styles.dateHeader}>{group.date}</h3>
            {group.items.map(renderApplicationRow)}
          </div>
        ))}
      </div>

      {currentItems.length > ITEMS_PER_PAGE && (
        <Pagination
          className={styles.pagination}
          current={page}
          total={currentItems.length}
          pageSize={ITEMS_PER_PAGE}
          onChange={(page) => setCurrentPage(FILTERS_TAB, page)}
          showSizeChanger={false}
        />
      )}
    </section>
  );
};

export default PsychologistApplications;
