import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Popconfirm } from 'antd';
import { isAxiosError } from 'axios';
import type { DateTime } from 'luxon';
import {
  createTherapistStatus,
  deleteTherapistStatus,
} from '@/entities/therapist/api';
import {
  therapistQueries,
  therapistQueryKey,
} from '@/entities/therapist/queries';
import type {
  TTherapistStatus,
  TTherapistStatusRequest,
} from '@/entities/therapist/types';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import './PsychologistAbsences.antd.scss';
import styles from './PsychologistAbsences.module.scss';

interface IPsychologistAbsencesProps {
  userId: string;
}

const statusNames = { vacation: 'Отпуск', sick: 'Больничный' };
const displayDate = (value: string) =>
  moscowDate(value).toFormat('dd.MM.yyyy, HH:mm');

const statusError = (error: unknown, fallback: string) => {
  const code = isAxiosError(error) ? error.response?.status : undefined;
  if (code === 403) return 'Недостаточно прав. Обратитесь к администратору.';
  if (code === 404)
    return 'Период или профиль психолога не найден. Обновите список.';
  if (code === 400) {
    const detail = isAxiosError<{ detail?: string }>(error)
      ? error.response?.data?.detail
      : undefined;
    return typeof detail === 'string' && detail.includes('пересекающийся')
      ? 'Этот период пересекается с отпуском или больничным. Измените даты и время.'
      : 'Не удалось сохранить период. Проверьте даты и время.';
  }
  if (code === 422) return 'Проверьте тип периода, даты и время.';
  return fallback;
};

const samePeriod = (period: TTherapistStatus, body: TTherapistStatusRequest) =>
  period.status === body.status &&
  moscowDate(period.start_date).toMillis() ===
    moscowDate(body.start_date).toMillis() &&
  moscowDate(period.end_date).toMillis() ===
    moscowDate(body.end_date).toMillis();

export const PsychologistAbsences = ({
  userId,
}: IPsychologistAbsencesProps) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const query = useQuery(therapistQueries.statuses(userId));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TTherapistStatus | null>(null);
  const [status, setStatus] =
    useState<TTherapistStatusRequest['status']>('vacation');
  const [start, setStart] = useState<DateTime | null>(null);
  const [end, setEnd] = useState<DateTime | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDatesChange = (
    dates: [DateTime | null, DateTime | null] | null,
  ) => {
    setStart(dates?.[0] ?? null);
    setEnd(dates?.[1] ?? null);
  };

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: [therapistQueryKey.statuses, userId],
    });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
    setErrorMessage('');
  };

  const saveMutation = useMutation({
    mutationFn: async (body: TTherapistStatusRequest) => {
      if (!editing) {
        try {
          return await createTherapistStatus(userId, body);
        } catch (error) {
          throw new Error(
            statusError(
              error,
              'Не удалось добавить период. Повторите попытку.',
            ),
            { cause: error },
          );
        }
      }

      const original = editing;
      try {
        await deleteTherapistStatus(userId, original.id);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) {
          setEditing(null);
        }
        throw new Error(
          statusError(error, 'Не удалось изменить период. Повторите попытку.'),
          { cause: error },
        );
      }

      try {
        return await createTherapistStatus(userId, body);
      } catch (error) {
        // После обрыва соединения новый период мог сохраниться на сервере.
        const periods = await queryClient
          .fetchQuery({ ...therapistQueries.statuses(userId), staleTime: 0 })
          .catch(() => []);
        const saved = periods.find((period) => samePeriod(period, body));
        if (saved) return saved;

        const existing = periods.find((period) => samePeriod(period, original));
        let restored = existing;
        if (!restored) {
          restored = await createTherapistStatus(userId, {
            status: original.status,
            start_date: original.start_date,
            end_date: original.end_date,
          }).catch(() => undefined);
        }
        setEditing(restored ?? null);
        throw new Error(
          restored
            ? `${statusError(error, 'Не удалось сохранить изменения.')} Прежний период восстановлен. Можно исправить данные и повторить попытку.`
            : 'Не удалось сохранить изменения и подтвердить восстановление прежнего периода. Проверьте список и добавьте нужный период снова.',
          { cause: error },
        );
      }
    },
    onSuccess: () => {
      message.success(editing ? 'Период изменён' : 'Период добавлен');
      closeForm();
    },
    onError: (error) => setErrorMessage(error.message),
    onSettled: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: async (period: TTherapistStatus) => {
      try {
        await deleteTherapistStatus(userId, period.id);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return;
        throw error;
      }
    },
    onSuccess: (_, period) => {
      message.success('Период удалён');
      if (editing?.id === period.id) closeForm();
      setErrorMessage('');
    },
    onError: (error) =>
      setErrorMessage(
        statusError(error, 'Не удалось удалить период. Повторите попытку.'),
      ),
    onSettled: refresh,
  });

  const isPending = saveMutation.isPending || deleteMutation.isPending;
  const disabled = isPending || query.isPending || query.isError;
  const periods = [...(query.data ?? [])].sort(
    (a, b) =>
      moscowDate(b.start_date).toMillis() - moscowDate(a.start_date).toMillis(),
  );

  const openForm = (period?: TTherapistStatus) => {
    setEditing(period ?? null);
    setStatus(period?.status ?? 'vacation');
    setStart(period ? moscowDate(period.start_date) : null);
    setEnd(period ? moscowDate(period.end_date) : null);
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    const startDate = start;
    const endDate = end;
    if (!startDate || !endDate || !startDate.isValid || !endDate.isValid) {
      setErrorMessage('Укажите дату и время начала и окончания периода.');
      return;
    }
    if (startDate >= endDate) {
      setErrorMessage('Окончание периода должно быть позже начала.');
      return;
    }
    const body = {
      status,
      start_date: toApiDate(startDate),
      end_date: toApiDate(endDate),
    };
    if (editing && samePeriod(editing, body)) {
      closeForm();
      return;
    }
    if (
      periods.some(
        (period) =>
          period.id !== editing?.id &&
          startDate < moscowDate(period.end_date) &&
          endDate > moscowDate(period.start_date),
      )
    ) {
      setErrorMessage(
        'Этот период пересекается с отпуском или больничным. Измените даты и время.',
      );
      return;
    }
    setErrorMessage('');
    saveMutation.mutate(body);
  };

  return (
    <section className={styles.section} aria-labelledby="absences-heading">
      <div className={styles.header}>
        <h2 id="absences-heading">Отпуск и больничный</h2>
        {!isFormOpen && (
          <Button disabled={disabled} onClick={() => openForm()}>
            Добавить период
          </Button>
        )}
      </div>

      {query.isPending && <p role="status">Загрузка периодов…</p>}
      {query.isError && (
        <Alert
          action={
            <Button
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Повторить
            </Button>
          }
          showIcon
          title={statusError(query.error, 'Не удалось загрузить периоды.')}
          type="error"
        />
      )}
      {errorMessage && <Alert showIcon title={errorMessage} type="error" />}

      {isFormOpen && (
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <h3>{editing ? 'Изменить период' : 'Новый период'}</h3>
          <fieldset className={styles.kind} disabled={disabled}>
            <legend>Тип периода</legend>
            {(['vacation', 'sick'] as const).map((value) => (
              <label key={value}>
                <input
                  checked={status === value}
                  name="absence-status"
                  type="radio"
                  value={value}
                  onChange={() => setStatus(value)}
                />
                {statusNames[value]}
              </label>
            ))}
          </fieldset>
          <div className={styles.field}>
            <div className={styles.rangeLabels}>
              <label htmlFor="absence-start">Начало</label>
              <label htmlFor="absence-end">Окончание</label>
            </div>
            <DatePicker.RangePicker
              className={styles.datePicker}
              classNames={{ popup: { root: styles.calendarPopup } }}
              disabled={disabled}
              format="DD.MM.YYYY HH:mm"
              id={{ start: 'absence-start', end: 'absence-end' }}
              needConfirm={false}
              panelRender={(panel) => (
                <div data-psychologist-absence-calendar>{panel}</div>
              )}
              placeholder={['Дата и время начала', 'Дата и время окончания']}
              popupAlign={{
                offset: [0, 0],
                overflow: {
                  adjustX: true,
                  adjustY: true,
                  shiftX: true,
                  shiftY: true,
                },
              }}
              showTime={{ format: 'HH:mm' }}
              size="large"
              value={[start, end]}
              onCalendarChange={handleDatesChange}
              onChange={handleDatesChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
            />
          </div>
          <div className={styles.actions}>
            <Button disabled={isPending} onClick={closeForm}>
              Отмена
            </Button>
            <Button
              disabled={disabled}
              htmlType="submit"
              loading={saveMutation.isPending}
              type="primary"
            >
              {editing ? 'Сохранить изменения' : 'Добавить'}
            </Button>
          </div>
        </form>
      )}

      {!query.isPending && !query.isError && !periods.length && (
        <p className={styles.hint}>Периодов отпуска и больничного пока нет.</p>
      )}
      {!!periods.length && (
        <ul className={styles.list} aria-label="Периоды отсутствия">
          {periods.map((period) => (
            <li className={styles.period} key={period.id}>
              <div className={styles.details}>
                <h3>{statusNames[period.status]}</h3>
                <p>
                  <time dateTime={period.start_date}>
                    {displayDate(period.start_date)}
                  </time>
                  {' — '}
                  <time dateTime={period.end_date}>
                    {displayDate(period.end_date)}
                  </time>
                </p>
              </div>
              <div className={styles.actions}>
                <Button disabled={disabled} onClick={() => openForm(period)}>
                  Изменить
                </Button>
                <Popconfirm
                  cancelText="Отмена"
                  description={`${statusNames[period.status]}: ${displayDate(period.start_date)} — ${displayDate(period.end_date)}`}
                  disabled={disabled}
                  okText="Удалить"
                  title="Удалить период?"
                  onConfirm={() => {
                    if (!disabled) deleteMutation.mutate(period);
                  }}
                >
                  <Button danger disabled={disabled}>
                    Удалить
                  </Button>
                </Popconfirm>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
