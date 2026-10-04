import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestCard } from '@/pages/resources-page/components';
import { testMocks } from '@/pages/resources-page/entities/tests/mocks.ts';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './Tests.module.scss';

const initialTests = testMocks.slice(0, 6);

export const Tests = () => {
  const [tests, setTests] = useState(initialTests);
  const navigate = useNavigate();

  const handleShowMore = () => {
    setTests(testMocks);
  };
  const isShowMoreVisible = tests.length < testMocks.length;

  const handleTestClick = (testId: string) => {
    navigate(`${SLUG.TEST}/${testId}`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.testList} data-testid="tests-list">
        {tests.map((item, index) => {
          return (
            <TestCard
              data-testid="test-card"
              ellipseDescription
              title={item.title}
              info={{
                key: item.countQuestion,
                value: item.time,
              }}
              description={item.description}
              hasHorizontalDesktopVersion
              onClick={() => handleTestClick(item.id)}
              key={`tests-${index}`}
            />
          );
        })}
      </div>
      {isShowMoreVisible && (
        <ButtonLink className={styles.showMore} onClick={handleShowMore}>
          Показать ещё
        </ButtonLink>
      )}
    </div>
  );
};
