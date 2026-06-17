import { surveyMocks } from '@/entities/survey/model/mock';
import { ResourceEntities } from '../../model/entities';
import { useResourcePagination } from '../../model/useResourcePagination';
import styles from './SurveysList.module.scss';
import { SurveyCard } from './components/SurveyCard/SurveyCard';

export const SurveysList = () => {
  const {
    items: surveys,
    hasMore,
    loadMoreRef,
  } = useResourcePagination(ResourceEntities.SURVEYS, surveyMocks);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.passList} aria-label="Опросы" role="list">
        {surveys.map((item) => (
          <li key={item.id}>
            <SurveyCard survey={item} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className={styles.loadMoreTrigger} aria-hidden ref={loadMoreRef} />
      )}
    </div>
  );
};
