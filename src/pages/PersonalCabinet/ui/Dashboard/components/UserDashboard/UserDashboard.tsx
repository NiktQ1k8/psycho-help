import { useMemo, useState } from 'react';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Alert, App, Button, Input, Modal } from 'antd';
import { isAxiosError } from 'axios';
import {
  appointmentQueries,
  appointmentQueryKey,
  cancelAppointment,
  confirmAppointmentReschedule,
  rejectAppointmentReschedule,
} from '@/entities/appointment/api';
import { getRescheduleDescription } from '@/entities/appointment/reschedule';
import type {
  TAppointment,
  TAppointmentReschedule,
  TAppointmentStatus,
} from '@/entities/appointment/types';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { therapistQueryKey } from '@/entities/therapist/queries';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { isConsultationTimeValid } from '@/features/personal-cabinet/model/consultation-time';
import { AppointmentCard } from '@/features/personal-cabinet/ui/AppointmentCard/AppointmentCard';
import { EmergencyContactModal } from '@/features/personal-cabinet/ui/EmergencyContactModal/EmergencyContactModal';
import GreetingCard from '@/features/personal-cabinet/ui/greeting-card/GreetingCard';
import { getRequestErrorMessage } from '@/shared/api/errors';
import { moscowDate } from '@/shared/lib/date-time';
import PageLoader from '@/shared/ui/PageLoader';
import styles from './UserDashboard.module.scss';

type TUserDashboardProps = {
  userName: string;
};

const INITIATOR_LABELS: Record<string, string> = {
  patient: 'Пользователь (Вы)',
  psychologist: 'Психолог',
};

export const UserDashboard = ({ userName }: TUserDashboardProps) => {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [contactAppointment, setContactAppointment] =
    useState<TAppointment | null>(null);

  const [commentModalData, setCommentModalData] = useState<{
    status: TAppointmentStatus;
    text: string;
    initiator?: string | null;
  } | null>(null);

  const [cancelModal, setCancelModal] = useState<{
    visible: boolean;
    type: 'appointment' | 'reschedule';
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
  const { upcoming, past } = useMemo(() => {
    const upcoming: TAppointment[] = [];
    const past: TAppointment[] = [];

    (serverAppointments || []).forEach((item) => {
      if (item.status === 'awaiting') {
        upcoming.push(item);
      } else {
        past.push(item);
      }
    });

    upcoming.sort(
      (a, b) =>
        moscowDate(a.scheduled_time).toMillis() -
        moscowDate(b.scheduled_time).toMillis(),
    );
    past.sort(
      (a, b) =>
        moscowDate(b.scheduled_time).toMillis() -
        moscowDate(a.scheduled_time).toMillis(),
    );

    return { upcoming, past };
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

  const refreshAppointments = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [therapistQueryKey.schedule] }),
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
    onError: async (error, request) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await refreshAppointments();
      }
      message.error(
        getRequestErrorMessage(
          error,
          isConsultationTimeValid(moscowDate(request.requested_scheduled_time))
            ? 'Не удалось подтвердить перенос. Обновите записи и проверьте предложенное время.'
            : 'Предложенное время уже недоступно. Свяжитесь с психологом для выбора нового времени.',
        ),
      );
    },
  });

  const handleConfirmReschedule = async (request: TAppointmentReschedule) => {
    // В режиме await Ant Design обрабатывает отказ запроса и оставляет окно открытым.
    await modal.confirm({
      title: 'Подтверждение изменений записи',
      content: (
        <div className={styles.changeSummary}>
          {getRescheduleDescription(request)}
        </div>
      ),
      okText: 'Подтвердить',
      cancelText: 'Назад',
      onOk: () => confirmRescheduleMutation.mutateAsync(request),
    });
  };

  const cancelMutation = useMutation({
    mutationFn: async ({
      id,
      type,
      reason,
    }: {
      id: string;
      type: 'appointment' | 'reschedule';
      reason: string;
    }) => {
      if (type === 'reschedule') {
        return rejectAppointmentReschedule(id, reason);
      }
      return cancelAppointment(id, { cancel_reason: reason });
    },
    onSuccess: async (_data, variables) => {
      await refreshAppointments();
      message.success('Успешно отменено');
      setCancelModal({ visible: false, type: 'appointment', id: '' });
      clearCancellationReason(`${variables.type}:${variables.id}`);
    },
    onError: async (error) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await refreshAppointments();
        setCancelModal({ visible: false, type: 'appointment', id: '' });
      }
      message.error(
        getRequestErrorMessage(
          error,
          'Не удалось отменить запись. Обновите список и повторите попытку.',
        ),
      );
    },
  });

  const handleCancelSubmit = () => {
    if (cancelMutation.isPending) return;
    if (!cancelReason.trim()) {
      message.error('Пожалуйста, укажите причину отмены');
      return;
    }
    if (cancelReason.trim().length > 512) {
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
    isLoadingAppointments || rescheduleQueries.some((query) => query.isPending);

  if (isLoading) {
    return (
      <div className={styles.pageLoaderWrapper}>
        <PageLoader />
      </div>
    );
  }

  const loadError =
    appointmentsError || rescheduleQueries.find((query) => query.error)?.error;
  if (loadError) {
    return (
      <Alert
        type="error"
        showIcon
        title="Не удалось загрузить личный кабинет"
        description={getRequestErrorMessage(loadError)}
        action={
          <Button onClick={() => void refreshAppointments()}>Повторить</Button>
        }
      />
    );
  }

  return (
    <>
      <GreetingCard userName={userName} />

      <div className={styles.contactNotice}>
        *По любым организационным вопросам или в случае чрезвычайной ситуации вы
        можете связаться с психологом по тем контактам, что указаны в записи.
      </div>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Ваши записи</h3>
        <div className={styles.cardsGrid}>
          {regularUpcoming.length > 0 ? (
            regularUpcoming.map((app) => (
              <AppointmentCard
                key={app.id}
                date={moscowDate(app.scheduled_time).toFormat('d MMMM, HH:mm')}
                doctorName={getUserFullName(app.psychologist.user)}
                address={
                  app.venue || (app.type === 'Online' ? 'Онлайн' : 'Офлайн')
                }
                description={
                  app.comment
                    ? `Комментарий к записи: ${app.comment}`
                    : undefined
                }
                type="upcoming"
                status={app.status}
                disabled={
                  confirmRescheduleMutation.isPending ||
                  cancelMutation.isPending
                }
                onEmergencyContact={() => setContactAppointment(app)}
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

      {awaitingReschedules.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Требуют подтверждения</h3>
          <div className={styles.cardsGrid}>
            {awaitingReschedules.map(({ appointment, request }) => (
              <AppointmentCard
                key={request.id}
                date={moscowDate(request.requested_scheduled_time).toFormat(
                  'd MMMM, HH:mm',
                )}
                doctorName={getUserFullName(appointment.psychologist.user)}
                address={
                  request.requested_venue ||
                  appointment.venue ||
                  (appointment.type === 'Online' ? 'Онлайн' : 'Офлайн')
                }
                description={`${getRescheduleDescription(request)}\nПри отказе запись будет отменена.`}
                type="confirmation"
                disabled={
                  confirmRescheduleMutation.isPending ||
                  cancelMutation.isPending
                }
                onConfirm={() => void handleConfirmReschedule(request)}
                onEmergencyContact={() => setContactAppointment(appointment)}
                onCancel={() =>
                  setCancelModal({
                    visible: true,
                    type: 'reschedule',
                    id: request.id,
                  })
                }
              />
            ))}
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
                cancelInitiator = app.cancelled_by;
              } else if (isDone) {
                commentText = app.patient_comment ?? '';
              }

              const hasComment = Boolean(commentText);

              return (
                <AppointmentCard
                  key={app.id}
                  date={moscowDate(app.scheduled_time).toFormat(
                    'd MMMM, HH:mm',
                  )}
                  doctorName={getUserFullName(app.psychologist.user)}
                  address={
                    app.type === 'Online' ? 'Онлайн' : app.venue || 'Офлайн'
                  }
                  type="past"
                  status={app.status}
                  hasComment={hasComment}
                  onEmergencyContact={
                    app.emergency_contact
                      ? () => setContactAppointment(app)
                      : undefined
                  }
                  onComment={() =>
                    setCommentModalData({
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

      {contactAppointment && (
        <EmergencyContactModal
          key={contactAppointment.id}
          appointment={
            serverAppointments?.find(
              (item) => item.id === contactAppointment.id,
            ) ?? contactAppointment
          }
          onClose={() => setContactAppointment(null)}
        />
      )}

      <Modal
        title={
          commentModalData?.status === 'cancelled'
            ? 'Причина отмены'
            : 'Комментарий психолога'
        }
        open={!!commentModalData}
        onCancel={() => setCommentModalData(null)}
        footer={null}
      >
        {commentModalData?.status === 'cancelled' &&
          commentModalData.initiator && (
            <div className={styles.modalInitiator}>
              <strong>Инициатор отмены: </strong>
              {INITIATOR_LABELS[commentModalData.initiator] ||
                'Инициатор не указан'}
            </div>
          )}
        <div className={styles.modalText}>{commentModalData?.text}</div>
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
        <label
          className={styles.cancelLabel}
          htmlFor="appointment-cancel-reason"
        >
          Пожалуйста, укажите причину отмены:
        </label>
        <Input.TextArea
          id="appointment-cancel-reason"
          rows={4}
          value={cancelReason}
          maxLength={512}
          showCount
          disabled={cancelMutation.isPending}
          onChange={(e) => setCancellationReason(reasonKey, e.target.value)}
          placeholder="Например: Изменились планы, заболел(а)"
        />
      </Modal>
    </>
  );
};
