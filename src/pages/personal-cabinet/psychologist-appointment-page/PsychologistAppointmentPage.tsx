import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Empty, Input, Result, message } from 'antd';
import { AxiosError } from 'axios';
import clsx from 'clsx';
import {
  appointmentQueries,
  appointmentQueryKey,
  completeAppointment,
} from '@/entities/appointment/api';
import { Role } from '@/entities/role/helpers';
import { useAuth } from '@/features/auth/api/useAuth';
import { useCabinetTab } from '@/features/personal-cabinet/model/personal-cabinet-tab';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import PsychologistRejectModal from '@/features/personal-cabinet/ui/PsychologistRejectModal';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import {
  type TabId,
  getTabsForRole,
} from '@/pages/personal-cabinet/config/tabs';
import { AppointmentStatusTag } from '@/pages/personal-cabinet/constants';
import dayjs from '@/shared/lib/dayjs';
import Loader from '@/shared/ui/loader/loader';
import styles from './PsychologistAppointmentPage.module.scss';

const TYPE_LABELS: Record<string, string> = {
  Online: 'Онлайн',
  Offline: 'Очно',
};

const PSYCHOLOGIST_TABS = getTabsForRole('psychologist');
const CABINET_PATH = '/cabinet';

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  return dayjs(iso).tz().format('D MMMM YYYY');
};

const formatTime = (iso?: string | null) => {
  if (!iso) return null;
  return dayjs(iso).tz().format('HH:mm');
};

const PsychologistAppointmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const appointmentId = id || '';
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
    data: appointment,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...appointmentQueries.byId(id!),
    enabled: isPsychologist && !!id,
  });

  const conclusion = usePsychologistDrafts((state) =>
    appointmentId ? state.conclusionDrafts[appointmentId] || '' : '',
  );

  const hasConclusionDraft = usePsychologistDrafts((state) =>
    appointmentId
      ? Object.prototype.hasOwnProperty.call(
          state.conclusionDrafts,
          appointmentId,
        )
      : false,
  );

  const setConclusionDraft = usePsychologistDrafts(
    (state) => state.setConclusionDraft,
  );
  const clearConclusionDraft = usePsychologistDrafts(
    (state) => state.clearConclusionDraft,
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    if (
      !appointment?.id ||
      hasConclusionDraft ||
      appointment.conclusion === null
    )
      return;
    setConclusionDraft(appointment.id, appointment.conclusion);
  }, [
    appointment?.id,
    appointment?.conclusion,
    hasConclusionDraft,
    setConclusionDraft,
  ]);

  const completeMutation = useMutation({
    mutationFn: () => completeAppointment(id!, conclusion),
    onSuccess: () => {
      message.success('Запись завершена');
      if (appointmentId) {
        clearConclusionDraft(appointmentId);
      }
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] });
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.byId, id],
      });
      navigate(-1);
    },
    onError: (error: AxiosError<{ detail?: string }>) => {
      const detail = error.response?.data?.detail;
      message.error(detail || 'Не удалось завершить запись');
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
        title="Не удалось загрузить запись"
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
          activeTab="appointments"
          onChangeTab={handleSidebarTabChange}
          tabs={PSYCHOLOGIST_TABS}
        />
      </div>

      <article className={styles.wrapper}>
        <button
          className={styles.back}
          onClick={() => navigate(-1)}
          type="button"
        >
          <span>&lt;</span>
          <span>Вернуться назад</span>
        </button>

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
                ></div>
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
              <span className={styles.infoLabel}>Статус</span>
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
              <span className={styles.infoLabel}>Дата</span>
              <span className={styles.infoValueGrid}>
                {formatDate(appointment.scheduled_time) || '—'}
              </span>
            </div>
            <div className={styles.infoRowGrid}>
              <span className={styles.infoLabel}>Время</span>
              <span className={styles.infoValueGrid}>
                {formatTime(appointment.scheduled_time) || '—'}
              </span>
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

          {appointment.reason && (
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Причина записи</span>
              <span className={styles.infoValue}>{appointment.reason}</span>
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

          {appointment.status === 'awaiting' && (
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
                  // maxLength={2000}
                  // showCount
                />
              </span>
            </div>
          )}
        </div>

        {appointment.status === 'awaiting' && (
          <div className={styles.actions}>
            <button
              className={styles.actionButtonCancel}
              onClick={() => setCancelModalOpen(true)}
              disabled={completeMutation.isPending}
              type="button"
            >
              Отменить
            </button>
            <button
              className={styles.actionButtonEnd}
              onClick={() => completeMutation.mutate()}
              disabled={
                conclusion.trim().length === 0 || completeMutation.isPending
              }
              type="button"
            >
              {completeMutation.isPending ? 'Завершение...' : 'Завершить'}
            </button>
          </div>
        )}

        <PsychologistRejectModal
          type="appointment"
          entityId={cancelModalOpen ? id! : null}
          onClose={() => setCancelModalOpen(false)}
          onSuccess={() => {
            message.success('Запись отменена');
            queryClient.invalidateQueries({
              queryKey: [appointmentQueryKey.byId, id],
            });
            navigate(-1);
          }}
        />
      </article>
    </div>
  );
};

export default PsychologistAppointmentPage;
