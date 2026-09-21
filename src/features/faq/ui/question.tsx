import clsx from 'clsx';
import ButtonIcon from '@/shared/assets/images/main/question/button.svg?react';
import styles from './Question.module.scss';

const Question = ({
  id,
  ask,
  answer,
  onToggle,
  isActive,
}: {
  id: number;
  ask: string;
  answer: string;
  onToggle: (param: number) => void;
  isActive: boolean;
}) => {
  return (
    <div
      className={clsx(styles.wrapper, { [styles.active]: isActive })}
      onClick={() => onToggle(id)}
    >
      <div className={styles.ask}>
        <p className={styles.p}>{ask}</p>
        <ButtonIcon className={styles.button} />
      </div>
      <p className={styles.answer}>{answer}</p>
    </div>
  );
};

export default Question;
