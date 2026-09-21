import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ConfigProvider, DatePicker, message } from 'antd';
import locale from 'antd/es/locale/ru_RU';
import clsx from 'clsx';
import dayjs, { Dayjs } from 'dayjs';
import {
  createApplication,
  getUniversityStatuses,
} from '@/entities/application/api';
import type {
  ApplicationCreateRequest,
  UniversityStatus,
} from '@/entities/application/types';
import { therapistQueries } from '@/entities/therapist/api';
import { useAuth } from '@/features/auth/api/useAuth';
import { useApplication } from '@/features/personal-cabinet/model/application';
import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';
import arrow from '@/shared/assets/images/appointments/arrow.svg';
import backArrow from '@/shared/assets/images/appointments/backArrow.svg';
import { Img } from '@/shared/ui';
import Loader from '@/shared/ui/loader/loader';
import styles from './AppointmentForm.module.scss';

const AppointmentForm: FC = () => {
  const { data: doctors = [], isLoading } = useQuery(therapistQueries.list());
  const user = useAuth((s) => s.user);
  const application = useApplication((state) => state.application);
  const setApplication = useApplication((state) => state.setApplication);

  // 🎯 State для навигации по галерее и фильтров
  const [currentTherapistIndex, setCurrentTherapistIndex] = useState(0);
  const [selectedOffices, setSelectedOffices] = useState<Set<string>>(
    new Set(),
  );
  const [window, setWindow] = useState<'form' | 'results'>('form');
  const [meetingType, setMeetingType] = useState<'online' | 'offline' | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [universityStatuses, setUniversityStatuses] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (meetingType === 'offline' && selectedOffices.size > 0) {
      availableDoctors = availableDoctors.filter(
        (doctor) => doctor.office && selectedOffices.has(doctor.office),
      );
    }

    return availableDoctors;
  }, [doctors, selectedOffices, meetingType]);

  // 🔄 Сброс индекса галереи при изменении списка или формата встречи
  useEffect(() => {
    setCurrentTherapistIndex(0);
  }, [filteredDoctors.length, meetingType]);

  // 🔄 Сброс чекбоксов при переключении на Online
  useEffect(() => {
    if (meetingType === 'online') {
      setSelectedOffices(new Set());
    }
  }, [meetingType]);

  // 📚 Загрузка статусов
  useEffect(() => {
    const fetchUniversityStatuses = async () => {
      try {
        const statuses = await getUniversityStatuses();
        setUniversityStatuses(statuses);
      } catch {
        setUniversityStatuses([
          'студент',
          'аспирант',
          'преподаватель',
          'сотрудник',
        ]);
      }
    };
    fetchUniversityStatuses();
  }, []);

  // 🎯 Обработчик чекбокса офиса
  const handleOfficeToggle = (office: string) => {
    setSelectedOffices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(office)) {
        newSet.delete(office);
      } else {
        newSet.add(office);
      }
      return newSet;
    });
    setCurrentTherapistIndex(0);
  };

  // 🎯 Навигация по специалистам (вперед/назад)
  const handleNextTherapist = () => {
    if (currentTherapistIndex < filteredDoctors.length - 1) {
      setCurrentTherapistIndex((prev) => prev + 1);
    }
  };

  const handlePrevTherapist = () => {
    if (currentTherapistIndex > 0) {
      setCurrentTherapistIndex((prev) => prev - 1);
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
    if (!application.university_status) {
      message.error('Укажите ваш статус в университете');
      return;
    }
    const description = application.problem_description?.trim();
    if (!description || description.length < 10) {
      message.error('Опишите проблему (минимум 10 символов)');
      return;
    }

    setWindow('results');
  };

  const handleSubmit = async () => {
    if (!user || !currentTherapist || !selectedDate) return;
    setIsSubmitting(true);

    const requestData: ApplicationCreateRequest = {
      psychologist_id: currentTherapist.id!,
      scheduled_at: selectedDate.toISOString(),
      problem_description: application.problem_description!,
      preferred_campus:
        meetingType === 'offline' ? currentTherapist.office : undefined,
      university_status: application.university_status as UniversityStatus,
    };

    try {
      await createApplication(requestData);
      message.success('Заявка успешно отправлена');
      useApplication.getState().resetApplication();
      setSelectedDate(null);
      setMeetingType(null);
      setWindow('form');
    } catch {
      message.error('Не удалось отправить заявку');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfigProvider locale={locale}>
      {window === 'form' ? (
        <div className={styles.form}>
          {/* Формат встречи */}
          <div className={styles.format}>
            <h3 className={styles.label}>Выберите формат консультации</h3>
            <div className={styles.format__btns}>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'online',
                })}
                onClick={() => setMeetingType('online')}
              >
                Онлайн
              </button>
              <button
                type="button"
                className={clsx(styles.formatButton, {
                  [styles.active]: meetingType === 'offline',
                })}
                onClick={() => setMeetingType('offline')}
              >
                Очно
              </button>
            </div>
          </div>

          {/* Фильтр по офисам (только для Offline) */}
          {meetingType === 'offline' && uniqueOffices.length > 0 && (
            <div className={styles.location}>
              <p className={styles.label}>Выберите место консультации</p>
              <div className={styles.location__btns}>
                {uniqueOffices.map((office) => (
                  <div key={office} className={styles.location__element}>
                    <input
                      type="checkbox"
                      id={`office-${office}`}
                      checked={selectedOffices.has(office)}
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

          {/* Галерея специалистов */}
          <div className={styles.therapist}>
            <p className={styles.label}>Выберите специалиста</p>

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

                {/* Кнопки навигации */}
                {filteredDoctors.length > 1 && (
                  <>
                    {currentTherapistIndex > 0 && (
                      <button
                        type="button"
                        className={clsx(
                          styles.galleryBtn,
                          styles.galleryPrevBtn,
                        )}
                        onClick={handlePrevTherapist}
                        aria-label="Предыдущий специалист"
                      >
                        <img src={arrow} alt="prev" />
                      </button>
                    )}
                    {currentTherapistIndex < filteredDoctors.length - 1 && (
                      <button
                        type="button"
                        className={clsx(
                          styles.galleryBtn,
                          styles.galleryNextBtn,
                        )}
                        onClick={handleNextTherapist}
                        aria-label="Следующий специалист"
                      >
                        <img src={arrow} alt="next" />
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className={styles.empty}>
                {meetingType === 'offline'
                  ? 'По выбранным фильтрам специалисты не найдены'
                  : 'Список специалистов загружается...'}
              </p>
            )}
          </div>

          {/* Выбор времени (календарь) */}
          <div className={styles.field}>
            <label className={styles.label}>Выберите дату и время</label>
            <DatePicker
              showTime={{ format: 'HH:mm', minuteStep: 15 }}
              format="DD.MM.YYYY HH:mm"
              className={styles.datePicker}
              placeholder="Выберите время приема"
              onChange={(value) => setSelectedDate(value)}
              value={selectedDate}
              disabledDate={(current) =>
                current && current < dayjs().startOf('day')
              }
              hideDisabledOptions
            />
          </div>

          {/* Статус в университете (необходим для бэка) */}
          <div className={styles.field}>
            <label className={styles.label}>Ваш статус в университете</label>
            <select
              value={application.university_status || 'студент'}
              onChange={(e) =>
                setApplication({
                  university_status: e.target.value as UniversityStatus,
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

          {/* Запрос */}
          <div className={styles.field}>
            <label className={styles.label}>Ваш запрос</label>
            <textarea
              value={application.problem_description}
              onChange={(e) =>
                setApplication({ problem_description: e.target.value })
              }
              className={styles.textarea}
              placeholder="Опишите вашу проблему"
            />
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
          <button
            className={styles.backButton}
            type="button"
            onClick={() => setWindow('form')}
          >
            <div className={styles.backArrow}>
              <img src={backArrow} alt="backArrow" />
              <p className={styles.backArrow__text}>Назад</p>
            </div>
          </button>
          <div className={styles.results__info}>
            <h3 className={styles.results__title}>Запись</h3>

            <p className={styles.results__text}>
              <span
                className={clsx(styles.results__text, styles.results__textGray)}
              >
                Дата и время:{' '}
              </span>
              {selectedDate?.format('DD MMMM YYYY, HH:mm')}
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
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Отправка...' : 'Записаться'}
            </button>
          </div>
        </div>
      )}
    </ConfigProvider>
  );
};

export default AppointmentForm;
