import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionsData } from '@/pages/test-page/mocks';
import styles from './Test-page.module.scss';

export const TestPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const currentQuestion = questionsData[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questionsData.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleAnswer = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      navigate(`/resources?entity=tests`);
    }
  };

  const handleFinish = () => {
    console.log('Ответы:', answers);
    navigate(`/resources?entity=tests`);
  };

  if (!currentQuestion) {
    return <div>Тест не найден</div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.counter}>
          {currentQuestionIndex + 1} из {questionsData.length}
        </div>
      </div>

      <div className={styles.question}>
        <h2 className={styles.title}>{currentQuestion.title}</h2>

        <div className={styles.options}>
          {currentQuestion.options.map((option, index) => (
            <div
              key={index}
              className={`${styles.option} ${answers[currentQuestion.id] === option ? styles.selected : ''}`}
              onClick={() => handleAnswer(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.buttons}>
        <button
          className={`${styles.buttonAction} ${styles.buttonActionBack}`}
          onClick={handlePrev}
        >
          Назад
        </button>

        {isLastQuestion ? (
          <button
            className={`${styles.buttonAction} ${styles.buttonActionComplete}`}
            onClick={handleFinish}
            disabled={!answers[currentQuestion.id]}
          >
            Завершить
          </button>
        ) : (
          <button
            className={`${styles.buttonAction} ${styles.buttonActionNext}`}
            onClick={handleNext}
            disabled={!answers[currentQuestion.id]}
          >
            Далее
          </button>
        )}
      </div>
    </div>
  );
};
