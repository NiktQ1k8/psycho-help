import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Result } from 'antd';
import clsx from 'clsx';
import {
  applicationQueries,
  applicationQueryKey,
  createApplication,
} from '@/entities/application/api';
import type {
  TApplicationCreateRequest,
  TMeetingType,
  TUniversityStatus,
} from '@/entities/application/types';
import { useAuth } from '@/entities/auth/model/useAuth';
import { therapistQueries } from '@/entities/therapist/queries';
import { useApplication } from '@/features/personal-cabinet/model/application';
import {
  CONSULTATION_START_HOUR,
  CONSULTATION_TIME_HINT,
  disabledConsultationTime,
  isConsultationTimeValid,
} from '@/features/personal-cabinet/model/consultation-time';
import { getErrorMessage } from '@/shared/api/errors';
import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';
import Arrow from '@/shared/assets/images/appointments/arrow.svg?react';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';
import { Img } from '@/shared/ui';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { DatePicker } from '@/shared/ui/date-picker/MoscowDatePicker';
import Loader from '@/shared/ui/loader/loader';
import styles from './AppointmentForm.module.scss';
import privacyFile from './assets/Privacy_police.pdf';

const AppointmentForm: FC = () => {
  const { message } = App.useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const formatParam = searchParams.get('format');
  const formatFromQuery: TMeetingType | null =
    formatParam === 'online' || formatParam === 'offline' ? formatParam : null;
  const {
    data: doctors = [],
    isLoading,
    error: doctorsError,
  } = useQuery(therapistQueries.list());
  const { data: universityStatuses = [], error: statusesError } = useQuery(
    applicationQueries.universityStatuses(),
  );
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const application = useApplication((state) => state.application);
  const setApplication = useApplication((state) => state.setApplication);
  const meetingType = useApplication((state) => state.meetingType);
  const setMeetingType = useApplication((state) => state.setMeetingType);
  const selectedOffices = useApplication((state) => state.selectedOffices);
  const setSelectedOffices = useApplication(
    (state) => state.setSelectedOffices,
  );
  const [window, setWindow] = useState<'form' | 'results'>('form');
  const selectedDate = application.scheduled_at
    ? moscowDate(application.scheduled_at)
    : null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (
      formatFromQuery &&
      formatFromQuery !== useApplication.getState().meetingType
    ) {
      setMeetingType(formatFromQuery);
    }
  }, [formatFromQuery, setMeetingType]);

  const handleMeetingTypeChange = (nextType: TMeetingType) => {
    setMeetingType(nextType);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('format', nextType);
    setSearchParams(nextParams, { replace: true });
  };

  // 🔍 Фильтрация врачей по формату и выбранным офисам
  const filteredDoctors = useMemo(() => {
    let availableDoctors = doctors;

    // Если выбрано "очно", исключаем психологов, которые принимают ТОЛЬКО онлайн
    if (meetingType === 'offline') {
      availableDoctors = availableDoctors.filter(
        (doctor) => doctor.office && doctor.office.toLowerCase() !== 'онлайн',
      );
    }

    // Фильтр по чекбоксам офисов (применяется только для очного формата)
    if (meetingType === 'offline' && selectedOffices.length > 0) {
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
    (doctor) => doctor.id === application.psychologist_id,
  );
  const currentTherapistIndex = Math.max(0, selectedIndex);
  const handleNextTherapist = () => {
    if (currentTherapistIndex < filteredDoctors.length - 1) {
      setApplication({
        psychologist_id: filteredDoctors[currentTherapistIndex + 1].id,
      });
    }
  };

  const handlePrevTherapist = () => {
    if (currentTherapistIndex > 0) {
      setApplication({
        psychologist_id: filteredDoctors[currentTherapistIndex - 1].id,
      });
    }
  };

  const currentTherapist = filteredDoctors[currentTherapistIndex];
  const isOnlineOnly = currentTherapist?.office?.toLowerCase() === 'онлайн';

  // 🎯 Уникальные офисы для чекбоксов (исключаем "Онлайн", так как это формат, а не офис)
  const uniqueOffices = useMemo(
    () =>
      Array.from(new Set(doctors.map((d) => d.office).filter(Boolean))).filter(
        (office) => office?.toLowerCase() !== 'онлайн',
      ),
    [doctors],
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
    if (!isConsultationTimeValid(selectedDate)) {
      message.error(
        `Выберите будущее время консультации. ${CONSULTATION_TIME_HINT}`,
      );
      return;
    }
    if (!application.university_status) {
      message.error('Укажите ваш статус в университете');
      return;
    }
    const description = application.problem_description?.trim();
    if (!description || description.length < 10 || description.length > 2000) {
      message.error('Опишите проблему: от 10 до 2000 символов');
      return;
    }

    setWindow('results');
  };

  const handleSubmit = async () => {
    if (
      isSubmitting ||
      !user ||
      !currentTherapist ||
      !selectedDate ||
      !application.university_status ||
      !application.problem_description
    )
      return;
    if (!isConsultationTimeValid(selectedDate)) {
      message.error(
        `Выберите будущее время консультации. ${CONSULTATION_TIME_HINT}`,
      );
      setWindow('form');
      return;
    }
    setIsSubmitting(true);

    const requestData: TApplicationCreateRequest = {
      psychologist_id: currentTherapist.id,
      scheduled_at: toApiDate(selectedDate),
      problem_description: application.problem_description.trim(),
      preferred_campus:
        meetingType === 'offline' ? currentTherapist.office : undefined,
      university_status: application.university_status,
    };

    try {
      await createApplication(requestData);
      void queryClient.invalidateQueries({
        queryKey: [applicationQueryKey.list],
      });
      message.success('Заявка успешно отправлена');
      useApplication.getState().resetApplication();
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('format');
      setSearchParams(nextParams, { replace: true });
      setWindow('form');
    } catch (error) {
      message.error(getErrorMessage(error, 'Не удалось отправить заявку'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (doctorsError || statusesError) {
    return (
      <Result
        status="error"
        title="Не удалось загрузить форму записи"
        subTitle={getErrorMessage(doctorsError || statusesError)}
      />
    );
  }

  return (
    <>
      {window === 'form' ? (
        <div className={styles.form}>
          <div className={styles.format}>
            <h3 className={styles.label}>Выберите формат консультации</h3>
            <div className={styles.format__btns}>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'online',
                })}
                onClick={() => handleMeetingTypeChange('online')}
              >
                Онлайн
              </button>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'offline',
                })}
                onClick={() => handleMeetingTypeChange('offline')}
              >
                Очно
              </button>
            </div>
          </div>

          {meetingType === 'offline' && uniqueOffices.length > 0 && (
            <div className={styles.location}>
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
              <div className={styles.galleryWrapper}>
                <div className={styles.mainInfo}>
                  <div className={styles.imgWrapper}>
                    <Img
                      key={currentTherapist.id || currentTherapist.photo}
                      className={styles.photo}
                      photo={`${import.meta.env.VITE_REACT_APP_IMAGE_URL}${currentTherapist.photo}`}
                      altPhoto={altPhoto}
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
                      {/* Если только онлайн, не дублируем слово "Онлайн" как адрес офиса */}
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
                {meetingType === 'offline'
                  ? 'По выбранным фильтрам специалисты не найдены'
                  : 'Нет доступных специалистов'}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Выберите дату и время</label>
            <DatePicker
              showTime={{
                format: 'HH:mm',
                defaultOpenValue: moscowDate().set({
                  hour: CONSULTATION_START_HOUR,
                  minute: 0,
                  second: 0,
                  millisecond: 0,
                }),
              }}
              format="DD.MM.YYYY HH:mm"
              className={styles.datePicker}
              placeholder="Выберите время приема"
              onChange={(value) =>
                setApplication({
                  scheduled_at: value
                    ? toApiDate(value.set({ second: 0, millisecond: 0 }))
                    : undefined,
                })
              }
              value={selectedDate}
              disabledDate={(current) =>
                current &&
                current.toFormat('yyyy-MM-dd') <
                  moscowDate().toFormat('yyyy-MM-dd')
              }
              disabledTime={disabledConsultationTime}
              hideDisabledOptions
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ваш статус в университете</label>
            <select
              value={application.university_status || 'студент'}
              onChange={(e) =>
                setApplication({
                  university_status: e.target.value as TUniversityStatus,
                })
              }
              className={styles.selectInput}
            >
              {universityStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Ваш запрос</label>
            <textarea
              maxLength={2000}
              value={application.problem_description}
              onChange={(e) =>
                setApplication({ problem_description: e.target.value })
              }
              className={styles.textarea}
              placeholder="Опишите вашу проблему"
            />
          </div>

          <div className={styles.privacy_block}>
            <p className={styles.privacy_text}>
              *Все данные пользователя надежно защищены и строго
              конфиденциальны. Доступны для просмотра исключительно психологу.
            </p>
            <a
              className={styles.privacy_link}
              href={privacyFile}
              target="_blank"
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
        <div className={styles.results}>
          <BackButton
            className={styles.backButton}
            lightColor="var(--labels-neutral-secondary)"
            darkColor="var(--labels-neutral-inverted-primary)"
            onClick={() => setWindow('form')}
          />
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
              {meetingType === 'online' ? 'Онлайн' : currentTherapist.office}
            </p>

            <p className={styles.results__text}>
              <span
                className={clsx(styles.results__text, styles.results__textGray)}
              >
                Статус в ВУЗе:{' '}
              </span>
              {application.university_status || 'студент'}
            </p>

            <p className={clsx(styles.results__text, styles.results__textGray)}>
              Тема встречи:
            </p>
            <textarea
              value={application.problem_description}
              readOnly
              className={clsx(styles.textarea, styles.results__textarea)}
            />

            <button
              className={styles.submitBtn}
              onClick={() => void handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Записаться'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AppointmentForm;
