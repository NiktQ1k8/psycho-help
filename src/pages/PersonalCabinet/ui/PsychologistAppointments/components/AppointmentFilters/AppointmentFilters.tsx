import {
  CloseCircleFilled,
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import type { DateTime } from 'luxon';
import {
  type TAppointmentStatusFilter,
  type TFormatFilter,
  usePsychologistView,
} from '@/features/personal-cabinet/model/psychologist-view';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import styles from './AppointmentFilters.module.scss';

interface IAppointmentFiltersProps {
  searchSuggestions: { value: string }[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Все статусы' },
  { value: 'awaiting', label: 'Ожидается' },
  { value: 'done', label: 'Завершено' },
  { value: 'cancelled', label: 'Отменено' },
];

const FORMAT_OPTIONS = [
  { value: 'all', label: 'Все форматы' },
  { value: 'offline', label: 'Очно' },
  { value: 'online', label: 'Онлайн' },
];

export const AppointmentFilters = ({
  searchSuggestions,
}: IAppointmentFiltersProps) => {
  const {
    appointmentFilters: {
      searchQuery,
      formatFilter,
      statusFilter,
      dateRange,
      sortDirection,
    },
    setSearchQuery,
    setFormatFilter,
    setStatusFilter,
    setDateRange,
    setSortDirection,
    resetFilters,
  } = usePsychologistView();
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    formatFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateRange !== null ||
    sortDirection !== 'asc';

  return (
    <div className={styles['filters']}>
      <div className={styles['filters__bar']} role="search">
        <AutoComplete
          className={styles['filters__search-autocomplete']}
          options={searchSuggestions}
          value={searchQuery}
          onChange={setSearchQuery}
        >
          <Input
            className={styles['filters__search-input']}
            allowClear
            aria-label="Поиск по ФИО"
            placeholder="Поиск по ФИО"
            suffix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
        </AutoComplete>

        <div className={styles['filters__status-select']}>
          <select
            className={styles['filters__native-select']}
            aria-label="Статус"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.currentTarget.value as TAppointmentStatusFilter,
              )
            }
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {statusFilter !== 'all' && (
            <button
              className={styles['filters__clear-select']}
              aria-label="Очистить фильтр по статусу"
              type="button"
              onClick={() => setStatusFilter('all')}
            >
              <CloseCircleFilled aria-hidden />
            </button>
          )}
        </div>

        <div className={styles['filters__format-select']}>
          <select
            className={styles['filters__native-select']}
            aria-label="Формат встречи"
            value={formatFilter}
            onChange={(event) =>
              setFormatFilter(event.currentTarget.value as TFormatFilter)
            }
          >
            {FORMAT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {formatFilter !== 'all' && (
            <button
              className={styles['filters__clear-select']}
              aria-label="Очистить фильтр по формату"
              type="button"
              onClick={() => setFormatFilter('all')}
            >
              <CloseCircleFilled aria-hidden />
            </button>
          )}
        </div>

        <DatePicker.RangePicker
          className={styles['filters__date-range']}
          allowClear
          format="DD.MM.YYYY"
          placeholder={['От', 'До']}
          separator={<span style={{ color: '#C4C4C4' }}>&#10132;</span>}
          value={
            dateRange
              ? [moscowDate(dateRange[0]), moscowDate(dateRange[1])]
              : null
          }
          onChange={(dates: [DateTime | null, DateTime | null] | null) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([
                toApiDate(dates[0].startOf('day')),
                toApiDate(dates[1].startOf('day')),
              ]);
              return;
            }
            setDateRange(null);
          }}
        />
      </div>

      <div className={styles['filters__bar__second']}>
        <button
          className={styles['filters__sort-button']}
          type="button"
          onClick={() =>
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
          }
        >
          Сортировка по дате
          {sortDirection === 'desc' ? (
            <SortDescendingOutlined />
          ) : (
            <SortAscendingOutlined />
          )}
        </button>

        {hasActiveFilters && (
          <button
            className={styles['filters__reset-button']}
            type="button"
            onClick={resetFilters}
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
};
