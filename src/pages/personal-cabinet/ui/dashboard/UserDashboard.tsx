import { useMemo, useState } from 'react';
import type { FC } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Input, Modal } from 'antd';
import {
  applicationQueries,
  applicationQueryKey,
  cancelApplication,
} from '@/entities/application/api';
import {
  getApplicationMeetingType,
  getApplicationVenue,
} from '@/entities/application/meeting';
import type { TApplication } from '@/entities/application/types';
import {
  appointmentQueries,
  appointmentQueryKey,
  cancelAppointment,
  createAppointment,
} from '@/entities/appointment/api';
import type { TAppointment } from '@/entities/appointment/types';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import {
  CONSULTATION_TIME_HINT,
  isConsultationTimeValid,
} from '@/features/personal-cabinet/model/consultation-time';
import AppointmentCard from '@/features/personal-cabinet/ui/appointment-card/AppointmentCard';
import GreetingCard from '@/features/personal-cabinet/ui/greeting-card/GreetingCard';
import { getErrorMessage } from '@/shared/api/errors';
import { moscowDate } from '@/shared/lib/date-time';
import PageLoader from '@/shared/ui/PageLoader';
import styles from './UserDashboard.module.scss';

type TUserDashboardProps = {
  userName: string;
  onBookClick: () => void;
};

const MEETING_TYPE_LABELS: Record<string, string> = {
  online: 'Онлайн',
  offline: 'Очно',
};

const INITIATOR_LABELS: Record<string, string> = {
  user: 'Пользователь (Вы)',
  psychologist: 'Психолог',
  manager: 'Менеджер',
  system: 'Система',
};

const getTherapistName = (psychologist: TApplication['psychologist']) => {
  if (!psychologist) return 'Специалист не назначен';
  return (
    [
      psychologist.user?.last_name,
      psychologist.user?.first_name,
      psychologist.user?.middle_name,
    ]
      .filter(Boolean)
      .join(' ') || 'Имя специалиста не указано'
  );
};

const UserDashboard: FC<TUserDashboardProps> = ({ userName, onBookClick }) => {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);

  const [commentModalData, setCommentModalData] = useState<{
    visible: boolean;
    status: string;
    text: string;
    initiator?: string | null;
  }>({ visible: false, status: '', text: '', initiator: null });

  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    type: 'appointment' | 'application';
    id: string;
  }>({ visible: false, type: 'appointment', id: '' });
  const reasonKey = `${cancelModal.type}:${cancelModal.id}`;
  const cancelReason = useCabinetDrafts(
    (state) => state.cancellationReasons[reasonKey] || '',
  );
  const setCancellationReason = useCabinetDrafts(
    (state) => state.setCancellationReason,
  );
  const clearCancellationReason = useCabinetDrafts(
    (state) => state.clearCancellationReason,
  );

  const {
    data: serverAppointments,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
  } = useQuery(appointmentQueries.list());
  const {
    data: applications,
    isLoading: isLoadingApplications,
    error: applicationsError,
  } = useQuery(applicationQueries.list());

  const { upcoming, past } = useMemo(() => {
    const upc: TAppointment[] = [];
    const pst: TAppointment[] = [];

    (serverAppointments || []).forEach((item) => {
      if (item.status === 'awaiting') {
        upc.push(item);
      } else {
        pst.push(item);
      }
    });

    upc.sort(
      (a, b) =>
        moscowDate(a.scheduled_time).toMillis() -
        moscowDate(b.scheduled_time).toMillis(),
    );
    pst.sort(
      (a, b) =>
        moscowDate(b.scheduled_time).toMillis() -
        moscowDate(a.scheduled_time).toMillis(),
    );

    return { upcoming: upc, past: pst };
  }, [serverAppointments]);

  const { awaitingConfirmation, inProcessing, closedApplications } =
    useMemo(() => {
      const awaiting: TApplication[] = [];
      const processing: TApplication[] = [];
      const closed: TApplication[] = [];

      (applications || []).forEach((app) => {
        if (app.status === 'awaiting_user_confirmation') {
          awaiting.push(app);
        } else if (app.status === 'new' || app.status === 'in_progress') {
          processing.push(app);
        } else if (['rejected', 'cancelled', 'expired'].includes(app.status)) {
          closed.push(app);
        }
      });

      return {
        awaitingConfirmation: awaiting,
        inProcessing: processing,
        closedApplications: closed,
      };
    }, [applications]);

  const confirmMutation = useMutation({
    mutationFn: async (app: TApplication) => {
      if (!user || !app.psychologist || !app.scheduled_at) {
        throw new Error('В заявке не указаны данные консультации');
      }
      if (!isConsultationTimeValid(moscowDate(app.scheduled_at))) {
        throw new Error(
          `Попросите психолога выбрать будущее время консультации. ${CONSULTATION_TIME_HINT}`,
        );
      }

      const isOnline = getApplicationMeetingType(app) === 'online';
      const venue = isOnline
        ? app.meeting_url
        : app.location_address || app.preferred_campus;
      if (isOnline && (!venue || venue.length > 128)) {
        throw new Error(
          'Попросите психолога указать ссылку на встречу длиной до 128 символов',
        );
      }

      // Создание приёма на бэке также подтверждает связанную заявку.
      return createAppointment({
        application_id: app.id,
        patient_id: user.id,
        psychologist_id: app.psychologist.id,
        type: isOnline ? 'Online' : 'Offline',
        scheduled_time: app.scheduled_at,
        venue,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      ]);
      message.success('Заявка успешно подтверждена');
    },
    onError: (error) => {
      message.error(getErrorMessage(error, 'Не удалось подтвердить заявку'));
    },
  });

  const handleConfirm = (app: TApplication) => {
    modal.confirm({
      title: 'Подтверждение записи',
      content: 'Вы уверены, что хотите подтвердить предложенное время и дату?',
      okText: 'Подтвердить',
      cancelText: 'Назад',
      onOk: () => confirmMutation.mutateAsync(app),
    });
  };

  const cancelMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
    }: {
      id: string;
      type: 'appointment' | 'application';
      reason: string;
    }) => {
      if (type === 'application') {
        return cancelApplication(id, {
          cancel_reason: reason,
          cancel_initiator: 'user',
        });
      } else {
        return cancelAppointment(id, reason);
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      ]);
      message.success('Успешно отменено');
      setCancelModal({ visible: false, type: 'appointment', id: '' });
      clearCancellationReason(`${variables.type}:${variables.id}`);
    },
    onError: (error) => {
      message.error(getErrorMessage(error, 'Ошибка при отмене'));
    },
  });

  const handleCancelSubmit = () => {
    if (cancelMutation.isPending) return;
    if (!cancelReason.trim()) {
      message.error('Пожалуйста, укажите причину отмены');
      return;
    }
    if (
      cancelReason.trim().length >
      (cancelModal.type === 'application' ? 500 : 512)
    ) {
      message.error('Сократите причину отмены');
      return;
    }
    cancelMutation.mutate({
      id: cancelModal.id,
      type: cancelModal.type,
      reason: cancelReason.trim(),
    });
  };

  const isLoading = isLoadingAppointments || isLoadingApplications;

  if (isLoading) {
    return (
      <div className={styles.pageLoaderWrapper}>
        <PageLoader />
      </div>
    );
  }

  const loadError = appointmentsError || applicationsError;
  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Не удалось загрузить личный кабинет"
        description={getErrorMessage(loadError)}
      />
    );
  }

  return (
    <>
      <GreetingCard userName={userName} onBookClick={onBookClick} />

      <div className={styles.contactNotice}>
        *По любым организационным вопросам или в случае чрезвычайной ситуации вы
        можете связаться с психологом по тем контактам, что указаны в
        заявке/записи.
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ваши записи</h3>
        <div className={styles.cardsGrid}>
          {upcoming.length > 0 ? (
            upcoming.map((app) => (
              <AppointmentCard
                key={app.id}
                date={moscowDate(app.scheduled_time).toFormat('d MMMM, HH:mm')}
                doctorName={getTherapistName(app.psychologist)}
                address={
                  app.venue ||
                  (app.type === 'Online' ? 'Онлайн сессия' : 'Офлайн')
                }
                type="upcoming"
                status={app.status}
                onCancel={() =>
                  setCancelModal({
                    visible: true,
                    type: 'appointment',
                    id: app.id,
                  })
                }
              />
            ))
          ) : (
            <p className={styles.emptyText}>
              У вас пока что нет активных записей
            </p>
          )}
        </div>
      </section>

      {inProcessing.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>В обработке у специалиста</h3>
          <div className={styles.cardsGrid}>
            {inProcessing.map((app) => {
              const meetingTypeStr =
                MEETING_TYPE_LABELS[getApplicationMeetingType(app)];
              const locationStr = getApplicationVenue(app);
              const scheduledStr = app.scheduled_at
                ? moscowDate(app.scheduled_at).toFormat('d MMMM, HH:mm')
                : 'Время подбирается специалистом';

              return (
                <AppointmentCard
                  key={app.id}
                  date={scheduledStr}
                  doctorName={getTherapistName(app.psychologist)}
                  address={`${meetingTypeStr} — ${locationStr}`}
                  type="upcoming"
                  status={app.status}
                  onCancel={() =>
                    setCancelModal({
                      visible: true,
                      type: 'application',
                      id: app.id,
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {awaitingConfirmation.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Требуют подтверждения</h3>
          <div className={styles.cardsGrid}>
            {awaitingConfirmation.map((app) => {
              const meetingTypeStr =
                MEETING_TYPE_LABELS[getApplicationMeetingType(app)];
              const locationStr = getApplicationVenue(app);
              const scheduledStr = app.scheduled_at
                ? moscowDate(app.scheduled_at).toFormat('d MMMM, HH:mm')
                : 'Время не назначено';

              return (
                <AppointmentCard
                  key={app.id}
                  date={scheduledStr}
                  doctorName={getTherapistName(app.psychologist)}
                  address={`${meetingTypeStr} — ${locationStr}`}
                  type="confirmation"
                  status={app.status}
                  onConfirm={() => handleConfirm(app)}
                  onCancel={() =>
                    setCancelModal({
                      visible: true,
                      type: 'application',
                      id: app.id,
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Последние сессии</h3>
          <div className={styles.cardsGrid}>
            {past.map((app) => {
              const isCancelled = app.status === 'cancelled';
              const isDone = app.status === 'done';

              let commentText = '';
              let cancelInitiator = null;

              if (isCancelled) {
                commentText = app.cancel_reason || 'Причина не указана';
                // Ищем связанную заявку, чтобы достать инициатора отмены
                const relatedApp = applications?.find(
                  (a) => a.id === app.application_id,
                );
                if (relatedApp && relatedApp.cancel_initiator) {
                  cancelInitiator = relatedApp.cancel_initiator;
                }
              } else if (isDone) {
                commentText = app.patient_comment || app.conclusion || '';
              }

              const hasComment = Boolean(commentText);

              return (
                <AppointmentCard
                  key={app.id}
                  date={moscowDate(app.scheduled_time).toFormat(
                    'd MMMM, HH:mm',
                  )}
                  doctorName={getTherapistName(app.psychologist)}
                  address={
                    app.venue ||
                    (app.type === 'Online' ? 'Онлайн сессия' : 'Офлайн')
                  }
                  type="past"
                  status={app.status}
                  hasComment={hasComment}
                  onComment={() =>
                    setCommentModalData({
                      visible: true,
                      status: app.status,
                      text: commentText,
                      initiator: cancelInitiator,
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {closedApplications.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Закрытые заявки</h3>
          <div className={styles.cardsGrid}>
            {closedApplications.map((app) => {
              const reason = app.reject_reason || app.cancel_reason || '';
              return (
                <AppointmentCard
                  key={app.id}
                  date={moscowDate(app.scheduled_at || app.created_at).toFormat(
                    'd MMMM, HH:mm',
                  )}
                  doctorName={getTherapistName(app.psychologist)}
                  address={`${MEETING_TYPE_LABELS[getApplicationMeetingType(app)]} — ${getApplicationVenue(app)}`}
                  type="past"
                  status={app.status}
                  hasComment={!!reason}
                  onComment={() =>
                    setCommentModalData({
                      visible: true,
                      status: app.status,
                      text: reason,
                      initiator: app.cancel_initiator,
                    })
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      <Modal
        title={
          commentModalData.status === 'cancelled'
            ? 'Причина отмены'
            : commentModalData.status === 'rejected'
              ? 'Причина отказа'
              : 'Комментарий психолога'
        }
        open={commentModalData.visible}
        onCancel={() =>
          setCommentModalData({ ...commentModalData, visible: false })
        }
        footer={null}
      >
        {commentModalData.status === 'cancelled' &&
          commentModalData.initiator && (
            <div className={styles.modalInitiator}>
              <strong>Инициатор отмены: </strong>
              {INITIATOR_LABELS[commentModalData.initiator] ||
                commentModalData.initiator}
            </div>
          )}
        <div className={styles.modalText}>{commentModalData.text}</div>
      </Modal>

      <Modal
        title="Отмена"
        open={cancelModal.visible}
        onCancel={() => {
          if (cancelMutation.isPending) return;
          setCancelModal({ visible: false, type: 'appointment', id: '' });
        }}
        onOk={handleCancelSubmit}
        confirmLoading={cancelMutation.isPending}
        cancelButtonProps={{ disabled: cancelMutation.isPending }}
        closable={!cancelMutation.isPending}
        maskClosable={!cancelMutation.isPending}
        keyboard={!cancelMutation.isPending}
        okText="Подтвердить отмену"
        cancelText="Назад"
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
      >
        <p style={{ marginBottom: 12 }}>Пожалуйста, укажите причину отмены:</p>
        <Input.TextArea
          rows={4}
          value={cancelReason}
          maxLength={cancelModal.type === 'application' ? 500 : 512}
          showCount
          disabled={cancelMutation.isPending}
          onChange={(e) => setCancellationReason(reasonKey, e.target.value)}
          placeholder="Например: Изменились планы, заболел(а)"
        />
      </Modal>
    </>
  );
};

export default UserDashboard;
