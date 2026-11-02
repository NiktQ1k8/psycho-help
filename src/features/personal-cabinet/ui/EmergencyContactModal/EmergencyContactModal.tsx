import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Input, Modal } from 'antd';
import { isAxiosError } from 'axios';
import {
  appointmentQueryKey,
  updateAppointmentEmergencyContact,
} from '@/entities/appointment/api';
import type { TAppointment } from '@/entities/appointment/types';
import { getRequestErrorMessage } from '@/shared/api/errors';
import styles from './EmergencyContactModal.module.scss';

interface IEmergencyContactModalProps {
  appointment: TAppointment;
  onClose: () => void;
}

export const EmergencyContactModal = ({
  appointment,
  onClose,
}: IEmergencyContactModalProps) => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [contact, setContact] = useState(appointment.emergency_contact ?? '');
  const [errorMessage, setErrorMessage] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const readOnly = appointment.status !== 'awaiting' || unavailable;
  const mutation = useMutation({
    mutationFn: () =>
      updateAppointmentEmergencyContact(appointment.id, {
        emergency_contact: contact.trim() || null,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData([appointmentQueryKey.byId, updated.id], updated);
      void queryClient.invalidateQueries({
        queryKey: [appointmentQueryKey.list],
      });
      message.success('Экстренный контакт сохранён');
      onClose();
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 404 || status === 409) {
        setUnavailable(true);
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.list],
        });
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.byId, appointment.id],
        });
      }
      setErrorMessage(
        status === 409
          ? 'Запись уже завершена или отменена. Изменить экстренный контакт больше нельзя.'
          : status === 404
            ? 'Запись не найдена или доступ к ней изменился. Закройте окно и обновите список записей.'
            : status === 422
              ? 'Не удалось сохранить контакт. Укажите не более 512 символов.'
              : getRequestErrorMessage(
                  error,
                  'Не удалось сохранить контакт. Повторите попытку.',
                ),
      );
    },
  });

  return (
    <Modal
      cancelButtonProps={{ disabled: mutation.isPending }}
      cancelText={readOnly ? 'Закрыть' : 'Назад'}
      centered
      closable={!mutation.isPending}
      confirmLoading={mutation.isPending}
      footer={
        readOnly ? (
          <Button disabled={mutation.isPending} onClick={onClose}>
            Закрыть
          </Button>
        ) : undefined
      }
      keyboard={!mutation.isPending}
      mask={{ closable: !mutation.isPending }}
      okButtonProps={{
        disabled: contact.trim().length > 512,
      }}
      okText="Сохранить"
      open
      title="Экстренный контакт"
      onCancel={() => {
        if (!mutation.isPending) onClose();
      }}
      onOk={() => {
        if (!readOnly && !mutation.isPending && contact.trim().length <= 512) {
          setErrorMessage('');
          mutation.mutate();
        }
      }}
    >
      <div className={styles.content}>
        <p id="emergency-contact-hint">
          Укажите имя человека, кем он приходится пациенту и как с ним связаться
          в экстренной ситуации. Контакт виден пациенту и назначенному
          психологу.
          {!readOnly && ' Чтобы удалить контакт, очистите поле и сохраните.'}
        </p>
        <label htmlFor="emergency-contact">Контакт (необязательно)</label>
        <Input.TextArea
          aria-describedby="emergency-contact-hint"
          disabled={mutation.isPending}
          id="emergency-contact"
          maxLength={512}
          placeholder="Например, мама Анна, +7 999 123-45-67"
          readOnly={readOnly}
          rows={4}
          showCount
          value={contact}
          onChange={(event) => setContact(event.target.value)}
        />
        {readOnly && !errorMessage && (
          <p>
            После завершения или отмены записи контакт доступен только для
            просмотра.
          </p>
        )}
        {errorMessage && <Alert showIcon title={errorMessage} type="error" />}
      </div>
    </Modal>
  );
};
