import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Empty, Input, Result } from 'antd';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import type { DateTime } from 'luxon';
import {
  acceptApplication,
  applicationQueries,
  applicationQueryKey,
  offerConsultation,
} from '@/entities/application/api';
import { getApplicationMeetingType } from '@/entities/application/meeting';
import type { TMeetingType } from '@/entities/application/types';
import { useAuth } from '@/entities/auth/model/useAuth';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { Role } from '@/entities/role/helpers';
import { therapistQueries } from '@/entities/therapist/queries';
import {
  CONSULTATION_TIMES,
  isConsultationTimeValid,
} from '@/features/personal-cabinet/model/consultation-time';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import PsychologistRejectModal from '@/features/personal-cabinet/ui/PsychologistRejectModal';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import { getTabsForRole } from '@/pages/personal-cabinet/config/tabs';
import { ApplicationStatusTag } from '@/pages/personal-cabinet/constants';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import './PsychologistApplicationPage.antd.scss';
import styles from './PsychologistApplicationPage.module.scss';

const MEETING_TYPE_OPTIONS = [
  { value: 'online' as const, label: 'Онлайн' },
  { value: 'offline' as const, label: 'Очно' },
];

const getMoscowDateTime = (date: DateTime, time: string) =>
  moscowDate(`${date.toFormat('yyyy-MM-dd')}T${time}`);

type TExpandableTextProps = {
  text: string;
};

const ExpandableText: React.FC<TExpandableTextProps> = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  if (!text) return null;
  return (
    <div className={styles.dataValueDescriptionWrapper}>
      <span
        className={`${styles.dataValueDescription} ${isExpanded ? styles.expanded : ''}`}
      >
        {text}
      </span>
      {text.length > 100 && (
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
        >
          {isExpanded ? 'Свернуть' : 'Открыть полностью'}
        </button>
      )}
    </div>
  );
};

const PsychologistApplicationPage = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const userId = user?.id;

  const isStaff = new Role(user?.roles ?? []).isStaff();

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...applicationQueries.byId(id!),
    enabled: isStaff && !!id,
  });

  const {
    data: psychologists = [],
    isLoading: isLoadingPsychologists,
    error: psychologistsError,
    refetch: refetchPsychologists,
  } = useQuery({
    ...therapistQueries.list(),
    enabled:
      isStaff &&
      ['new', 'in_progress', 'awaiting_user_confirmation'].includes(
        application?.status ?? '',
      ),
  });

  const draft = usePsychologistDrafts((state) =>
    id ? state.offerDrafts[id] : undefined,
  );
  const setOfferDraft = usePsychologistDrafts((state) => state.setOfferDraft);
  const clearOfferDraft = usePsychologistDrafts(
    (state) => state.clearOfferDraft,
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const selectedPsychologistId =
    psychologists.find(
      (psychologist) => psychologist.id === draft?.psychologistId,
    )?.id ??
    application?.psychologist?.id ??
    '';

  const scheduledAt = application?.scheduled_at;
  const applicationScheduledAt = useMemo(
    () => (scheduledAt ? moscowDate(scheduledAt) : null),
    [scheduledAt],
  );

  const meetingType =
    draft?.meetingType ??
    (application ? getApplicationMeetingType(application) : 'online');

  const selectedDate = draft?.date
    ? moscowDate(draft.date)
    : applicationScheduledAt?.startOf('day') || null;
  const selectedTime =
    draft?.time ?? applicationScheduledAt?.toFormat('HH:mm') ?? null;
  const locationAddress =
    draft?.locationAddress ??
    application?.location_address ??
    application?.preferred_campus ??
    '';
  const meetingUrl = draft?.meetingUrl ?? application?.meeting_url ?? '';

  const selectedDateTime =
    selectedDate && selectedTime
      ? getMoscowDateTime(selectedDate, selectedTime)
      : null;

  const times =
    selectedTime && !CONSULTATION_TIMES.includes(selectedTime)
      ? [...CONSULTATION_TIMES, selectedTime].sort()
      : CONSULTATION_TIMES;
  const timeOptions = times.map((slot) => ({
    value: slot,
    label: slot,
    disabled: selectedDate
      ? !isConsultationTimeValid(getMoscowDateTime(selectedDate, slot))
      : !CONSULTATION_TIMES.includes(slot),
  }));

  const refreshApplication = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
      queryClient.invalidateQueries({
        queryKey: [applicationQueryKey.byId, id],
      }),
    ]);

  const handleSaveError = async (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 409) {
      await refreshApplication();
    }
    message.error(getErrorMessage(error, 'Не удалось сохранить изменения'));
  };

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      acceptApplication(applicationId, userId!),
    onSuccess: refreshApplication,
    onError: handleSaveError,
  });

  const offerMutation = useMutation({
    mutationFn: () => {
      if (!selectedPsychologistId) {
        throw new Error('Выберите психолога');
      }
      if (!selectedDateTime || !isConsultationTimeValid(selectedDateTime)) {
        throw new Error('Выберите будущее время консультации');
      }
      return offerConsultation(id!, {
        psychologist_id: selectedPsychologistId,
        meeting_type: meetingType,
        scheduled_at: toApiDate(selectedDateTime),
        location_address:
          meetingType === 'offline' ? locationAddress.trim() : null,
        meeting_url: meetingType === 'online' ? meetingUrl.trim() : null,
      });
    },
    onSuccess: async () => {
      await refreshApplication();
      clearOfferDraft(id!);
      message.success(
        'Консультация предложена, ожидаем подтверждения пользователя',
      );
      navigate(-1);
    },
    onError: handleSaveError,
  });

  if (!isStaff) return <Navigate to={SLUG.MAIN} replace />;
  if (isLoading) return <Loader />;
  if (isError) {
    const detail = getErrorMessage(error);
    return (
      <Result
        status="error"
        title="Не удалось загрузить заявку"
        subTitle={detail || 'Попробуйте обновить страницу или вернитесь назад'}
        extra={<BackButton text="Вернуться назад" />}
      />
    );
  }
  if (!application) return <Empty description="Заявка не найдена" />;
  if (application.status === 'completed') {
    return (
      <Navigate
        to={
          application.appointment
            ? `${SLUG.CABINET_APPOINTMENT}/${application.appointment.id}`
            : `${SLUG.CABINET}?tab=psychologistAppointments`
        }
        replace
      />
    );
  }

  const canAccept = application.status === 'new';
  const isAwaitingConfirmation =
    application.status === 'awaiting_user_confirmation';
  const canChange =
    application.status === 'in_progress' || isAwaitingConfirmation;
  const canReject =
    application.status === 'new' || application.status === 'in_progress';
  const isSaving = acceptMutation.isPending || offerMutation.isPending;
  const canEdit = canChange && !isSaving;

  const hasOfferChanges =
    selectedPsychologistId !== (application.psychologist?.id ?? '') ||
    meetingType !== getApplicationMeetingType(application) ||
    selectedDate?.toFormat('yyyy-MM-dd') !==
      applicationScheduledAt?.toFormat('yyyy-MM-dd') ||
    selectedTime !== (applicationScheduledAt?.toFormat('HH:mm') ?? null) ||
    (meetingType === 'offline'
      ? locationAddress.trim() !==
        (
          application.location_address ??
          application.preferred_campus ??
          ''
        ).trim()
      : meetingUrl.trim() !== (application.meeting_url ?? '').trim());

  const offerIssues: string[] = [];
  if (!selectedPsychologistId) {
    offerIssues.push('Выберите психолога из списка.');
  }
  if (!selectedDate) offerIssues.push('Выберите дату консультации.');
  if (!selectedTime) offerIssues.push('Выберите время консультации.');
  if (selectedDateTime && !isConsultationTimeValid(selectedDateTime)) {
    offerIssues.push('Выберите будущее время консультации');
  }
  if (meetingType === 'offline' && !locationAddress.trim()) {
    offerIssues.push('Укажите адрес проведения очной встречи.');
  }
  if (meetingType === 'offline' && locationAddress.trim().length > 128) {
    offerIssues.push('Сократите адрес встречи до 128 символов.');
  }
  if (meetingType === 'online') {
    if (!meetingUrl.trim())
      offerIssues.push('Укажите ссылку на онлайн-встречу.');
    else if (meetingUrl.trim().length > 128) {
      offerIssues.push('Сократите ссылку на встречу до 128 символов.');
    }
  }

  const canSave =
    canChange &&
    !isSaving &&
    !isLoadingPsychologists &&
    !offerIssues.length &&
    (!isAwaitingConfirmation || hasOfferChanges);

  const disabledDates = (current: DateTime) => {
    return current
      ? current.toFormat('yyyy-MM-dd') < moscowDate().toFormat('yyyy-MM-dd')
      : false;
  };

  const statusUI = ApplicationStatusTag[application.status];
  const userName =
    [
      application.user?.last_name,
      application.user?.first_name,
      application.user?.middle_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Имя не указано';
  const preferPsychologistName = application.psychologist?.user
    ? getUserFullName(application.psychologist.user)
    : '—';

  return (
    <div className={styles.page} data-psychologist-application>
      <div className={styles.sidebarWrapper}>
        <Sidebar
          user={user}
          activeTab="applications"
          tabs={getTabsForRole('psychologist')}
        />
      </div>

      <main className={styles.content}>
        <BackButton text="Вернуться назад" />

        <h1 className={styles.pageTitle}>Заявка</h1>

        <h2 className={styles.userName}>{userName}</h2>

        <div className={styles.statusRow}>
          <p className={styles.statusLabel}>Статус</p>
          <div className={styles['status']}>
            <div
              className={clsx(styles['status-dot'], styles[statusUI.className])}
            />
            <span className={styles['status-text']}>{statusUI.text}</span>
          </div>
        </div>

        {application.status === 'new' && preferPsychologistName && (
          <div className={styles.dataItemFull}>
            <span className={styles.dataLabel}>Предпочитаемый психолог:</span>
            <span className={styles.dataValue}>{preferPsychologistName}</span>
          </div>
        )}

        {application.status === 'rejected' && application.reject_reason && (
          <div className={styles.reasonBlock}>
            <span className={styles.reasonLabel}>Причина отказа:</span>
            <span className={styles.reasonText}>
              {application.reject_reason}
            </span>
          </div>
        )}

        {application.status === 'cancelled' && application.cancel_reason && (
          <div className={styles.reasonBlock}>
            <span className={styles.reasonLabel}>Причина отмены:</span>
            <span className={styles.reasonText}>
              {application.cancel_reason}
            </span>
          </div>
        )}

        <div className={styles.dataGrid}>
          <div className={styles.dataItem}>
            <span className={styles.dataLabel}>Email:</span>
            <span className={styles.dataValue}>
              {application.user?.email || '—'}
            </span>
          </div>

          <div className={styles.dataItem}>
            <span className={styles.dataLabel}>Телефон:</span>
            <span className={styles.dataValue}>
              {application.user?.phone_number || '—'}
            </span>
          </div>

          <div className={styles.dataItem}>
            <span className={styles.dataLabel}>Статус пациента:</span>
            <span className={styles.dataValue}>
              {application.university_status || '—'}
            </span>
          </div>

          <div className={styles.dataItem}>
            <span className={styles.dataLabel}>Группа:</span>
            <span className={styles.dataValue}>
              {application.user?.study_group || '—'}
            </span>
          </div>

          <h3 className={styles.sidebarTitle}>Запись на сессию</h3>
          <label className={clsx(styles.fieldLabel, styles.psychologistField)}>
            <span className={styles.dataLabel}>Психолог</span>
            <select
              id="field-psychologist"
              className={styles.fieldSelect}
              value={selectedPsychologistId}
              disabled={
                !canEdit || isLoadingPsychologists || !!psychologistsError
              }
              onChange={(event) =>
                setOfferDraft(id!, {
                  psychologistId: event.currentTarget.value,
                })
              }
            >
              <option value="" disabled hidden>
                Выберите психолога
              </option>
              {selectedPsychologistId &&
                !psychologists.some(
                  (psychologist) => psychologist.id === selectedPsychologistId,
                ) && (
                  <option value={selectedPsychologistId} disabled>
                    {preferPsychologistName}
                  </option>
                )}
              {psychologists.map((psychologist) => (
                <option key={psychologist.id} value={psychologist.id}>
                  {getUserFullName(psychologist)}
                </option>
              ))}
            </select>
          </label>
          {psychologistsError && (
            <Alert
              className={styles.psychologistField}
              type="error"
              showIcon
              title="Не удалось загрузить список психологов"
              description={getErrorMessage(psychologistsError)}
              action={
                <Button onClick={() => void refetchPsychologists()}>
                  Повторить
                </Button>
              }
            />
          )}
          {canAccept && (
            <div className={styles.dataItemFull}>
              <Alert
                type="info"
                showIcon
                title="Чтобы изменить дату, время и другие условия встречи, сначала нажмите «В работу»."
              />
            </div>
          )}

          <label className={styles.fieldLabel}>
            <span className={styles.dataLabel}>Дата</span>
            <div className={styles.timeWrapper}>
              <DatePicker<DateTime>
                id="field-date"
                className={styles.fieldPicker}
                value={selectedDate}
                onChange={(date) =>
                  date &&
                  setOfferDraft(id!, { date: date.toFormat('yyyy-MM-dd') })
                }
                disabledDate={disabledDates}
                format="DD.MM.YYYY"
                placeholder="—"
                allowClear={false}
                disabled={!canEdit}
              />
            </div>
          </label>

          <label className={styles.fieldLabel}>
            <span className={styles.fieldLabel}>Время</span>
            <select
              id="field-time"
              className={styles.fieldSelect}
              value={selectedTime ?? ''}
              onChange={(event) =>
                setOfferDraft(id!, { time: event.currentTarget.value })
              }
              disabled={!canEdit}
            >
              <option value="" disabled hidden>
                —
              </option>
              {timeOptions.map(({ value, label, disabled }) => (
                <option key={value} value={value} disabled={disabled}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.fieldLabel}>
            <span className={styles.fieldLabel}>Формат</span>
            <select
              id="field-meeting-type"
              className={styles.fieldSelect}
              value={meetingType}
              onChange={(event) =>
                setOfferDraft(id!, {
                  meetingType: event.currentTarget.value as TMeetingType,
                })
              }
              disabled={!canEdit}
            >
              {MEETING_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {meetingType === 'offline' && (
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabel}>Адрес проведения</span>
              <Input
                id="field-location-address"
                className={styles.dataValue}
                placeholder="—"
                value={locationAddress}
                maxLength={128}
                showCount
                onChange={(e) =>
                  setOfferDraft(id!, { locationAddress: e.target.value })
                }
                disabled={!canEdit}
              />
            </label>
          )}

          {meetingType === 'online' && (
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabel}>Ссылка на встречу</span>
              <Input
                id="field-meeting-url"
                className={styles.dataValue}
                placeholder="—"
                value={meetingUrl}
                maxLength={128}
                showCount
                onChange={(e) =>
                  setOfferDraft(id!, { meetingUrl: e.target.value })
                }
                disabled={!canEdit}
              />
            </label>
          )}
        </div>

        <div className={styles.dataItemFull}>
          <span className={styles.dataLabel}>Описание проблемы:</span>
          <ExpandableText text={application.problem_description} />
        </div>

        {canChange && (offerIssues.length > 0 || isAwaitingConfirmation) && (
          <Alert
            id="offer-requirements"
            className={styles.offerHint}
            type="info"
            showIcon
            title={
              offerIssues.length
                ? 'Чтобы запросить подтверждение'
                : 'Повторный запрос подтверждения'
            }
            description={
              offerIssues.length
                ? offerIssues.join(' ')
                : hasOfferChanges
                  ? 'Психолог или условия встречи изменены. Отправьте запрос повторно, чтобы пользователь подтвердил новые данные.'
                  : 'Можно изменить психолога, дату, время, формат, адрес или ссылку на встречу и отправить запрос повторно. Кнопка станет активной после изменения данных.'
            }
          />
        )}

        {(canReject || canAccept || canChange) && (
          <div className={styles.actions}>
            {canReject && (
              <button
                className={styles.btnSecondary}
                onClick={() => setRejectModalOpen(true)}
                disabled={isSaving}
                type="button"
              >
                Отклонить заявку
              </button>
            )}
            {canAccept && (
              <button
                className={styles.btnConfirm}
                onClick={() => acceptMutation.mutate(application.id)}
                disabled={isSaving}
                type="button"
              >
                {acceptMutation.isPending ? 'Сохранение...' : 'В работу'}
              </button>
            )}
            {canChange && hasOfferChanges && (
              <button
                className={styles.resetOfferButton}
                onClick={() => clearOfferDraft(id!)}
                disabled={isSaving}
                type="button"
              >
                Сбросить изменения
              </button>
            )}
            {canChange && (
              <button
                className={styles.btnPrimary}
                onClick={() => offerMutation.mutate()}
                disabled={!canSave}
                aria-describedby={
                  offerIssues.length || isAwaitingConfirmation
                    ? 'offer-requirements'
                    : undefined
                }
                type="button"
              >
                {offerMutation.isPending
                  ? 'Сохранение...'
                  : isAwaitingConfirmation
                    ? 'Запросить подтверждение повторно'
                    : 'Запросить подтверждение'}
              </button>
            )}
          </div>
        )}
      </main>

      <PsychologistRejectModal
        type="application"
        entityId={rejectModalOpen ? id! : null}
        onClose={() => setRejectModalOpen(false)}
        onSuccess={() => {
          clearOfferDraft(id!);
          message.success('Заявка отклонена');
          navigate(-1);
        }}
      />
    </div>
  );
};

export default PsychologistApplicationPage;
