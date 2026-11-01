import { useMemo, useState } from 'react';
import type { FC } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Alert, App, Input, Modal } from 'antd';
import { isAxiosError } from 'axios';
import {
  applicationQueries,
  applicationQueryKey,
  cancelApplication,
  confirmApplication,
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
  confirmAppointmentReschedule,
  rejectAppointmentReschedule,
} from '@/entities/appointment/api';
import type {
  TAppointment,
  TAppointmentReschedule,
} from '@/entities/appointment/types';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { isConsultationTimeValid } from '@/features/personal-cabinet/model/consultation-time';
import AppointmentCard from '@/features/personal-cabinet/ui/appointment-card/AppointmentCard';
import GreetingCard from '@/features/personal-cabinet/ui/greeting-card/GreetingCard';
import { getErrorMessage } from '@/shared/api/errors';
import { moscowDate } from '@/shared/lib/date-time';
import PageLoader from '@/shared/ui/PageLoader';
import styles from './UserDashboard.module.scss';

type TUserDashboardProps = {
  userName: string;
};

const getApplicationAddress = (application: TApplication) =>
  getApplicationMeetingType(application) === 'online'
    ? 'Онлайн'
    : `Очно — ${getApplicationVenue(application)}`;

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

const UserDashboard: FC<TUserDashboardProps> = ({ userName }) => {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [commentModalData, setCommentModalData] = useState<{
    visible: boolean;
    status: string;
    text: string;
    initiator?: string | null;
  }>({ visible: false, status: '', text: '', initiator: null });

  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    type: 'appointment' | 'application' | 'reschedule';
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

  // В списке записей бэк пока не возвращает ожидающий перенос.
  const rescheduleQueries = useQueries({
    queries: upcoming.map((appointment) =>
      appointmentQueries.reschedules(appointment.id),
    ),
  });
  const awaitingReschedules = upcoming.flatMap((appointment, index) => {
    const request = rescheduleQueries[index].data?.find(
      (item) => item.status === 'pending',
    );
    return request ? [{ appointment, request }] : [];
  });
  const regularUpcoming = upcoming.filter(
    (appointment) =>
      !awaitingReschedules.some(
        (item) => item.appointment.id === appointment.id,
      ),
  );

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
    mutationFn: (app: TApplication) =>
      confirmApplication(app.id, { expected_version: app.version }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      ]);
      message.success('Заявка успешно подтверждена');
    },
    onError: async (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [applicationQueryKey.list],
          }),
          queryClient.invalidateQueries({
            queryKey: [appointmentQueryKey.list],
          }),
        ]);
      }
      message.error(getErrorMessage(error, 'Не удалось подтвердить заявку'));
    },
  });

  const handleConfirm = (app: TApplication) => {
    modal.confirm({
      title: 'Подтверждение записи',
      content: 'Вы уверены, что хотите подтвердить предложенное время и дату?',
      okText: 'Подтвердить',
      cancelText: 'Назад',
      // Ошибка уже показана в onError. Новая попытка требует нового подтверждения.
      onOk: () => confirmMutation.mutateAsync(app).catch(() => undefined),
    });
  };

  const refreshAppointments = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.byId] }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.reschedules],
      }),
    ]);

  const confirmRescheduleMutation = useMutation({
    mutationFn: (request: TAppointmentReschedule) => {
      if (
        !isConsultationTimeValid(moscowDate(request.requested_scheduled_time))
      ) {
        throw new Error(
          'Предложенное время уже недоступно. Свяжитесь с психологом для выбора нового времени.',
        );
      }
      return confirmAppointmentReschedule(request.id);
    },
    onSuccess: async () => {
      await refreshAppointments();
      message.success('Перенос записи подтверждён');
    },
    onError: async (error) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await refreshAppointments();
      }
      message.error(getErrorMessage(error, 'Не удалось подтвердить перенос'));
    },
  });

  const handleConfirmReschedule = (request: TAppointmentReschedule) => {
    modal.confirm({
      title: 'Подтверждение переноса',
      content: `Перенести запись с ${moscowDate(request.old_scheduled_time).toFormat('d MMMM yyyy, HH:mm')} на ${moscowDate(request.requested_scheduled_time).toFormat('d MMMM yyyy, HH:mm')} по Москве?`,
      okText: 'Подтвердить',
      cancelText: 'Назад',
      onOk: () =>
        confirmRescheduleMutation.mutateAsync(request).catch(() => undefined),
    });
  };

  const cancelMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
    }: {
      id: string;
      type: 'appointment' | 'application' | 'reschedule';
      reason: string;
    }) => {
      if (type === 'reschedule') {
        return rejectAppointmentReschedule(id, reason);
      }
      if (type === 'application') {
        return cancelApplication(id, {
          cancel_reason: reason,
          cancel_initiator: 'user',
        });
      }
      return cancelAppointment(id, reason);
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [applicationQueryKey.list] }),
        refreshAppointments(),
      ]);
      message.success('Успешно отменено');
      setCancelModal({ visible: false, type: 'appointment', id: '' });
      clearCancellationReason(`${variables.type}:${variables.id}`);
    },
    onError: async (error) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: [applicationQueryKey.list],
          }),
          refreshAppointments(),
        ]);
        setCancelModal({ visible: false, type: 'appointment', id: '' });
      }
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

  const isLoading =
    isLoadingAppointments ||
    isLoadingApplications ||
    rescheduleQueries.some((query) => query.isPending);

  if (isLoading) {
    return (
      <div className={styles.pageLoaderWrapper}>
        <PageLoader />
      </div>
    );
  }

  const loadError =
    appointmentsError ||
    applicationsError ||
    rescheduleQueries.find((query) => query.error)?.error;
  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Не удалось загрузить личный кабинет"
        description={getErrorMessage(loadError)}
      />
    );
  }

  return (
    <>
      <GreetingCard userName={userName} />

      <div className={styles.contactNotice}>
        *По любым организационным вопросам или в случае чрезвычайной ситуации вы
        можете связаться с психологом по тем контактам, что указаны в
        заявке/записи.
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ваши записи</h3>
        <div className={styles.cardsGrid}>
          {regularUpcoming.length > 0 ? (
            regularUpcoming.map((app) => (
              <AppointmentCard
                key={app.id}
                date={moscowDate(app.scheduled_time).toFormat('d MMMM, HH:mm')}
                doctorName={getTherapistName(app.psychologist)}
                address={
                  app.type === 'Online' ? 'Онлайн' : app.venue || 'Офлайн'
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
              {awaitingReschedules.length
                ? 'Переносы записей ожидают вашего подтверждения ниже'
                : 'У вас пока что нет активных записей'}
            </p>
          )}
        </div>
      </section>

      {inProcessing.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>В обработке у специалиста</h3>
          <div className={styles.cardsGrid}>
            {inProcessing.map((app) => {
              const scheduledStr = app.scheduled_at
                ? moscowDate(app.scheduled_at).toFormat('d MMMM, HH:mm')
                : 'Время подбирается специалистом';

              return (
                <AppointmentCard
                  key={app.id}
                  date={scheduledStr}
                  doctorName={getTherapistName(app.psychologist)}
                  address={getApplicationAddress(app)}
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

      {(awaitingConfirmation.length > 0 || awaitingReschedules.length > 0) && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Требуют подтверждения</h3>
          <div className={styles.cardsGrid}>
            {awaitingReschedules.map(({ appointment, request }) => (
              <AppointmentCard
                key={request.id}
                date={moscowDate(request.requested_scheduled_time).toFormat(
                  'd MMMM, HH:mm',
                )}
                doctorName={getTherapistName(appointment.psychologist)}
                address={
                  appointment.type === 'Online'
                    ? 'Онлайн'
                    : request.requested_venue || appointment.venue || 'Офлайн'
                }
                description={`Психолог предлагает перенос с ${moscowDate(appointment.scheduled_time).toFormat('d MMMM yyyy, HH:mm')} на ${moscowDate(request.requested_scheduled_time).toFormat('d MMMM yyyy, HH:mm')} по Москве. При отказе запись будет отменена.`}
                type="confirmation"
                disabled={
                  confirmRescheduleMutation.isPending ||
                  cancelMutation.isPending
                }
                onConfirm={() => handleConfirmReschedule(request)}
                onCancel={() =>
                  setCancelModal({
                    visible: true,
                    type: 'reschedule',
                    id: request.id,
                  })
                }
              />
            ))}
            {awaitingConfirmation.map((app) => {
              const scheduledStr = app.scheduled_at
                ? moscowDate(app.scheduled_at).toFormat('d MMMM, HH:mm')
                : 'Время не назначено';

              return (
                <AppointmentCard
                  key={app.id}
                  date={scheduledStr}
                  doctorName={getTherapistName(app.psychologist)}
                  address={getApplicationAddress(app)}
                  type="confirmation"
                  status={app.status}
                  disabled={
                    confirmMutation.isPending || cancelMutation.isPending
                  }
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
                    app.type === 'Online' ? 'Онлайн' : app.venue || 'Офлайн'
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
                  address={getApplicationAddress(app)}
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
        title={
          cancelModal.type === 'reschedule'
            ? 'Отказ от переноса и отмена записи'
            : 'Отмена'
        }
        open={cancelModal.visible}
        onCancel={() => {
          if (cancelMutation.isPending) return;
          setCancelModal({ visible: false, type: 'appointment', id: '' });
        }}
        onOk={handleCancelSubmit}
        confirmLoading={cancelMutation.isPending}
        cancelButtonProps={{ disabled: cancelMutation.isPending }}
        closable={!cancelMutation.isPending}
        mask={{ closable: !cancelMutation.isPending }}
        keyboard={!cancelMutation.isPending}
        okText="Подтвердить отмену"
        cancelText="Назад"
        okButtonProps={{ danger: true, disabled: !cancelReason.trim() }}
      >
        {cancelModal.type === 'reschedule' && (
          <p>
            Отказ от переноса отменит саму запись. Прежнее время не сохранится.
          </p>
        )}
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
