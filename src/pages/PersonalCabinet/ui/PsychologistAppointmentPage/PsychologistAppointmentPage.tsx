import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Empty, Result } from 'antd';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import type { DateTime } from 'luxon';
import {
  appointmentQueries,
  appointmentQueryKey,
  completeAppointment,
  requestAppointmentReschedule,
  updateAppointmentEmergencyContact,
} from '@/entities/appointment/api';
import { getRescheduleDescription } from '@/entities/appointment/reschedule';
import { AppointmentStatusTag } from '@/entities/appointment/status';
import { useAuth } from '@/entities/auth/model/useAuth';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { Role } from '@/entities/role/helpers';
import { therapistQueryKey } from '@/entities/therapist/queries';
import { isConsultationTimeValid } from '@/features/personal-cabinet/model/consultation-time';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import { PsychologistCancelModal } from '@/features/personal-cabinet/ui/PsychologistCancelModal/PsychologistCancelModal';
import { Sidebar } from '@/features/personal-cabinet/ui/Sidebar/Sidebar';
import { getTabsForRole } from '@/pages/PersonalCabinet/config/tabs';
import { getRequestErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import './PsychologistAppointmentPage.antd.scss';
import styles from './PsychologistAppointmentPage.module.scss';

const TYPE_LABELS: Record<string, string> = {
  Online: 'Онлайн',
  Offline: 'Очно',
};

export const PsychologistAppointmentPage = () => {
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
    ...appointmentQueries.byId(appointmentId),
    enabled: isStaff && !!id,
  });

  const reason = appointment?.reason;

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
  const scheduleDraft = usePsychologistDrafts(
    (state) => state.scheduleDrafts[appointmentId],
  );
  const setScheduleDraft = usePsychologistDrafts(
    (state) => state.setScheduleDraft,
  );
  const clearScheduleDraft = usePsychologistDrafts(
    (state) => state.clearScheduleDraft,
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
  const venue = scheduleDraft?.venue ?? appointment?.venue ?? '';
  const comment = scheduleDraft?.comment ?? appointment?.comment ?? '';
  const [contactDrafts, setContactDrafts] = useState<Record<string, string>>(
    {},
  );
  const contact =
    contactDrafts[appointmentId] ?? appointment?.emergency_contact ?? '';
  const hasContactChanges =
    contact.trim() !== (appointment?.emergency_contact?.trim() ?? '');
  const hasVenueChanges = venue.trim() !== (appointment?.venue.trim() ?? '');
  const hasCommentChanges =
    comment.trim() !== (appointment?.comment?.trim() ?? '');
  const hasAppointmentChanges =
    hasScheduleChanges || hasVenueChanges || hasCommentChanges;
  const isScheduleValid =
    !!selectedDateTime && isConsultationTimeValid(selectedDateTime);
  const changeHint = !isScheduleValid
    ? 'Выберите будущее время консультации'
    : !venue.trim()
      ? 'Укажите место или ссылку на консультацию'
      : venue.trim().length > 128
        ? 'Сократите место или ссылку до 128 символов'
        : comment.trim().length > 512
          ? 'Сократите комментарий к записи до 512 символов'
          : '';

  const patientCommentDraft = usePsychologistDrafts(
    (state) => state.patientCommentDrafts[appointmentId],
  );
  const savedPatientComment = appointment?.patient_comment ?? '';
  const patientComment = patientCommentDraft ?? savedPatientComment;
  const psychologistComment = usePsychologistDrafts(
    (state) => state.psychologistCommentDrafts[appointmentId] ?? '',
  );
  const setPsychologistCommentDraft = usePsychologistDrafts(
    (state) => state.setPsychologistCommentDraft,
  );
  const clearPsychologistCommentDraft = usePsychologistDrafts(
    (state) => state.clearPsychologistCommentDraft,
  );
  const completionHint = hasContactChanges
    ? 'Сохраните или сбросьте изменения экстренного контакта перед завершением записи.'
    : !patientComment.trim()
      ? 'Заполните комментарий для пациента, чтобы завершить запись.'
      : !psychologistComment.trim()
        ? 'Заполните внутренний комментарий для психологов, чтобы завершить запись.'
        : patientComment.trim().length > 2048 ||
            psychologistComment.trim().length > 2048
          ? 'Сократите каждый комментарий до 2048 символов.'
          : '';
  const actionHint = hasAppointmentChanges
    ? changeHint ||
      'Изменения вступят в силу после подтверждения пациентом. При отказе запись будет отменена.'
    : completionHint;

  const setPatientCommentDraft = usePsychologistDrafts(
    (state) => state.setPatientCommentDraft,
  );
  const clearPatientCommentDraft = usePsychologistDrafts(
    (state) => state.clearPatientCommentDraft,
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const refreshAppointment = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [therapistQueryKey.schedule] }),
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.byId, appointmentId],
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
    message.error(
      getRequestErrorMessage(
        error,
        'Не удалось сохранить изменения. Обновите запись и повторите попытку.',
      ),
    );
  };

  const completeMutation = useMutation({
    mutationFn: () => {
      if (completionHint) throw new Error(completionHint);
      return completeAppointment(appointmentId, {
        patient_comment: patientComment.trim(),
        psychologist_comment: psychologistComment.trim(),
      });
    },
    onSuccess: async () => {
      await refreshAppointment();
      message.success('Запись завершена');
      clearPatientCommentDraft(appointmentId);
      clearPsychologistCommentDraft(appointmentId);
      clearScheduleDraft(appointmentId);
      navigate(-1);
    },
    onError: handleSaveError,
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => {
      if (
        !hasAppointmentChanges ||
        changeHint ||
        !selectedDateTime ||
        !isConsultationTimeValid(selectedDateTime)
      ) {
        throw new Error(changeHint || 'Измените данные записи');
      }
      return requestAppointmentReschedule(appointmentId, {
        scheduled_time: toApiDate(selectedDateTime),
        ...(hasVenueChanges ? { venue: venue.trim() } : {}),
        ...(hasCommentChanges ? { comment: comment.trim() } : {}),
      });
    },
    onSuccess: async () => {
      clearScheduleDraft(appointmentId);
      await refreshAppointment();
      message.success('Изменения отправлены на подтверждение пациенту');
    },
    onError: async (error) => {
      if (
        !hasScheduleChanges &&
        isAxiosError(error) &&
        error.response?.status === 409
      ) {
        await refreshAppointment();
        message.error(
          'Не удалось изменить запись без переноса времени. Выберите другую дату или время и повторите отправку.',
        );
        return;
      }
      await handleSaveError(error);
    },
  });
  const contactMutation = useMutation({
    mutationFn: ({ id, contact }: { id: string; contact: string }) =>
      updateAppointmentEmergencyContact(id, {
        emergency_contact: contact.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData([appointmentQueryKey.byId, updated.id], updated);
      void queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.list],
      });
      setContactDrafts((drafts) => {
        const { [updated.id]: _removed, ...rest } = drafts;
        return rest;
      });
      message.success('Экстренный контакт сохранён');
    },
    onError: (error, variables) => {
      if (
        isAxiosError(error) &&
        [404, 409].includes(error.response?.status ?? 0)
      ) {
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.byId, variables.id],
        });
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.list],
        });
      }
    },
  });
  const contactError =
    contactMutation.variables?.id === appointmentId
      ? contactMutation.error
      : null;
  const contactErrorStatus = isAxiosError(contactError)
    ? contactError.response?.status
    : undefined;
  const contactUnavailable =
    contactErrorStatus === 404 || contactErrorStatus === 409;
  const contactErrorMessage = !contactError
    ? ''
    : contactErrorStatus === 409
      ? 'Запись уже завершена или отменена. Изменить экстренный контакт больше нельзя.'
      : contactErrorStatus === 404
        ? 'Запись не найдена или доступ к ней изменился. Обновите страницу.'
        : contactErrorStatus === 422
          ? 'Не удалось сохранить контакт. Укажите не более 512 символов.'
          : getRequestErrorMessage(
              contactError,
              'Не удалось сохранить контакт. Повторите попытку.',
            );
  const isSaving =
    completeMutation.isPending ||
    rescheduleMutation.isPending ||
    contactMutation.isPending;
  const canEditSchedule =
    !isSaving && !isLoadingReschedules && !reschedulesError && !pendingRequest;

  if (!isStaff) return <Navigate replace to={SLUG.MAIN} />;
  if (isLoading) return <Loader />;
  if (isError) {
    return (
      <Result
        extra={<BackButton text="Вернуться назад" />}
        status="error"
        subTitle={getRequestErrorMessage(error)}
        title="Не удалось загрузить запись"
      />
    );
  }
  if (!appointment) return <Empty description="Запись не найдена" />;

  const statusUI = AppointmentStatusTag[appointment.status];
  const patientName = getUserFullName(appointment.patient);

  return (
    <div className={styles.page} data-psychologist-appointment>
      <div className={styles.sidebarWrapper}>
        <Sidebar
          activeTab="psychologistAppointments"
          tabs={getTabsForRole('psychologist')}
          user={user}
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
              <span className={styles.infoLabel}>Статус</span>
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
              <span className={styles.infoLabel}>Формат</span>
              <span className={styles.infoValueGrid}>
                {TYPE_LABELS[appointment.type] || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Длительность</span>
              <span className={styles.infoValueGrid}>
                {appointment.duration} минут
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <label className={styles.infoLabel} htmlFor="appointment-date">
                Дата
              </label>
              {appointment.status === 'awaiting' ? (
                <DatePicker<DateTime>
                  allowClear={false}
                  disabled={!canEditSchedule}
                  disabledDate={(current) =>
                    current.startOf('day') < moscowDate().startOf('day')
                  }
                  format="DD.MM.YYYY"
                  id="appointment-date"
                  value={selectedDate}
                  onChange={(date) =>
                    date &&
                    setScheduleDraft(appointmentId, {
                      date: date.toFormat('yyyy-MM-dd'),
                    })
                  }
                />
              ) : (
                <span className={styles.infoValueGrid}>
                  {scheduled?.toFormat('d MMMM yyyy')}
                </span>
              )}
            </div>
            <div className={styles.infoRowGrid}>
              <label className={styles.infoLabel} htmlFor="appointment-time">
                Время
              </label>
              {appointment.status === 'awaiting' ? (
                <DatePicker.TimePicker<DateTime>
                  className={styles.timePicker}
                  allowClear={false}
                  disabled={!canEditSchedule}
                  format="HH:mm"
                  id="appointment-time"
                  placeholder="Выберите время"
                  value={selectedDateTime}
                  onChange={(time) =>
                    time &&
                    setScheduleDraft(appointmentId, {
                      time: time.toFormat('HH:mm'),
                    })
                  }
                />
              ) : (
                <span className={styles.infoValueGrid}>
                  {scheduled?.toFormat('HH:mm')}
                </span>
              )}
            </div>
            <div className={clsx(styles.infoRowGrid, styles.venueRow)}>
              <label className={styles.infoLabel} htmlFor="appointment-venue">
                {appointment.type === 'Online'
                  ? 'Ссылка на консультацию'
                  : 'Место'}
              </label>
              {appointment.status === 'awaiting' ? (
                <input
                  className={styles.venueInput}
                  disabled={!canEditSchedule}
                  id="appointment-venue"
                  maxLength={128}
                  placeholder={
                    appointment.type === 'Online'
                      ? 'Ссылка на встречу'
                      : 'Адрес и кабинет'
                  }
                  type="text"
                  value={venue}
                  onChange={(event) =>
                    setScheduleDraft(appointmentId, {
                      venue: event.target.value,
                    })
                  }
                />
              ) : (
                <span className={styles.infoValueGrid}>
                  {appointment.venue || '—'}
                </span>
              )}
            </div>
          </div>

          {appointment.status === 'awaiting' && (
            <div className={styles.scheduleInfo}>
              {isLoadingReschedules && <p>Загрузка данных переноса…</p>}
              {reschedulesError && (
                <Alert
                  action={
                    <Button onClick={() => void refetchReschedules()}>
                      Повторить
                    </Button>
                  }
                  description={getRequestErrorMessage(reschedulesError)}
                  showIcon
                  title="Не удалось проверить перенос записи"
                  type="error"
                />
              )}
              {pendingRequest && (
                <Alert
                  description={
                    <div className={styles.changeSummary}>
                      {getRescheduleDescription(pendingRequest)}
                      {
                        '\nДо подтверждения действуют прежние данные. При отказе пациента запись будет отменена.'
                      }
                    </div>
                  }
                  showIcon
                  title="Ожидаем подтверждения изменений"
                  type="info"
                />
              )}
              {hasAppointmentChanges &&
                !hasScheduleChanges &&
                !pendingRequest && (
                  <Alert
                    showIcon
                    title="Для изменения места или комментария выберите также другую дату или время"
                    type="warning"
                  />
                )}
            </div>
          )}

          {reason && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Тема встречи</span>
              <span className={styles.infoValue}>{reason}</span>
            </div>
          )}

          <div className={styles.infoRow}>
            <label
              className={styles.infoLabel}
              htmlFor="appointment-emergency-contact"
            >
              Экстренный контакт
            </label>
            <textarea
              className={styles.textarea}
              aria-describedby="appointment-emergency-contact-hint"
              disabled={isSaving}
              id="appointment-emergency-contact"
              maxLength={512}
              placeholder={
                appointment.status === 'awaiting'
                  ? 'Например, мама Анна, +7 999 123-45-67'
                  : 'Не указан'
              }
              readOnly={appointment.status !== 'awaiting' || contactUnavailable}
              rows={3}
              value={
                appointment.status === 'awaiting'
                  ? contact
                  : (appointment.emergency_contact ?? '')
              }
              onChange={(event) =>
                setContactDrafts((drafts) => ({
                  ...drafts,
                  [appointmentId]: event.target.value,
                }))
              }
            />
            <p
              className={styles.fieldHint}
              id="appointment-emergency-contact-hint"
            >
              {appointment.status === 'awaiting'
                ? 'Контакт виден пациенту. Чтобы удалить контакт, очистите поле и сохраните.'
                : 'После завершения или отмены записи контакт доступен только для просмотра.'}
            </p>
            {contactErrorMessage && (
              <Alert
                className={styles.contactError}
                showIcon
                title={contactErrorMessage}
                type="error"
              />
            )}
            {appointment.status === 'awaiting' && hasContactChanges && (
              <div className={styles.contactActions}>
                <Button
                  disabled={
                    isSaving ||
                    contactUnavailable ||
                    contact.trim().length > 512
                  }
                  loading={contactMutation.isPending}
                  type="primary"
                  onClick={() => {
                    if (
                      !isSaving &&
                      !contactUnavailable &&
                      contact.trim().length <= 512
                    ) {
                      contactMutation.mutate({ id: appointmentId, contact });
                    }
                  }}
                >
                  Сохранить контакт
                </Button>
                <Button
                  disabled={isSaving}
                  onClick={() => {
                    setContactDrafts((drafts) => {
                      const { [appointmentId]: _removed, ...rest } = drafts;
                      return rest;
                    });
                    contactMutation.reset();
                  }}
                >
                  Сбросить
                </Button>
              </div>
            )}
          </div>

          {(appointment.status === 'awaiting' || appointment.comment) && (
            <div className={styles.infoRow}>
              <label className={styles.infoLabel} htmlFor="appointment-comment">
                Комментарий к записи
              </label>
              {appointment.status === 'awaiting' ? (
                <>
                  <textarea
                    className={styles.textarea}
                    aria-describedby="appointment-comment-hint"
                    disabled={!canEditSchedule}
                    id="appointment-comment"
                    maxLength={512}
                    placeholder="Организационные детали консультации"
                    rows={3}
                    value={comment}
                    onChange={(event) =>
                      setScheduleDraft(appointmentId, {
                        comment: event.target.value,
                      })
                    }
                  />
                  <p className={styles.fieldHint} id="appointment-comment-hint">
                    Пациент увидит этот комментарий. Изменения требуют его
                    подтверждения.
                  </p>
                </>
              ) : (
                <span className={styles.infoValue}>{appointment.comment}</span>
              )}
            </div>
          )}

          {appointment.status === 'done' && savedPatientComment && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Комментарий для пациента</span>
              <span className={styles.infoValue}>{savedPatientComment}</span>
            </div>
          )}

          {appointment.status === 'awaiting' && !hasAppointmentChanges && (
            <>
              <div className={styles.infoRow}>
                <label className={styles.infoLabel} htmlFor="patient-comment">
                  Комментарий для пациента при завершении
                </label>
                <textarea
                  className={styles.textarea}
                  disabled={isSaving}
                  id="patient-comment"
                  maxLength={2048}
                  placeholder="Итоги консультации и рекомендации пациенту"
                  rows={4}
                  value={patientComment}
                  onChange={(e) =>
                    setPatientCommentDraft(appointment.id, e.target.value)
                  }
                />
              </div>
              <div className={styles.infoRow}>
                <label
                  className={styles.infoLabel}
                  htmlFor="psychologist-comment"
                >
                  Внутренний комментарий для психологов при завершении
                </label>
                <textarea
                  className={styles.textarea}
                  aria-describedby="psychologist-comment-hint"
                  disabled={isSaving}
                  id="psychologist-comment"
                  maxLength={2048}
                  placeholder="Заметки для психологов"
                  rows={4}
                  value={psychologistComment}
                  onChange={(event) =>
                    setPsychologistCommentDraft(
                      appointment.id,
                      event.target.value,
                    )
                  }
                />
                <p className={styles.fieldHint} id="psychologist-comment-hint">
                  Пациенту этот текст не передаётся. После завершения он
                  сохраняется, но его просмотр пока недоступен.
                </p>
              </div>
            </>
          )}
        </div>

        {appointment.status === 'awaiting' && actionHint && (
          <Alert
            className={styles.actionHint}
            id="appointment-requirements"
            showIcon
            title={actionHint}
            type="info"
          />
        )}

        {appointment.status === 'awaiting' && (
          <div className={styles.actions}>
            <button
              className={styles.actionButtonEnd}
              aria-describedby={
                actionHint ? 'appointment-requirements' : undefined
              }
              disabled={
                isSaving ||
                (hasAppointmentChanges
                  ? !canEditSchedule || !!changeHint
                  : !!completionHint)
              }
              type="button"
              onClick={() =>
                hasAppointmentChanges
                  ? rescheduleMutation.mutate()
                  : completeMutation.mutate()
              }
            >
              {hasAppointmentChanges
                ? rescheduleMutation.isPending
                  ? 'Отправка...'
                  : 'Отправить изменения'
                : completeMutation.isPending
                  ? 'Завершение...'
                  : 'Завершить'}
            </button>
            <button
              className={styles.actionButtonCancel}
              disabled={isSaving}
              type="button"
              onClick={() => setCancelModalOpen(true)}
            >
              Отменить
            </button>
            {hasAppointmentChanges && (
              <Button
                className={styles.resetScheduleButton}
                disabled={isSaving}
                onClick={() => clearScheduleDraft(appointmentId)}
              >
                Сбросить изменения записи
              </Button>
            )}
          </div>
        )}

        <PsychologistCancelModal
          appointmentId={cancelModalOpen ? appointmentId : null}
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
