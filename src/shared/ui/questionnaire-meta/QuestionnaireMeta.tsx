import clsx from 'clsx';
import InfoIcon from '@/shared/assets/images/resources/info-icon.svg?react';
import WallClockIcon from '@/shared/assets/images/resources/wall-clock-icon.svg?react';
import { pluralizeRu } from '@/shared/lib/format';
import styles from './QuestionnaireMeta.module.scss';

interface IQuestionnaireMetaProps {
  questions_count?: number;
  estimated_duration_minutes?: number | null;
  textClassName: string;
}

export const QuestionnaireMeta = ({
  questions_count,
  estimated_duration_minutes,
  textClassName,
}: IQuestionnaireMetaProps) => {
  if (!questions_count && !estimated_duration_minutes) return null;

  return (
    <ul className={styles.list} aria-label="О материале" role="list">
      {!!questions_count && (
        <li className={styles.item}>
          <InfoIcon className={styles.icon} aria-hidden />
          <span className={clsx(styles.text, textClassName)}>
            {questions_count}{' '}
            {pluralizeRu(questions_count, ['вопрос', 'вопроса', 'вопросов'])}
          </span>
        </li>
      )}
      {!!estimated_duration_minutes && (
        <li className={styles.item}>
          <WallClockIcon className={styles.icon} aria-hidden />
          <span className={clsx(styles.text, textClassName)}>
            {estimated_duration_minutes}{' '}
            {pluralizeRu(estimated_duration_minutes, [
              'минута',
              'минуты',
              'минут',
            ])}
          </span>
        </li>
      )}
    </ul>
  );
};
