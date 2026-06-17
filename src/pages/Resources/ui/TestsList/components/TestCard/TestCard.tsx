import { Link } from 'react-router-dom';
import { getTestImageSrc } from '@/entities/test/api/tests';
import type { TPsyTest } from '@/entities/test/types';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { pluralizeRu } from '@/shared/lib/format';
import styles from './TestCard.module.scss';

interface ITestCardProps {
  test: TPsyTest;
}

export const TestCard = ({ test }: ITestCardProps) => (
  <Link
    className={styles.root}
    aria-label={test.title}
    to={`${SLUG.TEST}/${test.id}`}
  >
    <img
      className={styles.image}
      alt=""
      loading="lazy"
      src={test.image ? getTestImageSrc(test.image) : cover}
      onError={({ currentTarget }) => {
        if (currentTarget.getAttribute('src') !== cover)
          currentTarget.src = cover;
      }}
    />
    <div className={styles.content}>
      <div className={styles.description}>
        <h2 className={styles.title}>{test.title}</h2>
        {test.description && <p className={styles.text}>{test.description}</p>}
      </div>
      {!!(test.questions_count || test.estimated_duration_minutes) && (
        <div className={styles.info}>
          {!!test.questions_count && (
            <span>
              {test.questions_count}{' '}
              {pluralizeRu(test.questions_count, [
                'вопрос',
                'вопроса',
                'вопросов',
              ])}
            </span>
          )}
          {!!test.estimated_duration_minutes && (
            <span>
              {test.estimated_duration_minutes}{' '}
              {pluralizeRu(test.estimated_duration_minutes, [
                'минута',
                'минуты',
                'минут',
              ])}
            </span>
          )}
        </div>
      )}
    </div>
  </Link>
);
