import { useState } from 'react';
import { PollCard } from '@/pages/resources-page/components/poll-card';
import { TRANSLATES } from '@/pages/resources-page/consts';
import { pollMocks } from '@/pages/resources-page/entities/polls/mocks.ts';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './Polls.module.scss';

const initialPolls = pollMocks.slice(0, 6);

export const Polls = () => {
  const [polls, setPolls] = useState(initialPolls);

  const handleShowMore = () => {
    setPolls(pollMocks);
  };
  const isShowMoreVisible = polls.length < pollMocks.length;

  return (
    <div className={styles.wrapper}>
      <div className={styles.passList}>
        {polls.map((item, index) => {
          return (
            <PollCard
              ellipseDescription
              title={item.title}
              info={{
                key: item.author,
                value: item.date,
              }}
              description={item.description}
              bottomSlot={
                <button className={styles.passBtn}>{TRANSLATES.pass}</button>
              }
              hasHorizontalDesktopVersion
              key={`polls-${index}`}
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
