import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker, Empty, Input, Result, Select, message } from 'antd';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  acceptApplication,
  applicationQueries,
  applicationQueryKey,
  offerConsultation,
} from '@/entities/application/api';
import type { Application, MeetingType } from '@/entities/application/types';
import { Role } from '@/entities/role/helpers';
import { useAuth } from '@/features/auth/api/useAuth';
import { useCabinetTab } from '@/features/personal-cabinet/model/personal-cabinet-tab';
import PsychologistRejectModal from '@/features/personal-cabinet/ui/PsychologistRejectModal';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import {
  type TabId,
  getTabsForRole,
} from '@/pages/personal-cabinet/config/tabs';
import { ApplicationStatusTag } from '@/pages/personal-cabinet/constants';
import dayjs from '@/shared/lib/dayjs';
import { MOSCOW_TZ } from '@/shared/lib/dayjs';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistApplicationPage.module.scss';

const MEETING_TYPE_OPTIONS = [
  { value: 'online' as const, label: 'Онлайн' },
  { value: 'offline' as const, label: 'Очно' },
];

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

const PSYCHOLOGIST_TABS = getTabsForRole('psychologist');
const CABINET_PATH = '/cabinet';

const getMoscowDateTime = (date: dayjs.Dayjs, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return date
    .tz(MOSCOW_TZ, true)
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0);
};

const PsychologistApplicationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const userId = user?.id;
  const setSavedTab = useCabinetTab((s) => s.setActiveTab);

  const isPsychologist = useMemo(
    () => (user?.roles ? new Role(user.roles).isPsychologist() : false),
    [user?.roles],
  );

  const handleSidebarTabChange = useCallback(
    (tabId: string) => {
      setSavedTab(tabId as TabId);
      navigate(CABINET_PATH);
    },
    [navigate, setSavedTab],
  );

  const {
    data: application,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...applicationQueries.byId(id!),
    enabled: isPsychologist && !!id,
  });

  const [userMeetingType, setUserMeetingType] = useState<MeetingType | null>(
    null,
  );
  const [userDate, setUserDate] = useState<dayjs.Dayjs | null>(null);
  const [userTime, setUserTime] = useState<string | null>(null);

  const [userLocationAddress, setUserLocationAddress] = useState<string | null>(
    null,
  );
  const [userMeetingUrl, setUserMeetingUrl] = useState<string | null>(null);
  const [formInitializedForId, setFormInitializedForId] = useState<
    string | null
  >(null);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (!application?.id || formInitializedForId === application.id) return;

    setUserMeetingType(null);
    setUserDate(null);
    setUserTime(null);
    setUserLocationAddress(null);
    setUserMeetingUrl(null);
    setFormInitializedForId(application.id);
  }, [application?.id, formInitializedForId]);

  const applicationScheduledAt = useMemo(
    () =>
      application?.scheduled_at ? dayjs(application.scheduled_at).tz() : null,
    [application?.scheduled_at],
  );

  const getMeetingType = (application: Application | undefined) => {
    if (userMeetingType) return userMeetingType;
    if (application?.meeting_type) return application.meeting_type;
    if (application?.location_address) return 'offline';
    if (application?.meeting_url) return 'online';
    if (application?.preferred_campus) return 'offline';
    return 'online';
  };

  const meetingType = getMeetingType(application);

  const selectedDate = useMemo(
    () => userDate || applicationScheduledAt?.startOf('day') || null,
    [applicationScheduledAt, userDate],
  );
  const selectedTime =
    userTime || applicationScheduledAt?.format('HH:mm') || null;
  const locationAddress =
    userLocationAddress ??
    application?.location_address ??
    application?.preferred_campus ??
    '';
  const meetingUrl = userMeetingUrl ?? application?.meeting_url ?? '';

  const selectedDateTime = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    return getMoscowDateTime(selectedDate, selectedTime);
  }, [selectedDate, selectedTime]);

  const timeOptions = useMemo(() => {
    const options =
      selectedTime && !TIME_SLOTS.includes(selectedTime)
        ? [...TIME_SLOTS, selectedTime].sort()
        : TIME_SLOTS;
    const nowMoscow = dayjs.tz();

    return options.map((slot) => ({
      value: slot,
      label: slot,
      disabled: selectedDate
        ? getMoscowDateTime(selectedDate, slot).isBefore(nowMoscow)
        : false,
    }));
  }, [selectedDate, selectedTime]);

  const acceptMutation = useMutation({
    mutationFn: (applicationId: string) =>
      acceptApplication(applicationId, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] });
      queryClient.invalidateQueries({
        queryKey: [applicationQueryKey.byId, id],
      });
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      message.error(detail || 'Не удалось выполнить операцию');
    },
  });

  const offerMutation = useMutation({
    mutationFn: () =>
      offerConsultation(id!, {
        psychologist_id: user!.id,
        meeting_type: meetingType!,
        scheduled_at: selectedDateTime!.toISOString(),
        location_address:
          meetingType === 'offline' ? locationAddress.trim() : null,
        meeting_url: meetingType === 'online' ? meetingUrl.trim() : null,
      }),
    onSuccess: () => {
      message.success(
        'Консультация предложена, ожидаем подтверждения пользователя',
      );
      queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] });
      queryClient.invalidateQueries({
        queryKey: [applicationQueryKey.byId, id],
      });
      navigate(-1);
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      message.error(detail || 'Не удалось сохранить изменения');
    },
  });

  if (!isPsychologist) return <Navigate to="/" replace />;
  if (isLoading) return <Loader />;
  if (isError) {
    const detail = (error as AxiosError<{ detail?: string }>)?.response?.data
      ?.detail;
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

  const canAccept = application.status === 'new';
  const canChange =
    application.status === 'in_progress' ||
    application.status === 'awaiting_user_confirmation';
  const canReject =
    application.status === 'new' ||
    application.status === 'in_progress' ||
    application.status === 'awaiting_user_confirmation';

  const canSave =
    canChange &&
    meetingType &&
    selectedDateTime &&
    selectedDateTime.isAfter(dayjs.tz()) &&
    (meetingType === 'offline'
      ? locationAddress.trim().length > 0
      : meetingUrl.trim().length > 0);

  const disabledDates = (current: dayjs.Dayjs) => {
    return current
      ? current.tz(MOSCOW_TZ, true).isBefore(dayjs.tz().startOf('day'), 'day')
      : false;
  };

  interface ExpandableTextProps {
    text: string;
  }

  const ExpandableText: React.FC<ExpandableTextProps> = ({ text }) => {
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
          onChangeTab={handleSidebarTabChange}
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

          <label className={styles.fieldLabel}>
            <span className={styles.dataLabel}>Дата</span>
            <div className={styles.timeWrapper}>
              <DatePicker
                id="field-date"
                className={styles.fieldPicker}
                value={selectedDate}
                onChange={(date) =>
                  setUserDate(date ? date.startOf('day') : null)
                }
                disabledDate={disabledDates}
                format="DD.MM.YYYY"
                placeholder="—"
                allowClear={false}
                disabled={!canChange}
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
                onChange={setUserTime}
                placeholder="—"
                options={timeOptions}
                disabled={!canChange}
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
                onChange={setUserMeetingType}
                options={MEETING_TYPE_OPTIONS}
                placeholder="—"
                disabled={!canChange}
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
                onChange={(e) => setUserLocationAddress(e.target.value)}
                disabled={!canChange}
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
                onChange={(e) => setUserMeetingUrl(e.target.value)}
                disabled={!canChange}
              />
            </label>
          )}
        </div>

        <div className={styles.dataItemFull}>
          <span className={styles.dataLabel}>Описание проблемы:</span>
          <ExpandableText text={application.problem_description} />
        </div>

        {(canReject || canAccept || canChange) && (
          <div className={styles.actions}>
            {canReject && (
              <button
                className={styles.btnSecondary}
                onClick={() => setRejectModalOpen(true)}
                type="button"
              >
                Отклонить заявку
              </button>
            )}
            {canAccept && (
              <button
                className={styles.btnConfirm}
                onClick={() => acceptMutation.mutate(application.id)}
                disabled={acceptMutation.isPending}
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
                type="button"
              >
                {offerMutation.isPending
                  ? 'Сохранение...'
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
          message.success('Заявка отклонена');
          queryClient.invalidateQueries({
            queryKey: [applicationQueryKey.byId, id],
          });
          navigate(-1);
        }}
      />
    </div>
  );
};

export default PsychologistApplicationPage;
