import { surveyMocks } from '@/entities/survey/model/mock';
import { ResourceEntities } from '../../model/entities';
import { useResourcePagination } from '../../model/useResourcePagination';
import styles from './SurveysList.module.scss';
import { SurveyCard } from './components/SurveyCard/SurveyCard';

export const SurveysList = () => {
  const { items: surveys, loadMoreRef } = useResourcePagination(
    ResourceEntities.SURVEYS,
    surveyMocks,
  );

  return (
    <ul className={styles.list} aria-label="Опросы" role="list">
      {surveys.map((item, index) => (
        <li
          className={styles.item}
          key={item.id}
          ref={index === surveys.length - 1 ? loadMoreRef : undefined}
        >
          <SurveyCard survey={item} />
        </li>
      ))}
    </ul>
  );
};
