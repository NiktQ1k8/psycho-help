import { Fragment, type Ref } from 'react';
import type { TTestAttempt } from '@/entities/test/types';
import { moscowDate } from '@/shared/lib/date-time';
import styles from './TestResult.module.scss';

interface ITestResultProps {
  attempt: TTestAttempt;
  headingRef?: Ref<HTMLHeadingElement>;
}

export const TestResult = ({ attempt, headingRef }: ITestResultProps) => (
  <section className={styles.root} aria-labelledby="test-result-title">
    <h2
      className={styles.title}
      id="test-result-title"
      ref={headingRef}
      tabIndex={-1}
    >
      Тест завершён
    </h2>
    {attempt.completed_at && (
      <time className={styles.date} dateTime={attempt.completed_at}>
        {moscowDate(attempt.completed_at).toFormat('dd.MM.yyyy, HH:mm')} (МСК)
      </time>
    )}
    <details>
      <summary className={styles.summary}>Посмотреть свои ответы</summary>
      <dl className={styles.list}>
        {attempt.answers.map((saved) => (
          <Fragment key={saved.question.id}>
            <dt className={styles.dt}>{saved.question.text}</dt>
            <dd className={styles.dd}>
              {'answer' in saved ? (
                saved.answer
              ) : (
                <ul className={styles.ul}>
                  {saved.question.options
                    .filter(({ id }) => saved.option_ids.includes(id))
                    .map(({ id, text }) => (
                      <li key={id}>{text}</li>
                    ))}
                </ul>
              )}
            </dd>
          </Fragment>
        ))}
      </dl>
    </details>
  </section>
);
