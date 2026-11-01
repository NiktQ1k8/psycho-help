import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Result } from 'antd';
import { isAxiosError } from 'axios';
import clsx from 'clsx';
import type { DateTime } from 'luxon';
import {
  appointmentQueryKey,
  createAppointment,
  updateAppointmentEmergencyContact,
} from '@/entities/appointment/api';
import type {
  TAppointmentCreateRequest,
  TAppointmentType,
} from '@/entities/appointment/types';
import { useAuth } from '@/entities/auth/model/useAuth';
import {
  therapistQueries,
  therapistQueryKey,
} from '@/entities/therapist/queries';
import { useAppointmentBooking } from '@/features/personal-cabinet/model/appointment-booking';
import { getRequestErrorMessage } from '@/shared/api/errors';
import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';
import Arrow from '@/shared/assets/images/appointments/arrow.svg?react';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import './AppointmentForm.antd.scss';
import styles from './AppointmentForm.module.scss';
import privacyFile from './assets/Privacy_police.pdf';

const isMeetingUrlValid = (value?: string | null) => {
  try {
    const url = new URL(value?.trim() ?? '');
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

export const AppointmentForm = () => {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const formatParam = searchParams.get('format');
  const formatFromQuery: TAppointmentType | null =
    formatParam === 'online'
      ? 'Online'
      : formatParam === 'offline'
        ? 'Offline'
        : null;
  const {
    data: doctors = [],
    isLoading,
    error: doctorsError,
  } = useQuery(therapistQueries.list());
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const appointment = useAppointmentBooking((state) => state.appointment);
  const createdAppointmentId = useAppointmentBooking(
    (state) => state.createdAppointmentId,
  );
  const [contactSaveError, setContactSaveError] = useState('');
  const setAppointment = useAppointmentBooking((state) => state.setAppointment);
  const meetingType = appointment.type;
  const setMeetingType = useAppointmentBooking((state) => state.setType);
  const selectedOffices = useAppointmentBooking(
    (state) => state.selectedOffices,
  );
  const setSelectedOffices = useAppointmentBooking(
    (state) => state.setSelectedOffices,
  );
  const [scheduleDate, setScheduleDate] = useState<DateTime>(() =>
    appointment.scheduled_time
      ? moscowDate(appointment.scheduled_time).startOf('day')
      : moscowDate().plus({ days: 1 }).startOf('day'),
  );
  const [window, setWindow] = useState<'form' | 'results'>(
    createdAppointmentId ? 'results' : 'form',
  );
  const selectedDate = appointment.scheduled_time
    ? moscowDate(appointment.scheduled_time)
    : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      !createdAppointmentId &&
      formatFromQuery &&
      formatFromQuery !== useAppointmentBooking.getState().appointment.type
    ) {
      setMeetingType(formatFromQuery);
    }
  }, [createdAppointmentId, formatFromQuery, setMeetingType]);

  const handleMeetingTypeChange = (nextType: TAppointmentType) => {
    setMeetingType(nextType);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('format', nextType.toLowerCase());
    setSearchParams(nextParams, { replace: true });
  };

  const filteredDoctors = useMemo(() => {
    let availableDoctors = doctors;

    if (meetingType === 'Offline') {
      availableDoctors = availableDoctors.filter(
        (doctor) => doctor.office && doctor.office.toLowerCase() !== 'онлайн',
      );
    }

    if (meetingType === 'Offline' && selectedOffices.length > 0) {
      availableDoctors = availableDoctors.filter(
        (doctor) => doctor.office && selectedOffices.includes(doctor.office),
      );
    }

    return availableDoctors;
  }, [doctors, selectedOffices, meetingType]);

  const handleOfficeToggle = (office: string) => {
    setSelectedOffices(
      selectedOffices.includes(office)
        ? selectedOffices.filter((item) => item !== office)
        : [...selectedOffices, office],
    );
  };

  const selectedIndex = filteredDoctors.findIndex(
    (doctor) => doctor.id === appointment.psychologist_id,
  );
  const currentTherapistIndex = Math.max(0, selectedIndex);
  const handleNextTherapist = () => {
    if (currentTherapistIndex < filteredDoctors.length - 1) {
      setAppointment({
        psychologist_id: filteredDoctors[currentTherapistIndex + 1].id,
        scheduled_time: undefined,
      });
    }
  };

  const handlePrevTherapist = () => {
    if (currentTherapistIndex > 0) {
      setAppointment({
        psychologist_id: filteredDoctors[currentTherapistIndex - 1].id,
        scheduled_time: undefined,
      });
    }
  };

  const currentTherapist = filteredDoctors[currentTherapistIndex];
  const isOnlineOnly = currentTherapist?.office?.toLowerCase() === 'онлайн';

  const uniqueOffices = useMemo(
    () =>
      Array.from(new Set(doctors.map((d) => d.office).filter(Boolean))).filter(
        (office) => office?.toLowerCase() !== 'онлайн',
      ),
    [doctors],
  );

  const {
    data: schedule,
    isFetching: isLoadingSchedule,
    error: scheduleError,
    refetch: refetchSchedule,
  } = useQuery({
    ...therapistQueries.schedule(currentTherapist?.id ?? '', {
      date: scheduleDate.toFormat('yyyy-MM-dd'),
      duration: appointment.duration ?? 60,
    }),
    enabled: !!currentTherapist && !!meetingType,
  });
  const availableSlots = (schedule?.available_slots ?? []).filter(
    (slot) =>
      slot.format === (meetingType === 'Online' ? 'онлайн' : 'очно') &&
      moscowDate(slot.datetime).toMillis() > moscowDate().toMillis(),
  );
  const selectedSlot = availableSlots.find(
    (slot) => slot.datetime === appointment.scheduled_time,
  );

  if (isLoading) return <Loader />;

  const handleNextButton = () => {
    if (!meetingType) {
      message.error('Выберите формат консультации');
      return;
    }
    if (!currentTherapist) {
      message.error('Специалист не выбран');
      return;
    }
    if (!selectedDate) {
      message.error('Выберите дату и время приема');
      return;
    }
    if (
      !selectedSlot ||
      isLoadingSchedule ||
      scheduleError ||
      selectedDate.toMillis() <= moscowDate().toMillis()
    ) {
      message.error('Выберите доступное время консультации');
      return;
    }
    if (meetingType === 'Online' && !isMeetingUrlValid(appointment.venue)) {
      message.error(
        'Укажите ссылку на онлайн-консультацию, начинающуюся с https:// или http://',
      );
      return;
    }
    const description = appointment.reason?.trim();
    if (description && description.length > 2000) {
      message.error('Сократите описание до 2000 символов');
      return;
    }
    if ((appointment.comment?.trim().length ?? 0) > 512) {
      message.error('Сократите комментарий к записи до 512 символов');
      return;
    }
    if ((appointment.emergency_contact?.trim().length ?? 0) > 512) {
      message.error('Сократите экстренный контакт до 512 символов');
      return;
    }

    setWindow('results');
  };

  const finishBooking = () => {
    useAppointmentBooking.getState().resetAppointment();
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('format');
    nextParams.set('tab', 'main');
    setSearchParams(nextParams, { replace: true });
    setWindow('form');
  };

  const handleSubmit = async () => {
    if (
      isSubmitting ||
      !user ||
      !currentTherapist ||
      !selectedDate ||
      !meetingType
    )
      return;
    if (
      !createdAppointmentId &&
      (!selectedSlot ||
        isLoadingSchedule ||
        scheduleError ||
        selectedDate.toMillis() <= moscowDate().toMillis())
    ) {
      message.error('Выберите доступное время консультации');
      setWindow('form');
      return;
    }
    if ((appointment.comment?.trim().length ?? 0) > 512) {
      message.error('Сократите комментарий к записи до 512 символов');
      setWindow('form');
      return;
    }
    if ((appointment.emergency_contact?.trim().length ?? 0) > 512) {
      message.error('Сократите экстренный контакт до 512 символов');
      return;
    }
    setIsSubmitting(true);
    setContactSaveError('');

    if (meetingType === 'Online' && !isMeetingUrlValid(appointment.venue)) {
      message.error('Укажите корректную ссылку на онлайн-консультацию');
      setWindow('form');
      setIsSubmitting(false);
      return;
    }
    const requestData: TAppointmentCreateRequest = {
      psychologist_id: currentTherapist.id,
      type: meetingType,
      duration: appointment.duration ?? 60,
      scheduled_time: toApiDate(selectedDate),
      reason: appointment.reason?.trim() || null,
      comment: appointment.comment?.trim() || null,
      ...(meetingType === 'Online' ? { venue: appointment.venue?.trim() } : {}),
    };

    try {
      let appointmentId = createdAppointmentId;
      if (!appointmentId) {
        const created = await createAppointment(requestData);
        appointmentId = created.id;
        useAppointmentBooking.getState().setCreatedAppointmentId(created.id);
        queryClient.setQueryData(
          [appointmentQueryKey.byId, created.id],
          created,
        );
        void queryClient.invalidateQueries({
          queryKey: [therapistQueryKey.schedule, currentTherapist.id],
        });
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.list],
        });
      }
      const contact = appointment.emergency_contact?.trim();
      if (contact) {
        const updated = await updateAppointmentEmergencyContact(appointmentId, {
          emergency_contact: contact,
        });
        queryClient.setQueryData(
          [appointmentQueryKey.byId, appointmentId],
          updated,
        );
        void queryClient.invalidateQueries({
          queryKey: [appointmentQueryKey.list],
        });
      }
      message.success('Вы записаны на консультацию');
      finishBooking();
    } catch (error) {
      if (useAppointmentBooking.getState().createdAppointmentId) {
        setContactSaveError(
          'Запись создана, но экстренный контакт не удалось сохранить. Повторите сохранение или добавьте контакт позже в списке записей.',
        );
      } else if (isAxiosError(error) && error.response?.status === 409) {
        setAppointment({ scheduled_time: undefined });
        setWindow('form');
        void queryClient.invalidateQueries({
          queryKey: [therapistQueryKey.schedule, currentTherapist.id],
        });
        message.error(
          'Это время уже заняли. Выберите другое время консультации.',
        );
      } else if (isAxiosError(error) && error.response?.status === 400) {
        setWindow('form');
        void queryClient.invalidateQueries({
          queryKey: [therapistQueryKey.schedule, currentTherapist.id],
        });
        message.error(
          'Выбранное время или условия консультации недоступны. Выберите другое время или свяжитесь с психологом.',
        );
      } else if (isAxiosError(error) && error.response?.status === 422) {
        setWindow('form');
        message.error(
          'Не удалось записаться. Проверьте дату, формат и ссылку на встречу.',
        );
      } else {
        message.error(
          getRequestErrorMessage(
            error,
            'Не удалось записаться. Попробуйте ещё раз.',
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (doctorsError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить форму записи"
        subTitle={getRequestErrorMessage(doctorsError)}
      />
    );
  }

  return (
    <>
      {window === 'form' || !currentTherapist ? (
        <div className={styles.form} data-appointment-form>
          <div>
            <h3 className={styles.label}>Выберите формат консультации</h3>
            <div className={styles.format__btns}>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'Online',
                })}
                onClick={() => handleMeetingTypeChange('Online')}
                aria-pressed={meetingType === 'Online'}
              >
                Онлайн
              </button>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'Offline',
                })}
                onClick={() => handleMeetingTypeChange('Offline')}
                aria-pressed={meetingType === 'Offline'}
              >
                Очно
              </button>
            </div>
          </div>

          {meetingType === 'Offline' && uniqueOffices.length > 0 && (
            <div>
              <p className={styles.label}>Выберите место консультации</p>
              <div className={styles.location__btns}>
                {uniqueOffices.map((office) => (
                  <div key={office} className={styles.location__element}>
                    <input
                      type="checkbox"
                      id={`office-${office}`}
                      checked={selectedOffices.includes(office)}
                      onChange={() => handleOfficeToggle(office)}
                    />
                    <label
                      htmlFor={`office-${office}`}
                      className={styles.location__text}
                    >
                      {office}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.therapist}>
            <div className={styles.galleryHeader}>
              <p className={styles.label}>Выберите специалиста</p>

              {filteredDoctors.length > 1 && (
                <div className={styles.galleryNav}>
                  <button
                    type="button"
                    className={styles.galleryBtn}
                    onClick={handlePrevTherapist}
                    disabled={currentTherapistIndex === 0}
                    aria-label="Предыдущий специалист"
                  >
                    <Arrow
                      className={clsx(
                        styles.galleryArrow,
                        styles.galleryArrow__prev,
                      )}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    className={styles.galleryBtn}
                    onClick={handleNextTherapist}
                    disabled={
                      currentTherapistIndex === filteredDoctors.length - 1
                    }
                    aria-label="Следующий специалист"
                  >
                    <Arrow className={styles.galleryArrow} aria-hidden />
                  </button>
                </div>
              )}
            </div>

            {filteredDoctors.length > 0 && currentTherapist ? (
              <div>
                <div className={styles.mainInfo}>
                  <div className={styles.imgWrapper}>
                    <img
                      key={currentTherapist.id || currentTherapist.photo}
                      className={styles.photo}
                      src={
                        currentTherapist.photo
                          ? `${import.meta.env.VITE_REACT_APP_IMAGE_URL}${currentTherapist.photo}`
                          : altPhoto
                      }
                      alt={`Психолог ${currentTherapist.last_name} ${currentTherapist.first_name}`}
                      onError={(event) => {
                        if (
                          event.currentTarget.getAttribute('src') !== altPhoto
                        )
                          event.currentTarget.src = altPhoto;
                      }}
                    />
                  </div>
                  <div className={styles.info}>
                    <div className={styles.infoBlock}>
                      <p className={styles.name}>
                        {[
                          currentTherapist.last_name,
                          currentTherapist.first_name,
                          currentTherapist.middle_name,
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                      <p className={styles.qual}>
                        {currentTherapist.qualification}
                      </p>
                      <p className={styles.exp}>
                        Опыт {currentTherapist.experience}
                      </p>
                    </div>

                    <div className={styles.infoBlock}>
                      <p className={styles.qual}>
                        {isOnlineOnly
                          ? 'Принимает только онлайн'
                          : 'Принимает лично и онлайн'}
                      </p>
                      {!isOnlineOnly && (
                        <p className={styles.office}>
                          {currentTherapist.office}
                        </p>
                      )}
                    </div>

                    <div>
                      <p className={styles.qual}>С чем поможет</p>
                      <div className={styles.consultAreas}>
                        {currentTherapist.consult_areas
                          ?.split(',')
                          .map((item) => {
                            const text =
                              item.trim().charAt(0).toUpperCase() +
                              item.trim().slice(1);
                            if (!text) return null;
                            return (
                              <span key={text} className={styles.consultArea}>
                                {text}
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className={styles.empty}>
                {meetingType === 'Offline'
                  ? 'По выбранным фильтрам специалисты не найдены'
                  : 'Нет доступных специалистов'}
              </p>
            )}
          </div>

          <fieldset className={clsx(styles.field, styles.chipField)}>
            <legend className={styles.label}>Длительность консультации</legend>
            <div className={styles.chips}>
              {([60, 90] as const).map((duration) => (
                <label key={duration} className={styles.chip}>
                  <input
                    type="radio"
                    name="appointment-duration"
                    className={styles.chipInput}
                    value={duration}
                    checked={(appointment.duration ?? 60) === duration}
                    onChange={() =>
                      setAppointment({
                        duration,
                        scheduled_time: undefined,
                      })
                    }
                  />
                  <span className={styles.chipLabel}>{duration} минут</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-date">
              Выберите дату
            </label>
            <DatePicker<DateTime>
              id="booking-date"
              value={scheduleDate}
              allowClear={false}
              format="DD.MM.YYYY"
              className={styles.datePicker}
              placeholder="Выберите дату"
              disabledDate={(current) =>
                current.startOf('day') < moscowDate().startOf('day')
              }
              onChange={(value) => {
                if (value) {
                  setScheduleDate(value.startOf('day'));
                  setAppointment({ scheduled_time: undefined });
                }
              }}
            />
          </div>
          <fieldset
            className={clsx(styles.field, styles.chipField)}
            disabled={!meetingType || isLoadingSchedule || !!scheduleError}
          >
            <legend className={styles.label}>Доступное время</legend>
            {!meetingType && <p>Сначала выберите формат консультации.</p>}
            {isLoadingSchedule && <p role="status">Загрузка времени…</p>}
            {meetingType && !isLoadingSchedule && !scheduleError && (
              <div className={styles.chips}>
                {availableSlots.map((slot) => (
                  <label key={slot.datetime} className={styles.chip}>
                    <input
                      type="radio"
                      name="booking-time"
                      className={styles.chipInput}
                      value={slot.datetime}
                      checked={selectedSlot?.datetime === slot.datetime}
                      onChange={() =>
                        setAppointment({
                          psychologist_id: currentTherapist?.id,
                          scheduled_time: slot.datetime,
                        })
                      }
                    />
                    <span className={styles.chipLabel}>
                      {moscowDate(slot.datetime).toFormat('HH:mm')}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {meetingType &&
              !isLoadingSchedule &&
              !scheduleError &&
              !availableSlots.length && (
                <p>
                  На эту дату свободного времени нет. Выберите другую дату или
                  специалиста.
                </p>
              )}
          </fieldset>
          {scheduleError && (
            <Alert
              type="error"
              showIcon
              title="Не удалось загрузить доступное время"
              description={getRequestErrorMessage(scheduleError)}
              action={
                <Button onClick={() => void refetchSchedule()}>
                  Повторить
                </Button>
              }
            />
          )}
          {meetingType === 'Online' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="booking-venue">
                Ссылка на онлайн-консультацию
              </label>
              <input
                id="booking-venue"
                type="url"
                maxLength={128}
                className={styles.venueInput}
                value={appointment.venue ?? ''}
                onChange={(event) =>
                  setAppointment({ venue: event.target.value })
                }
                placeholder="https://…"
                aria-describedby="booking-venue-hint"
              />
              <p id="booking-venue-hint">
                Укажите ссылку на встречу, согласованную с психологом.
              </p>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-reason">
              Ваш запрос
            </label>
            <textarea
              id="booking-reason"
              maxLength={2000}
              value={appointment.reason ?? ''}
              onChange={(e) => setAppointment({ reason: e.target.value })}
              className={styles.textarea}
              placeholder="Опишите вашу проблему"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-comment">
              Комментарий к записи (необязательно)
            </label>
            <textarea
              id="booking-comment"
              maxLength={512}
              value={appointment.comment ?? ''}
              onChange={(event) =>
                setAppointment({ comment: event.target.value })
              }
              className={styles.textarea}
              placeholder="Например, приду вместе с другом"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="booking-emergency-contact">
              Экстренный контакт (необязательно)
            </label>
            <textarea
              id="booking-emergency-contact"
              value={appointment.emergency_contact ?? ''}
              onChange={(event) =>
                setAppointment({ emergency_contact: event.target.value })
              }
              maxLength={512}
              className={styles.textarea}
              placeholder="Например, мама Анна, +7 999 123-45-67"
              aria-describedby="booking-emergency-contact-hint"
            />
            <p
              id="booking-emergency-contact-hint"
              className={styles.privacy_text}
            >
              С кем связаться в экстренной ситуации: имя, кем вам приходится
              человек и телефон или другой способ связи. Контакт увидит
              назначенный психолог.
            </p>
          </div>

          <div>
            <p className={styles.privacy_text}>
              *Все данные пользователя надежно защищены и строго
              конфиденциальны. Доступны для просмотра исключительно психологу.
            </p>
            <a
              className={styles.privacy_link}
              href={privacyFile}
              target="_blank"
              rel="noopener noreferrer"
            >
              Правила обработки специальных категорий персональных данных
            </a>
          </div>

          <button
            className={styles.subButton}
            type="button"
            onClick={handleNextButton}
          >
            Далее
          </button>
        </div>
      ) : (
        <div>
          {!createdAppointmentId && (
            <BackButton
              className={styles.backButton}
              lightColor="var(--labels-neutral-secondary)"
              darkColor="var(--labels-neutral-inverted-primary)"
              onClick={() => setWindow('form')}
            />
          )}
          <div className={styles.results__info}>
            <h3 className={styles.results__title}>Запись</h3>

            <p className={styles.results__text}>
              <span
                className={clsx(styles.results__text, styles.results__textGray)}
              >
                Дата и время:{' '}
              </span>
              {selectedDate?.toFormat('dd MMMM yyyy, HH:mm')}
            </p>

            <p className={styles.results__text}>
              <span
                className={clsx(styles.results__text, styles.results__textGray)}
              >
                Психолог:{' '}
              </span>
              {[
                currentTherapist.last_name,
                currentTherapist.first_name,
                currentTherapist.middle_name,
              ].join(' ')}
            </p>

            <p className={styles.results__text}>
              <span
                className={clsx(styles.results__text, styles.results__textGray)}
              >
                Место:{' '}
              </span>
              {meetingType === 'Online'
                ? appointment.venue
                : currentTherapist.office}
            </p>

            <p className={styles.results__text}>
              Длительность: {appointment.duration ?? 60} минут
            </p>

            <label
              className={clsx(styles.results__text, styles.results__textGray)}
              htmlFor="booking-reason-preview"
            >
              Тема встречи:
            </label>
            <textarea
              id="booking-reason-preview"
              value={appointment.reason ?? ''}
              readOnly
              className={clsx(styles.textarea, styles.results__textarea)}
            />

            {appointment.comment?.trim() && (
              <>
                <label
                  className={clsx(
                    styles.results__text,
                    styles.results__textGray,
                  )}
                  htmlFor="booking-comment-preview"
                >
                  Комментарий к записи:
                </label>
                <textarea
                  id="booking-comment-preview"
                  value={appointment.comment.trim()}
                  readOnly
                  className={clsx(styles.textarea, styles.results__textarea)}
                />
              </>
            )}

            {appointment.emergency_contact?.trim() && (
              <>
                <label
                  className={clsx(
                    styles.results__text,
                    styles.results__textGray,
                  )}
                  htmlFor="booking-emergency-contact-preview"
                >
                  Экстренный контакт:
                </label>
                <textarea
                  id="booking-emergency-contact-preview"
                  value={appointment.emergency_contact.trim()}
                  readOnly
                  className={clsx(styles.textarea, styles.results__textarea)}
                />
              </>
            )}

            {createdAppointmentId && (
              <Alert
                type="warning"
                showIcon
                title="Запись уже создана"
                description={
                  contactSaveError ||
                  'Осталось сохранить экстренный контакт. Повторная попытка не создаст новую запись.'
                }
              />
            )}

            <button
              className={styles.submitBtn}
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Отправка...'
                : createdAppointmentId
                  ? 'Сохранить контакт'
                  : 'Записаться'}
            </button>
            {createdAppointmentId && (
              <Button onClick={finishBooking} disabled={isSubmitting}>
                Перейти к записям
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
