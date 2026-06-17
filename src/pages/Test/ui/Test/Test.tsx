import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/entities/auth/model/useAuth';
import { getMockTestResult, testMocks } from '@/entities/test/model/mock';
import type { TTestDetail } from '@/entities/test/types';
import { AuthRequired } from '@/features/auth/ui/AuthRequired/AuthRequired';
import { useResourceAttempts } from '@/features/resource-questionnaire/model/attempts';
import { Questionnaire } from '@/features/resource-questionnaire/ui/Questionnaire/Questionnaire';
import { QuestionnaireMeta } from '@/features/resource-questionnaire/ui/QuestionnaireMeta/QuestionnaireMeta';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { TestResult } from '../TestResult/TestResult';
import styles from './Test.module.scss';

interface ITestContentProps {
  test: TTestDetail;
  userId: string;
}

const TestContent = ({ test, userId }: ITestContentProps) => {
  const [isTaking, setTaking] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const draftKey = `test:${test.id}`;
  const draft = useResourceAttempts(
    (state) => state.users[userId]?.drafts[draftKey],
  );
  const result = useResourceAttempts(
    (state) => state.users[userId]?.tests[test.id] ?? test.last_attempt,
  );
  const { setDraft, clearDraft, saveTestResult } =
    useResourceAttempts.getState();

  useEffect(() => {
    if (!isTaking) {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [isTaking]);

  const finishTest = (answers: Record<string, string>) => {
    const nextResult = getMockTestResult(test, {
      answers: Object.entries(answers).map(([question_id, option_id]) => ({
        question_id,
        option_id,
      })),
    });
    saveTestResult(userId, nextResult);
    setTaking(false);
  };

  if (isTaking) {
    return (
      <div className={styles.passage}>
        <BackButton
          darkColor="var(--labels-brand-tetriary)"
          text="К описанию теста"
          onClick={() => setTaking(false)}
        />
        <Questionnaire
          draft={draft}
          questions={test.questions}
          onBack={() => setTaking(false)}
          onDraftChange={(next) => setDraft(userId, draftKey, next)}
          onFinish={finishTest}
        />
      </div>
    );
  }

  return (
    <article className={styles.wrapper}>
      <BackButton
        darkColor="var(--labels-brand-tetriary)"
        text="Все тесты"
        to={SLUG.RESOURCES_TESTS}
      />
      <div className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.category}>{test.type} тест</p>
          <h1 className={styles.title} ref={headingRef} tabIndex={-1}>
            {test.title}
          </h1>
          {test.description && (
            <p className={styles.description}>{test.description}</p>
          )}
          <QuestionnaireMeta
            estimated_duration_minutes={test.estimated_duration_minutes}
            questions_count={test.questions_count}
          />
          <div className={styles.actions}>
            <ButtonLink
              className={styles.startButton}
              onClick={() => setTaking(true)}
            >
              {draft
                ? 'Продолжить тест'
                : result
                  ? 'Пройти тест ещё раз'
                  : 'Пройти тест'}
            </ButtonLink>
            {draft && (
              <>
                <p className={styles.draftNote}>
                  У вас есть незавершённое прохождение. Ответы сохранены.
                </p>
                <ButtonLink
                  variant="secondary"
                  onClick={() => clearDraft(userId, draftKey)}
                >
                  Сбросить ответы
                </ButtonLink>
              </>
            )}
          </div>
        </div>
        <img className={styles.cover} alt="" src={test.image_url ?? cover} />
      </div>
      {result && <TestResult result={result} />}
    </article>
  );
};

export const Test = () => {
  const { id } = useParams();
  const userId = useAuth((state) => state.user?.id);
  const test = testMocks.find((item) => item.id === id);

  return (
    <AuthRequired fallbackTo={SLUG.RESOURCES_TESTS}>
      {test && userId ? (
        <TestContent key={`${userId}:${test.id}`} test={test} userId={userId} />
      ) : (
        <div className={styles.wrapper}>
          <h1 className={styles.title}>Тест не найден</h1>
          <p>
            Возможно, ссылка устарела. Выберите другой тест в полезных
            материалах.
          </p>
          <ButtonLink to={SLUG.RESOURCES_TESTS}>Все тесты</ButtonLink>
        </div>
      )}
    </AuthRequired>
  );
};
