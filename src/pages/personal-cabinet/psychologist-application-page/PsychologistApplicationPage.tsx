import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Empty, Input, Result, Select } from 'antd';
import clsx from 'clsx';
import type { DateTime } from 'luxon';
import {
  acceptApplication,
  applicationQueries,
  applicationQueryKey,
  offerConsultation,
} from '@/entities/application/api';
import { getApplicationMeetingType } from '@/entities/application/meeting';
import { useAuth } from '@/entities/auth/model/useAuth';
import { Role } from '@/entities/role/helpers';
import {
  CONSULTATION_TIMES,
  CONSULTATION_TIME_HINT,
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
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistApplicationPage.module.scss';

const MEETING_TYPE_OPTIONS = [
  { value: 'online' as const, label: 'Онлайн' },
  { value: 'offline' as const, label: 'Очно' },
];

const PSYCHOLOGIST_TABS = getTabsForRole('psychologist');

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

  const draft = usePsychologistDrafts((state) =>
    id ? state.offerDrafts[id] : undefined,
  );
  const setOfferDraft = usePsychologistDrafts((state) => state.setOfferDraft);
  const clearOfferDraft = usePsychologistDrafts(
    (state) => state.clearOfferDraft,
  );
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const applicationScheduledAt = useMemo(
    () =>
      application?.scheduled_at ? moscowDate(application.scheduled_at) : null,
    [application?.scheduled_at],
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

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      acceptApplication(applicationId, userId!),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        queryClient.invalidateQueries({
          queryKey: [applicationQueryKey.byId, id],
        }),
      ]),
    onError: (error) => {
      message.error(getErrorMessage(error, 'Не удалось выполнить операцию'));
    },
  });

  const offerMutation = useMutation({
    mutationFn: () => {
      if (!selectedDateTime || !isConsultationTimeValid(selectedDateTime)) {
        throw new Error(
          `Выберите будущее время консультации. ${CONSULTATION_TIME_HINT}`,
        );
      }
      return offerConsultation(id!, {
        psychologist_id: user!.id,
        meeting_type: meetingType,
        scheduled_at: toApiDate(selectedDateTime),
        location_address:
          meetingType === 'offline' ? locationAddress.trim() : null,
        meeting_url: meetingType === 'online' ? meetingUrl.trim() : null,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        queryClient.invalidateQueries({
          queryKey: [applicationQueryKey.byId, id],
        }),
      ]);
      clearOfferDraft(id!);
      message.success(
        'Консультация предложена, ожидаем подтверждения пользователя',
      );
      navigate(-1);
    },
    onError: (error) => {
      message.error(getErrorMessage(error, 'Не удалось сохранить изменения'));
    },
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
        extra={
          <button
            className={styles.back}
            type="button"
            onClick={() => navigate(-1)}
          >
            Вернуться назад
          </button>
        }
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
    meetingType !== getApplicationMeetingType(application) ||
    selectedDateTime?.startOf('minute').toMillis() !==
      applicationScheduledAt?.startOf('minute').toMillis() ||
    (meetingType === 'offline'
      ? locationAddress.trim() !==
        (
          application.location_address ??
          application.preferred_campus ??
          ''
        ).trim()
      : meetingUrl.trim() !== (application.meeting_url ?? '').trim());

  const offerIssues: string[] = [];
  if (!selectedDate) offerIssues.push('Выберите дату консультации.');
  if (!selectedTime) offerIssues.push('Выберите время консультации.');
  if (selectedDateTime && !isConsultationTimeValid(selectedDateTime)) {
    offerIssues.push(
      `Выберите будущее время консультации. ${CONSULTATION_TIME_HINT}`,
    );
  }
  if (meetingType === 'offline' && !locationAddress.trim()) {
    offerIssues.push('Укажите адрес проведения очной встречи.');
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
  const preferPsychologistName =
    [
      application.psychologist?.user?.last_name,
      application.psychologist?.user?.first_name,
      application.psychologist?.user?.middle_name,
    ]
      .filter(Boolean)
      .join(' ') || '—';

  return (
    <div className={styles.page}>
      <div className={styles.sidebarWrapper}>
        <Sidebar
          user={user}
          activeTab="applications"
          tabs={PSYCHOLOGIST_TABS}
        />
      </div>

      <main className={styles.content}>
        <button
          className={styles.back}
          onClick={() => navigate(-1)}
          type="button"
        >
          <span>&lt;</span>
          <span>Вернуться назад</span>
        </button>

        <h1 className={styles.pageTitle}>Заявка</h1>

        <h2 className={styles.userName}>{userName}</h2>

        <div className={styles.statusRow}>
          <p className={styles.statusLabel}>Статус</p>
          <div className={styles['status']}>
            <div
              className={clsx(styles['status-dot'], styles[statusUI.className])}
            ></div>
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
          {canAccept && (
            <div className={styles.dataItemFull}>
              <Alert
                type="info"
                showIcon
                message="Чтобы изменить дату, время и другие условия встречи, сначала нажмите «В работу»."
              />
            </div>
          )}
          <p className={styles.dataItemFull}>{CONSULTATION_TIME_HINT}</p>

          <label className={styles.fieldLabel}>
            <span className={styles.dataLabel}>Дата</span>
            <div className={styles.timeWrapper}>
              <DatePicker
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
            <div className={styles.fieldSelectWrapper}>
              <Select
                id="field-time"
                className={styles.fieldSelect}
                prefixCls="customSelect"
                value={selectedTime || undefined}
                onChange={(time) => setOfferDraft(id!, { time })}
                placeholder="—"
                options={timeOptions}
                disabled={!canEdit}
              />
            </div>
          </label>

          <label className={styles.fieldLabel}>
            <span className={styles.fieldLabel}>Формат</span>
            <div className={styles.fieldSelectWrapper}>
              <Select
                id="field-meeting-type"
                className={styles.fieldSelect}
                prefixCls="customSelect"
                value={meetingType}
                onChange={(meetingType) => setOfferDraft(id!, { meetingType })}
                options={MEETING_TYPE_OPTIONS}
                placeholder="—"
                disabled={!canEdit}
              />
            </div>
          </label>

          {meetingType === 'offline' && (
            <label className={styles.fieldLabel}>
              <span className={styles.fieldLabel}>Адрес проведения</span>
              <Input
                id="field-location-address"
                className={styles.dataValue}
                placeholder="—"
                value={locationAddress}
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
            message={
              offerIssues.length
                ? 'Чтобы запросить подтверждение'
                : 'Ожидаем подтверждения пользователя'
            }
            description={
              offerIssues.length
                ? offerIssues.join(' ')
                : hasOfferChanges
                  ? 'Условия встречи изменены. Отправьте запрос повторно, чтобы пользователь подтвердил новые данные.'
                  : 'Можно изменить дату, время, формат, адрес или ссылку на встречу и отправить запрос повторно. Кнопка станет активной после изменения данных.'
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
