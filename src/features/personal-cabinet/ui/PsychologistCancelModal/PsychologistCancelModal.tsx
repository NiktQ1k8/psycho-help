import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Checkbox, Input, Modal } from 'antd';
import { isAxiosError } from 'axios';
import {
  appointmentQueryKey,
  cancelAppointment,
} from '@/entities/appointment/api';
import { therapistQueryKey } from '@/entities/therapist/queries';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import { getRequestErrorMessage } from '@/shared/api/errors';

type TPsychologistCancelModalProps = {
  appointmentId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export const PsychologistCancelModal = ({
  appointmentId,
  onClose,
  onSuccess,
}: TPsychologistCancelModalProps) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isEmergency, setIsEmergency] = useState(false);
  const reason = usePsychologistDrafts((state) =>
    appointmentId ? state.reasonDrafts[appointmentId] || '' : '',
  );
  const setReasonDraft = usePsychologistDrafts((state) => state.setReasonDraft);
  const clearReasonDraft = usePsychologistDrafts(
    (state) => state.clearReasonDraft,
  );

  const refreshAppointment = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [appointmentQueryKey.list] }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.byId, id],
      }),
      queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.reschedules, id],
      }),
      queryClient.invalidateQueries({ queryKey: [therapistQueryKey.schedule] }),
    ]);

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      cancelAppointment(id, {
        cancel_reason: reason,
        is_emergency: isEmergency,
      }),
    onSuccess: async (_data, variables) => {
      await refreshAppointment(variables.id);
      clearReasonDraft(variables.id);
      setIsEmergency(false);
      onClose();
      onSuccess?.();
    },
    onError: async (error, variables) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await refreshAppointment(variables.id);
      }
      message.error(
        getRequestErrorMessage(
          error,
          'Не удалось отменить запись. Попробуйте ещё раз.',
        ),
      );
    },
  });

  return (
    <Modal
      centered
      title="Отмена записи"
      open={appointmentId !== null}
      onCancel={() => {
        if (!mutation.isPending) {
          setIsEmergency(false);
          onClose();
        }
      }}
      okText="Отменить запись"
      cancelText="Назад"
      confirmLoading={mutation.isPending}
      cancelButtonProps={{ disabled: mutation.isPending }}
      closable={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      keyboard={!mutation.isPending}
      okButtonProps={{
        danger: true,
        disabled: !isEmergency || !reason.trim() || reason.trim().length > 512,
      }}
      onOk={() => {
        if (
          isEmergency &&
          appointmentId &&
          reason.trim() &&
          reason.trim().length <= 512 &&
          !mutation.isPending
        )
          mutation.mutate({ id: appointmentId, reason: reason.trim() });
      }}
    >
      <p>Укажите причину отмены. Клиент увидит это сообщение.</p>
      <Input.TextArea
        rows={6}
        disabled={mutation.isPending}
        value={reason}
        onChange={(event) => {
          if (appointmentId) setReasonDraft(appointmentId, event.target.value);
        }}
        aria-label="Причина отмены записи"
        placeholder="Причина отмены и рекомендации"
        maxLength={512}
        showCount
      />
      <p>
        <Checkbox
          checked={isEmergency}
          disabled={mutation.isPending}
          onChange={(event) => setIsEmergency(event.target.checked)}
        >
          Экстренная отмена
        </Checkbox>
      </p>
      <p>
        Психолог может отменить запись только при чрезвычайной ситуации. Для
        изменения времени предложите перенос.
      </p>
    </Modal>
  );
};
