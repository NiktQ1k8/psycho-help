import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Empty, Input, Result } from 'antd';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import { applicationQueries } from '@/entities/application/api';
import {
  appointmentQueries,
  appointmentQueryKey,
  completeAppointment,
  requestAppointmentReschedule,
} from '@/entities/appointment/api';
import { AppointmentStatusTag } from '@/entities/appointment/status';
import { useAuth } from '@/entities/auth/model/useAuth';
import { Role } from '@/entities/role/helpers';
import {
  CONSULTATION_TIMES,
  isConsultationTimeValid,
} from '@/features/personal-cabinet/model/consultation-time';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import PsychologistRejectModal from '@/features/personal-cabinet/ui/PsychologistRejectModal';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import { getTabsForRole } from '@/pages/personal-cabinet/config/tabs';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistAppointmentPage.module.scss';

const TYPE_LABELS: Record<string, string> = {
  Online: 'Онлайн',
  Offline: 'Очно',
};

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  return moscowDate(iso).toFormat('d MMMM yyyy');
};

const formatTime = (iso?: string | null) => {
  if (!iso) return null;
  return moscowDate(iso).toFormat('HH:mm');
};

const PsychologistAppointmentPage = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const appointmentId = id || '';

  const isStaff = new Role(user?.roles ?? []).isStaff();

  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...appointmentQueries.byId(id!),
    enabled: isStaff && !!id,
  });

  const { data: application, error: applicationError } = useQuery(
    applicationQueries.byId(appointment?.application_id || ''),
  );
  const reason = application?.problem_description || appointment?.reason;

  const {
    data: reschedules,
    isLoading: isLoadingReschedules,
    error: reschedulesError,
    refetch: refetchReschedules,
  } = useQuery({
    ...appointmentQueries.reschedules(appointmentId),
    enabled: isStaff && appointment?.status === 'awaiting',
  });
  const pendingRequest = reschedules?.find(
    (request) => request.status === 'pending',
  );
  const scheduleDraftKey = `appointment:${appointmentId}`;
  const scheduleDraft = usePsychologistDrafts(
    (state) => state.offerDrafts[scheduleDraftKey],
  );
  const setScheduleDraft = usePsychologistDrafts(
    (state) => state.setOfferDraft,
  );
  const clearScheduleDraft = usePsychologistDrafts(
    (state) => state.clearOfferDraft,
  );
  const scheduled = appointment ? moscowDate(appointment.scheduled_time) : null;
  const selectedDate = scheduleDraft?.date
    ? moscowDate(scheduleDraft.date)
    : (scheduled?.startOf('day') ?? null);
  const selectedTime = scheduleDraft?.time ?? scheduled?.toFormat('HH:mm');
  const selectedDateTime =
    selectedDate && selectedTime
      ? moscowDate(`${selectedDate.toFormat('yyyy-MM-dd')}T${selectedTime}`)
      : null;
  const hasScheduleChanges =
    !!selectedDateTime &&
    selectedDateTime.toFormat('yyyy-MM-dd HH:mm') !==
      scheduled?.toFormat('yyyy-MM-dd HH:mm');
  const isScheduleValid =
    !!selectedDateTime && isConsultationTimeValid(selectedDateTime);

  const conclusionDraft = usePsychologistDrafts(
    (state) => state.conclusionDrafts[appointmentId],
  );
  const savedConclusion =
    appointment?.patient_comment ?? appointment?.conclusion ?? '';
  const conclusion = conclusionDraft ?? savedConclusion;
  const hasConclusionChanges = conclusion.trim() !== savedConclusion.trim();
  const completionHint = !conclusion.trim()
    ? 'Заполните заключение по консультации, чтобы завершить запись.'
    : !hasConclusionChanges
      ? 'Заключение не изменено. Внесите изменения, чтобы завершить запись.'
      : '';
  const actionHint = hasScheduleChanges
    ? isScheduleValid
      ? 'Новое время вступит в силу после подтверждения студентом. При отказе запись будет отменена.'
      : 'Выберите будущее время консультации'
    : completionHint;

  const setConclusionDraft = usePsychologistDrafts(
    (state) => state.setConclusionDraft,
  );
  const clearConclusionDraft = usePsychologistDrafts(
    (state) => state.clearConclusionDraft,
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const refreshAppointment = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.byId, id],
      }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.reschedules, appointmentId],
      }),
    ]);

  const handleSaveError = async (error: unknown) => {
    if (
      isAxiosError(error) &&
      [400, 409].includes(error.response?.status ?? 0)
    ) {
      await refreshAppointment();
    }
    message.error(getErrorMessage(error, 'Не удалось сохранить изменения'));
  };

  const completeMutation = useMutation({
    mutationFn: () =>
      completeAppointment(id!, { patient_comment: conclusion.trim() }),
    onSuccess: async () => {
      await refreshAppointment();
      message.success('Запись завершена');
      if (appointmentId) {
        clearConclusionDraft(appointmentId);
      }
      navigate(-1);
    },
    onError: handleSaveError,
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (
        !hasScheduleChanges ||
        !selectedDateTime ||
        !isConsultationTimeValid(selectedDateTime)
      ) {
        throw new Error('Выберите новое будущее время');
      }
      return requestAppointmentReschedule(appointmentId, {
        scheduled_time: toApiDate(selectedDateTime),
      });
    },
    onSuccess: async () => {
      clearScheduleDraft(scheduleDraftKey);
      await refreshAppointment();
      message.success('Перенос отправлен на подтверждение студенту');
    },
    onError: handleSaveError,
  });
  const isSaving = completeMutation.isPending || rescheduleMutation.isPending;
  const canEditSchedule =
    !isSaving && !isLoadingReschedules && !reschedulesError && !pendingRequest;

  if (!isStaff) return <Navigate to={SLUG.MAIN} replace />;
  if (isLoading) return <Loader />;
  if (isError) {
    const detail = getErrorMessage(error);
    return (
      <Result
        status="error"
        title="Не удалось загрузить запись"
        subTitle={detail || 'Попробуйте обновить страницу или вернитесь назад'}
        extra={<BackButton text="Вернуться назад" />}
      />
    );
  }
  if (!appointment) return <Empty description="Запись не найдена" />;

  const statusUI = AppointmentStatusTag[appointment.status];
  const patientName =
    [
      appointment.patient?.last_name,
      appointment.patient?.first_name,
      appointment.patient?.middle_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Имя не указано';

  return (
    <div className={styles.page}>
      <div className={styles.sidebarWrapper}>
        <Sidebar
          user={user}
          activeTab="psychologistAppointments"
          tabs={getTabsForRole('psychologist')}
        />
      </div>

      <article className={styles.wrapper}>
        <BackButton text="Вернуться назад" />

        <h2 className={styles.title}>Запись</h2>

        {appointment.status === 'cancelled' && appointment.cancel_reason && (
          <div className={styles.reasonBlockCancelled}>
            <span className={styles.reasonLabel}>Причина отмены:</span>
            <span className={styles.reasonText}>
              {appointment.cancel_reason}
            </span>
          </div>
        )}

        <div className={styles.infoBlock}>
          {patientName && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Пациент</span>
              <span className={styles.infoName}>{patientName}</span>
            </div>
          )}
          {statusUI && (
            <div className={styles.infoRow}>
              <span className={styles.statusLabel}>Статус</span>
              <div className={styles['status']}>
                <div
                  className={clsx(
                    styles['status-dot'],
                    styles[statusUI.className],
                  )}
                />
                <span className={styles['status-text']}>{statusUI.text}</span>
              </div>
            </div>
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValueGrid}>
                {appointment.patient?.email || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Телефон</span>
              <span className={styles.infoValueGrid}>
                {appointment.patient?.phone_number || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Соцсети</span>
              <span className={styles.infoValueGrid}>
                {appointment.patient?.social_media || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Группа</span>
              <span className={styles.infoValueGrid}>
                {appointment.patient?.study_group || '—'}
              </span>
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoRowGrid}>
              <label className={styles.infoLabel} htmlFor="appointment-date">
                Дата
              </label>
              {appointment.status === 'awaiting' ? (
                <DatePicker
                  className={styles.datePicker}
                  id="appointment-date"
                  value={selectedDate}
                  format="DD.MM.YYYY"
                  allowClear={false}
                  disabled={!canEditSchedule}
                  disabledDate={(current) =>
                    current.startOf('day') < moscowDate().startOf('day')
                  }
                  onChange={(date) =>
                    date &&
                    setScheduleDraft(scheduleDraftKey, {
                      date: date.toFormat('yyyy-MM-dd'),
                    })
                  }
                />
              ) : (
                <span className={styles.infoValueGrid}>
                  {formatDate(appointment.scheduled_time) || '—'}
                </span>
              )}
            </div>
            <div className={styles.infoRowGrid}>
              <label className={styles.infoLabel} htmlFor="appointment-time">
                Время
              </label>
              {appointment.status === 'awaiting' ? (
                <select
                  id="appointment-time"
                  className={styles.timeSelect}
                  value={selectedTime ?? ''}
                  disabled={!canEditSchedule}
                  onChange={(event) =>
                    setScheduleDraft(scheduleDraftKey, {
                      time: event.currentTarget.value,
                    })
                  }
                >
                  {selectedTime &&
                    !CONSULTATION_TIMES.includes(selectedTime) && (
                      <option value={selectedTime} disabled>
                        {selectedTime}
                      </option>
                    )}
                  {CONSULTATION_TIMES.map((time) => (
                    <option
                      key={time}
                      value={time}
                      disabled={
                        !selectedDate ||
                        !isConsultationTimeValid(
                          moscowDate(
                            `${selectedDate.toFormat('yyyy-MM-dd')}T${time}`,
                          ),
                        )
                      }
                    >
                      {time}
                    </option>
                  ))}
                </select>
              ) : (
                <span className={styles.infoValueGrid}>
                  {formatTime(appointment.scheduled_time) || '—'}
                </span>
              )}
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValueGrid}>
                {TYPE_LABELS[appointment.type] || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Место</span>
              <span className={styles.infoValueGrid}>
                {appointment.venue || '—'}
              </span>
            </div>
          </div>

          {appointment.status === 'awaiting' && (
            <div className={styles.scheduleInfo}>
              {isLoadingReschedules && <p>Загрузка данных переноса…</p>}
              {reschedulesError && (
                <Alert
                  type="error"
                  showIcon
                  message="Не удалось проверить перенос записи"
                  description={getErrorMessage(reschedulesError)}
                  action={
                    <Button onClick={() => void refetchReschedules()}>
                      Повторить
                    </Button>
                  }
                />
              )}
              {pendingRequest && (
                <Alert
                  type="info"
                  showIcon
                  message="Ожидаем подтверждения переноса"
                  description={`Предложено: ${moscowDate(pendingRequest.requested_scheduled_time).toFormat('d MMMM yyyy, HH:mm')} по Москве. До подтверждения действует прежнее время. При отказе студента запись будет отменена.`}
                />
              )}
            </div>
          )}

          {applicationError && (
            <Alert
              type="error"
              message="Не удалось загрузить данные заявки"
              description={getErrorMessage(applicationError)}
            />
          )}
          {reason && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Тема встречи</span>
              <span className={styles.infoValue}>{reason}</span>
            </div>
          )}

          {appointment.comment && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Комментарий</span>
              <span className={styles.infoValue}>{appointment.comment}</span>
            </div>
          )}

          {appointment.status === 'done' && appointment.conclusion && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Заключение</span>
              <span className={styles.infoValue}>{appointment.conclusion}</span>
            </div>
          )}

          {appointment.status === 'awaiting' && !hasScheduleChanges && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Заключение</span>
              <span className={styles.infoValue}>
                <Input.TextArea
                  rows={4}
                  value={conclusion}
                  onChange={(e) =>
                    setConclusionDraft(appointment.id, e.target.value)
                  }
                  placeholder="Введите заключение по консультации"
                  maxLength={2048}
                  showCount
                  disabled={isSaving}
                />
              </span>
            </div>
          )}
        </div>

        {appointment.status === 'awaiting' && actionHint && (
          <Alert
            id="appointment-requirements"
            className={styles.actionHint}
            type="info"
            showIcon
            message={actionHint}
          />
        )}

        {appointment.status === 'awaiting' && (
          <div className={styles.actions}>
            <button
              className={styles.actionButtonEnd}
              onClick={() =>
                hasScheduleChanges
                  ? rescheduleMutation.mutate()
                  : completeMutation.mutate()
              }
              disabled={
                isSaving ||
                (hasScheduleChanges
                  ? !canEditSchedule || !isScheduleValid
                  : !!completionHint)
              }
              aria-describedby={
                actionHint ? 'appointment-requirements' : undefined
              }
              type="button"
            >
              {hasScheduleChanges
                ? rescheduleMutation.isPending
                  ? 'Перенос...'
                  : 'Перенести'
                : completeMutation.isPending
                  ? 'Завершение...'
                  : 'Завершить'}
            </button>
            <button
              className={styles.actionButtonCancel}
              onClick={() => setCancelModalOpen(true)}
              disabled={isSaving}
              type="button"
            >
              Отменить
            </button>
            {hasScheduleChanges && (
              <Button
                className={styles.resetScheduleButton}
                disabled={isSaving}
                onClick={() => clearScheduleDraft(scheduleDraftKey)}
              >
                Сбросить дату и время
              </Button>
            )}
          </div>
        )}

        <PsychologistRejectModal
          type="appointment"
          entityId={cancelModalOpen ? id! : null}
          onClose={() => setCancelModalOpen(false)}
          onSuccess={() => {
            message.success('Запись отменена');
            navigate(-1);
          }}
        />
      </article>
    </div>
  );
};

export default PsychologistAppointmentPage;
