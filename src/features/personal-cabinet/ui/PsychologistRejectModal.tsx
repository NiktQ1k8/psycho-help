import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Input, Modal } from 'antd';
import { isAxiosError } from 'axios';
import {
  applicationQueryKey,
  rejectApplication,
} from '@/entities/application/api';
import {
  appointmentQueryKey,
  cancelAppointment,
} from '@/entities/appointment/api';
import {
  type TPsychologistReasonDraftType,
  usePsychologistDrafts,
} from '@/features/personal-cabinet/model/psychologist-drafts';
import { getErrorMessage } from '@/shared/api/errors';

const CONFIG: Record<
  TPsychologistReasonDraftType,
  {
    title: string;
    okText: string;
    label: string;
    sublabel: string;
    placeholder: string;
    mutationFn: (id: string, reason: string) => Promise<unknown>;
    queryKey: string;
  }
> = {
  application: {
    title: 'Заявка',
    okText: 'Отклонить',
    label: 'Вы уверены, что хотите отклонить заявку? Укажите причину ниже.',
    sublabel: 'Причина отклонения заявки*',
    placeholder:
      'Клиент увидит это сообщение. Укажите причину отклонения и рекомендации (например, новое время, другой формат)',
    mutationFn: rejectApplication,
    queryKey: applicationQueryKey.list,
  },
  appointment: {
    title: 'Запись',
    okText: 'Отменить',
    label: 'Вы уверены, что хотите отменить запись? Укажите причину ниже.',
    sublabel: 'Причина отмены записи*',
    placeholder:
      'Клиент увидит это сообщение. Укажите причину отмены и рекомендации (например, новое время, другой формат)',
    mutationFn: cancelAppointment,
    queryKey: appointmentQueryKey.list,
  },
};

type TPsychologistRejectModalProps = {
  type: TPsychologistReasonDraftType;
  entityId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const PsychologistRejectModal = ({
  type,
  entityId,
  onClose,
  onSuccess,
}: TPsychologistRejectModalProps) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const reason = usePsychologistDrafts((state) =>
    entityId ? state.reasonDrafts[type]?.[entityId] || '' : '',
  );
  const setReasonDraft = usePsychologistDrafts((state) => state.setReasonDraft);
  const clearReasonDraft = usePsychologistDrafts(
    (state) => state.clearReasonDraft,
  );
  const config = CONFIG[type];

  const refreshEntity = (id: string) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [config.queryKey] }),
      queryClient.invalidateQueries({
        queryKey: [
          type === 'application'
            ? applicationQueryKey.byId
            : appointmentQueryKey.byId,
          id,
        ],
      }),
    ]);

  const mutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      config.mutationFn(id, reason),
    onSuccess: async (_data, variables) => {
      await refreshEntity(variables.id);
      clearReasonDraft(type, variables.id);
      onClose();
      onSuccess?.();
    },
    onError: async (error, variables) => {
      if (
        isAxiosError(error) &&
        [400, 409].includes(error.response?.status ?? 0)
      ) {
        await refreshEntity(variables.id);
        onClose();
      }
      message.error(getErrorMessage(error, 'Не удалось выполнить операцию'));
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <Modal
      centered={true}
      title={config.title}
      open={entityId !== null}
      onCancel={handleClose}
      okText={config.okText}
      cancelText="Закрыть"
      cancelButtonProps={{ disabled: mutation.isPending }}
      closable={!mutation.isPending}
      maskClosable={!mutation.isPending}
      keyboard={!mutation.isPending}
      okButtonProps={{
        danger: true,
        disabled: reason.trim().length === 0,
        loading: mutation.isPending,
      }}
      onOk={() => {
        if (entityId && reason.trim()) {
          mutation.mutate({ id: entityId, reason: reason.trim() });
        }
      }}
    >
      <p style={{ marginBottom: 5 }}>{config.label}</p>
      <p>{config.sublabel}</p>
      <Input.TextArea
        rows={6}
        disabled={mutation.isPending}
        value={reason}
        onChange={(e) => {
          if (entityId) {
            setReasonDraft(type, entityId, e.target.value);
          }
        }}
        placeholder={config.placeholder}
        maxLength={500}
        showCount
      />
    </Modal>
  );
};

export default PsychologistRejectModal;
