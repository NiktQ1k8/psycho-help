import { useState } from 'react';
import styles from './QuestionsList.module.scss';
import Question from './question';

const QuestionsList = ({
  questions,
}: {
  questions: Array<{ id: number; ask: string; answer: string }>;
}) => {
  const [openId, setOpenId] = useState<number | null>(null);

  function handleToggle(id: number) {
    setOpenId((prev) => (prev === id ? null : id));
  }
  return (
    <div className={styles.wrapper}>
      {questions.map((questionObj) => (
        <Question
          answer={questionObj.answer}
          ask={questionObj.ask}
          id={questionObj.id}
          isActive={openId === questionObj.id}
          key={questionObj.id}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};

export default QuestionsList;
