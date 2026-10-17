import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Empty, Input, Result } from 'antd';
import clsx from 'clsx';
import { applicationQueries } from '@/entities/application/api';
import {
  appointmentQueries,
  appointmentQueryKey,
  completeAppointment,
} from '@/entities/appointment/api';
import { AppointmentStatusTag } from '@/entities/appointment/status';
import { useAuth } from '@/entities/auth/model/useAuth';
import { Role } from '@/entities/role/helpers';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import PsychologistRejectModal from '@/features/personal-cabinet/ui/PsychologistRejectModal';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import { getTabsForRole } from '@/pages/personal-cabinet/config/tabs';
import { getErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
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

  const setConclusionDraft = usePsychologistDrafts(
    (state) => state.setConclusionDraft,
  );
  const clearConclusionDraft = usePsychologistDrafts(
    (state) => state.clearConclusionDraft,
  );
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const completeMutation = useMutation({
    mutationFn: () => completeAppointment(id!, conclusion.trim()),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
        queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.byId, id],
        }),
      ]);
      message.success('Запись завершена');
      if (appointmentId) {
        clearConclusionDraft(appointmentId);
      }
      navigate(-1);
    },
    onError: (error) => {
      message.error(getErrorMessage(error, 'Не удалось завершить запись'));
    },
  });

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
          tabs={getTabsForRole(
            new Role(user?.roles ?? []).isPsychologist()
              ? 'psychologist'
              : 'admin',
          )}
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
                  maxLength={2048}
                  showCount
                  disabled={completeMutation.isPending}
                />
              </span>
            </div>
          )}
        </div>

        {appointment.status === 'awaiting' && completionHint && (
          <Alert
            id="completion-requirements"
            className={styles.completionHint}
            type="info"
            showIcon
            message={completionHint}
          />
        )}

        {appointment.status === 'awaiting' && (
          <div className={styles.actions}>
            <button
              className={styles.actionButtonEnd}
              onClick={() => completeMutation.mutate()}
              disabled={!!completionHint || completeMutation.isPending}
              aria-describedby={
                completionHint ? 'completion-requirements' : undefined
              }
              type="button"
            >
              {completeMutation.isPending ? 'Завершение...' : 'Завершить'}
            </button>
            <button
              className={styles.actionButtonCancel}
              onClick={() => setCancelModalOpen(true)}
              disabled={completeMutation.isPending}
              type="button"
            >
              Отменить
            </button>
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
