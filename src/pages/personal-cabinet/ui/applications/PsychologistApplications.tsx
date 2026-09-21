import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Empty, Pagination, message } from 'antd';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  acceptApplication,
  applicationQueries,
  applicationQueryKey,
} from '@/entities/application/api';
import type {
  Application,
  ApplicationStatus,
  MeetingType,
} from '@/entities/application/types';
import { useAuth } from '@/features/auth/api/useAuth';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import PsychologistListFilters from '@/features/personal-cabinet/ui/psychologist-filters/PsychologistFilters';
import { ApplicationStatusTag } from '@/pages/personal-cabinet/constants';
import dayjs from '@/shared/lib/dayjs';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistApplications.module.scss';

const toMoscow = (date: string) => dayjs(date).tz();

const ITEMS_PER_PAGE = 5;

const CLOSED_STATUSES: ApplicationStatus[] = [
  'rejected',
  'cancelled',
  'expired',
];

const APPLICATION_STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'awaiting_user_confirmation', label: 'На подтверждении' },
  { value: 'completed', label: 'Завершено' },
  { value: 'closed', label: 'Отменено' },
];

const APPLICATION_FORMAT_OPTIONS = [
  { value: 'all', label: 'Все форматы' },
  { value: 'offline', label: 'Очно' },
  { value: 'online', label: 'Онлайн' },
];

const getPatientName = (application: Application) =>
  [application.user?.last_name, application.user?.first_name]
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

const getSortTime = (application: Application): number => {
  const date = application.scheduled_at;
  return date ? new Date(date).getTime() : 0;
};

const getTimeRange = (time: string | null) => {
  if (!time) return 'Время ещё не указано';
  const start = toMoscow(time);
  return `${start.format('HH:mm')} - ${start.add(1, 'hour').format('HH:mm')}`;
};

const getMeetingType: (application: Application) => MeetingType = (
  application: Application,
) => {
  if (application.meeting_type) return application.meeting_type;
  if (application.location_address) return 'offline';
  if (application.meeting_url) return 'online';
  if (application.preferred_campus) return 'offline';
  return 'online';
};

const getVenue = (application: Application) => {
  if (getMeetingType(application) === 'online')
    return application.meeting_url || 'Онлайн';
  return application.location_address || application.preferred_campus || 'Очно';
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

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    formatFilter !== 'all' ||
    sortDirection !== 'asc' ||
    dateRange !== null;

  const {
    data: allApplications = [],
    isLoading: isLoadingApplications,
    isError: isErrorApplications,
  } = useQuery(applicationQueries.list());

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      acceptApplication(applicationId, userId!),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      message.error(detail || 'Не удалось выполнить операцию');
    },
  });

  const relevantApplications = useMemo(() => {
    return allApplications.filter(
      (application) =>
        application.status === 'new' ||
        application.assigned_to_user?.id === userId,
    );
  }, [allApplications, userId]);

  const filteredApplications = useMemo(() => {
    let result = relevantApplications;

    if (statusFilter === 'closed') {
      result = result.filter((a) => CLOSED_STATUSES.includes(a.status));
    } else if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) =>
        getPatientName(a).toLowerCase().includes(q),
      );
    }

    if (formatFilter !== 'all') {
      result = result.filter((a) => getMeetingType(a) === formatFilter);
    }

    if (dateRange) {
      const [from, to] = dateRange;
      const fromMs = dayjs(from).tz().startOf('day').valueOf();
      const toMs = dayjs(to).tz().endOf('day').valueOf();
      result = result.filter((a) => {
        const date = a.scheduled_at;
        if (!date) return false;
        const t = dayjs(date).valueOf();
        return t >= fromMs && t <= toMs;
      });
    }

    const dir = sortDirection === 'asc' ? 1 : -1;
    return [...result].sort((a, b) => dir * (getSortTime(a) - getSortTime(b)));
  }, [
    relevantApplications,
    statusFilter,
    formatFilter,
    searchQuery,
    dateRange,
    sortDirection,
  ]);

  const currentItems = filteredApplications;
  const paginated = currentItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const searchSuggestions = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const names = new Set(relevantApplications.map(getPatientName));
    return [...names]
      .filter((name) => name.toLowerCase().includes(q))
      .map((name) => ({ value: name }));
  }, [relevantApplications, searchQuery]);

  const isLoading = isLoadingApplications;

  if (isLoading) return <Loader />;
  if (isErrorApplications)
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить заявки"
        description="Попробуйте обновить страницу"
        style={{ margin: '2.4rem 0' }}
      />
    );

  const renderApplicationRow = (application: Application) => {
    const statusUI = ApplicationStatusTag[application.status];
    const preferPsychologistName = getShortPsychologistName(
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
            {application.status === 'new' && preferPsychologistName && (
              <div className={styles.timeCol}>{preferPsychologistName}</div>
            )}
          </div>
          <div className={styles.infoCol}>
            <span className={styles.patientName}>
              {getPatientName(application)}
            </span>
            <span className={styles.location}>{getVenue(application)}</span>
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
            onClick={() => navigate(`/cabinet/application/${application.id}`)}
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
        {groupByDate(paginated as Application[], (application) => {
          const date = application.scheduled_at;
          return date ? toMoscow(date).format('D MMMM') : 'Дата ещё не указана';
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

export default PsychologistApplications;
