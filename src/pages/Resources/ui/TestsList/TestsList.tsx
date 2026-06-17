import { testMocks } from '@/entities/test/model/mock';
import { ResourceEntities } from '../../model/entities';
import { useResourcePagination } from '../../model/useResourcePagination';
import styles from './TestsList.module.scss';
import { TestCard } from './components/TestCard/TestCard';

export const TestsList = () => {
  const {
    items: tests,
    hasMore,
    loadMoreRef,
  } = useResourcePagination(ResourceEntities.TESTS, testMocks);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.testList} aria-label="Тесты" role="list">
        {tests.map((item) => (
          <li key={item.id}>
            <TestCard test={item} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className={styles.loadMoreTrigger} aria-hidden ref={loadMoreRef} />
      )}
    </div>
  );
};
