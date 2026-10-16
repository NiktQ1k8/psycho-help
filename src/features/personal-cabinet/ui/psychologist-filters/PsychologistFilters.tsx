import {
  SearchOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import { AutoComplete, Input, Select } from 'antd';
import type { DateTime } from 'luxon';
import type { TSortDirection } from '@/features/personal-cabinet/model/psychologist-view';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import styles from './PsychologistFilters.module.scss';

interface ISelectOption {
  value: string;
  label: string;
}

interface ISearchSuggestion {
  value: string;
}

interface IPsychologistListFiltersProps {
  searchQuery: string;
  searchSuggestions: ISearchSuggestion[];
  onSearchQueryChange: (value: string) => void;
  formatFilter: string;
  formatOptions: ISelectOption[];
  onFormatFilterChange: (value: string) => void;
  statusFilter: string;
  statusOptions: ISelectOption[];
  onStatusFilterChange: (value: string) => void;
  dateRange: [string, string] | null;
  onDateRangeChange: (range: [string, string] | null) => void;
  sortDirection: TSortDirection;
  onSortDirectionChange: (direction: TSortDirection) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  searchPlaceholder?: string;
  formatPlaceholder?: string;
  statusPlaceholder?: string;
}

const PsychologistListFilters = ({
  searchQuery,
  searchSuggestions,
  onSearchQueryChange,
  formatFilter,
  formatOptions,
  onFormatFilterChange,
  statusFilter,
  statusOptions,
  onStatusFilterChange,
  dateRange,
  onDateRangeChange,
  sortDirection,
  onSortDirectionChange,
  hasActiveFilters,
  onResetFilters,
  searchPlaceholder = 'Поиск по ФИО',
  formatPlaceholder = 'Все форматы',
  statusPlaceholder = 'Все статусы',
}: IPsychologistListFiltersProps) => {
  return (
    <div className={styles['filters']}>
      <div className={styles['filters__bar']} role="search">
        <AutoComplete
          className={styles['filters__search-autocomplete']}
          value={searchQuery}
          options={searchSuggestions}
          onChange={onSearchQueryChange}
        >
          <Input
            className={styles['filters__search-input']}
            placeholder={searchPlaceholder}
            suffix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
          />
        </AutoComplete>

        <Select
          className={styles['filters__status-select']}
          value={statusFilter === 'all' ? null : statusFilter}
          onChange={(value) => onStatusFilterChange(value || 'all')}
          options={statusOptions}
          placeholder={statusPlaceholder}
          allowClear
        />

        <Select
          className={styles['filters__format-select']}
          value={formatFilter === 'all' ? null : formatFilter}
          onChange={(value) => onFormatFilterChange(value || 'all')}
          options={formatOptions}
          placeholder={formatPlaceholder}
          allowClear
        />

        <DatePicker.RangePicker
          dropdownClassName="custom-range-picker-dropdown"
          className={styles['filters__date-range']}
          separator={<span style={{ color: '#C4C4C4' }}>&#10132;</span>}
          value={
            dateRange
              ? [moscowDate(dateRange[0]), moscowDate(dateRange[1])]
              : null
          }
          onChange={(dates: [DateTime | null, DateTime | null] | null) => {
            if (dates && dates[0] && dates[1]) {
              onDateRangeChange([
                toApiDate(dates[0].startOf('day')),
                toApiDate(dates[1].startOf('day')),
              ]);
              return;
            }
            onDateRangeChange(null);
          }}
          format="DD.MM.YYYY"
          placeholder={['От', 'До']}
          allowClear
        />
      </div>

      <div className={styles['filters__bar__second']}>
        <button
          className={styles['filters__sort-button']}
          onClick={() =>
            onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')
          }
          type="button"
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
            onClick={onResetFilters}
            type="button"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    </div>
  );
};

export default PsychologistListFilters;
