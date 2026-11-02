import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AutoComplete, Empty, Input, Pagination } from 'antd';
import { appointmentQueries } from '@/entities/appointment/api';
import { getUserFullName } from '@/entities/auth/model/user-name';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import { getRequestErrorMessage } from '@/shared/api/errors';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import Loader from '@/shared/ui/loader/loader';
import { normalizeSearch } from '@/shared/utils/normalizeSearch';
import './MedicalRecords.antd.scss';
import styles from './MedicalRecords.module.scss';

const ITEMS_PER_PAGE = 10;

export const MedicalRecords = () => {
  const { medicalRecordFilters, setMedicalRecordSearch, setMedicalRecordPage } =
    usePsychologistView();
  const { searchQuery, currentPage } = medicalRecordFilters;
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
  } = useQuery(appointmentQueries.list());

  const patients = useMemo(() => {
    const uniquePatients = new Map(
      appointments.map(({ patient }) => [patient.id, patient]),
    );
    const search = normalizeSearch(searchQuery);
    return [...uniquePatients.values()]
      .filter((patient) =>
        normalizeSearch(
          `${getUserFullName(patient)} ${patient.study_group || ''}`,
        ).includes(search),
      )
      .sort((a, b) =>
        getUserFullName(a).localeCompare(getUserFullName(b), 'ru'),
      );
  }, [appointments, searchQuery]);

  const searchSuggestions = useMemo(() => {
    const search = normalizeSearch(searchQuery);
    if (!search) return [];

    const values = new Set(
      patients.flatMap((patient) => [
        getUserFullName(patient),
        patient.study_group || '',
      ]),
    );
    return [...values]
      .filter((value) => normalizeSearch(value).includes(search))
      .map((value) => ({ value }));
  }, [patients, searchQuery]);

  const page = Math.min(
    currentPage,
    Math.max(1, Math.ceil(patients.length / ITEMS_PER_PAGE)),
  );

  return (
    <section className={styles.wrapper}>
      <h1>Карты консультируемых</h1>
      <AutoComplete
        options={searchSuggestions}
        value={searchQuery}
        onChange={setMedicalRecordSearch}
      >
        <Input
          allowClear
          aria-label="Поиск по ФИО или группе"
          placeholder="Поиск по ФИО или группе"
        />
      </AutoComplete>
      {isLoading ? (
        <Loader />
      ) : isError ? (
        <Alert
          description={getRequestErrorMessage(error)}
          showIcon
          title="Не удалось загрузить карты консультируемых"
          type="error"
        />
      ) : (
        <>
          <div role="list">
            {!patients.length && <Empty description="Студенты не найдены" />}
            {patients
              .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
              .map((patient) => (
                <article
                  className={styles.row}
                  key={patient.id}
                  role="listitem"
                >
                  <div className={styles.patient}>
                    <span className={styles.patient_name}>
                      {getUserFullName(patient)}
                    </span>
                    {patient.study_group && (
                      <span className={styles.study_group}>
                        {patient.study_group}
                      </span>
                    )}
                  </div>
                  <ButtonLink
                    className={styles.btnPrimary}
                    to={`${SLUG.CABINET_MEDICAL_RECORD}/${patient.id}`}
                  >
                    Открыть
                  </ButtonLink>
                </article>
              ))}
          </div>
          {patients.length > ITEMS_PER_PAGE && (
            <div className={styles.pagination} data-medical-record-pagination>
              <Pagination
                current={page}
                pageSize={ITEMS_PER_PAGE}
                showSizeChanger={false}
                total={patients.length}
                onChange={setMedicalRecordPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
};
