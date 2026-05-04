import { AutoComplete, DatePicker, Input, Select } from 'antd';
import { SortAscendingOutlined, SortDescendingOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { SortDirection } from '@/features/personal-cabinet/model/psychologist-view';
import styles from './PsychologistFilters.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SearchSuggestion {
  value: string;
}

interface PsychologistListFiltersProps {
  searchQuery: string;
  searchSuggestions: SearchSuggestion[];
  onSearchQueryChange: (value: string) => void;
  formatFilter: string;
  formatOptions: SelectOption[];
  onFormatFilterChange: (value: string) => void;
  statusFilter: string;
  statusOptions: SelectOption[];
  onStatusFilterChange: (value: string) => void;
  dateRange: [string, string] | null;
  onDateRangeChange: (range: [string, string] | null) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
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
}: PsychologistListFiltersProps) => {
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
          value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
          onChange={(dates: [Dayjs | null, Dayjs | null] | null) => {
            if (dates && dates[0] && dates[1]) {
              onDateRangeChange([dates[0].toISOString(), dates[1].toISOString()]);
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
          onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
          type="button"
        >
          Сортировка по дате
          {sortDirection === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
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
