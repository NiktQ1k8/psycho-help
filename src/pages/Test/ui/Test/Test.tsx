import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuth } from '@/entities/auth/model/useAuth';
import { testQueries } from '@/entities/test/api/queries';
import { getTestImageSrc, testApi } from '@/entities/test/api/tests';
import type { TTestAnswer } from '@/entities/test/types';
import ModalWindow from '@/features/auth/modal/modal';
import { useResourceAttempts } from '@/features/resource-questionnaire/model/attempts';
import { ResourceUnavailable } from '@/features/resources/ui/ResourceUnavailable/ResourceUnavailable';
import { getRequestErrorMessage } from '@/shared/api/errors';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { Breadcrumbs } from '@/shared/ui/breadcrumbs/Breadcrumbs';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { QuestionnaireMeta } from '@/shared/ui/questionnaire-meta/QuestionnaireMeta';
import { TestQuestion } from '../TestQuestion/TestQuestion';
import { TestResult } from '../TestResult/TestResult';
import styles from './Test.module.scss';

interface ITestContentProps {
  testId: string;
  userId: string;
  isStudent: boolean;
}

type TAttemptAction =
  | { type: 'start' }
  | {
      type: 'answer';
      attemptId: string;
      questionId: string;
      answer: TTestAnswer;
    };

const getStatus = (error: unknown) =>
  isAxiosError(error) ? error.response?.status : undefined;

const isMissingResource = (error: unknown) => {
  const status = getStatus(error);
  return status === 404 || status === 422;
};

const getAttemptError = (
  error: unknown,
  action: TAttemptAction['type'] | undefined,
) => {
  const status = getStatus(error);
  if (status === 404)
    return action === 'start'
      ? 'Тест больше недоступен. Выберите другой тест в каталоге.'
      : 'Это прохождение больше недоступно.';
  if (status === 422 && action === 'answer')
    return 'Сервер не принял ответ. Проверьте его и отправьте снова.';
  if (status === 409) {
    return action === 'start'
      ? 'В этом тесте пока нет вопросов. Выберите другой тест.'
      : 'Прогресс теста изменился. Проверьте текущий вопрос перед отправкой ответа.';
  }
  const fallback =
    action === 'answer'
      ? 'Не удалось сохранить ответ. Проверьте его и повторите попытку.'
      : 'Не удалось начать тест. Повторите попытку или вернитесь к каталогу.';
  return getRequestErrorMessage(error, fallback);
};

const getExternalUrl = (value: string | null | undefined) => {
  if (!value) return undefined;
  try {
    const { protocol, href } = new URL(value);
    if (protocol === 'https:' || protocol === 'http:') return href;
  } catch {
    return undefined;
  }
};

const TestContent = ({ testId, userId, isStudent }: ITestContentProps) => {
  const queryClient = useQueryClient();
  const testQuery = useQuery(testQueries.byId(testId));
  const isMissing = isMissingResource(testQuery.error);
  const test = isMissing ? undefined : testQuery.data;
  const [isAttemptOpen, setAttemptOpen] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const attemptId = useResourceAttempts(
    (state) =>
      (isStudent && state.users[userId]?.testAttemptIds?.[testId]) || '',
  );
  const draft = useResourceAttempts(
    (state) => state.testDrafts[userId]?.[testId],
  );
  const { rememberTestAttempt, setTestDraft, clearTestDraft } =
    useResourceAttempts.getState();

  const attemptQuery = useQuery(testQueries.attempt(testId, userId, attemptId));
  const isAttemptMissing = isMissingResource(attemptQuery.error);
  const attempt = isAttemptMissing ? undefined : attemptQuery.data;
  const progressError =
    attemptQuery.isError && !isAttemptMissing
      ? getRequestErrorMessage(
          attemptQuery.error,
          'Не удалось загрузить прохождение.',
        )
      : undefined;
  const question = attempt?.next_question;
  const draftMatchesQuestion =
    draft &&
    draft.attemptId === attempt?.id &&
    draft.questionId === question?.id;
  const isArchived = isMissing && !!attempt;
  const isPassage = isAttemptOpen && !!question;
  const focusResult = isAttemptOpen && !!attempt?.completed_at;
  const hasDetails = !!test || isArchived;
  const title = test?.title ?? attempt?.test_title;
  usePageTitle(title ?? 'Тест');

  useEffect(() => {
    if (draft && attempt && !draftMatchesQuestion)
      clearTestDraft(userId, testId);
  }, [attempt, clearTestDraft, draft, draftMatchesQuestion, testId, userId]);

  useEffect(() => {
    if (focusResult) {
      headingRef.current?.focus();
    } else if (hasDetails && !isPassage) {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, [focusResult, hasDetails, isPassage]);

  const mutation = useMutation({
    scope: { id: `psy-test:${userId}:${testId}` },
    networkMode: 'always',
    mutationFn: (action: TAttemptAction) => {
      if (useAuth.getState().user?.id !== userId)
        throw new Error('Сессия изменилась');
      return action.type === 'start'
        ? testApi.startAttempt(testId)
        : testApi.saveAnswer(
            testId,
            action.attemptId,
            action.questionId,
            action.answer,
          );
    },
    onSuccess: async (progress) => {
      if (progress.user_id !== userId || useAuth.getState().user?.id !== userId)
        return;
      const { queryKey } = testQueries.attempt(testId, userId, progress.id);
      await queryClient.cancelQueries({ queryKey });
      if (useAuth.getState().user?.id !== userId) return;
      queryClient.setQueryData(queryKey, progress);
      rememberTestAttempt(userId, testId, progress.id);
      const currentDraft =
        useResourceAttempts.getState().testDrafts[userId]?.[testId];
      if (
        currentDraft &&
        (currentDraft.attemptId !== progress.id ||
          currentDraft.questionId !== progress.next_question?.id)
      ) {
        clearTestDraft(userId, testId);
      }
    },
    onError: async (error, action) => {
      if (useAuth.getState().user?.id !== userId) return;
      const status = getStatus(error);
      if (action.type === 'answer' && (status === 409 || status === 404)) {
        const progress = await attemptQuery.refetch();
        if (progress.isError) setAttemptOpen(false);
      } else if (action.type === 'start' && status === 404) {
        await testQuery.refetch();
      }
    },
  });

  const start = () => {
    mutation.reset();
    if (question) {
      setAttemptOpen(true);
      return;
    }
    mutation.mutate(
      { type: 'start' },
      { onSuccess: (progress) => setAttemptOpen(!!progress.next_question) },
    );
  };

  const save = (answer: TTestAnswer) => {
    if (!attempt || !question) return;
    mutation.mutate({
      type: 'answer',
      attemptId: attempt.id,
      questionId: question.id,
      answer,
    });
  };

  const failedAction = mutation.variables;
  const actionError =
    mutation.isError &&
    (failedAction?.type === 'start' ||
      !attempt ||
      (failedAction?.attemptId === attempt.id &&
        failedAction.questionId === question?.id))
      ? getAttemptError(mutation.error, failedAction?.type)
      : undefined;
  if (!testId || (isMissing && (!attemptId || isAttemptMissing))) {
    return (
      <ResourceUnavailable text="Тест не найден" to={SLUG.RESOURCES_TESTS} />
    );
  }

  if (!hasDetails) {
    const request = isMissing ? attemptQuery : testQuery;
    return (
      <div className={styles.root}>
        {request.isPending ? (
          <p role="status">Загружаем тест…</p>
        ) : (
          <>
            <h1 className={styles.title}>
              {isMissing
                ? 'Не удалось загрузить прохождение'
                : 'Не удалось загрузить тест'}
            </h1>
            <p role="alert">
              {getRequestErrorMessage(
                request.error,
                'Попробуйте загрузить ещё раз.',
              )}
            </p>
            <div className={styles.recovery}>
              <ButtonLink to={SLUG.RESOURCES_TESTS}>Все тесты</ButtonLink>
              <ButtonLink
                disabled={request.isFetching}
                variant="secondary"
                onClick={() => void request.refetch()}
              >
                Повторить загрузку
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    );
  }

  if (isPassage && attempt && question) {
    return (
      <TestQuestion
        draft={draftMatchesQuestion ? draft.answer : undefined}
        error={actionError}
        isSaving={mutation.isPending}
        key={question.id}
        question={question}
        onBack={() => setAttemptOpen(false)}
        onChange={(answer) =>
          setTestDraft(userId, testId, {
            attemptId: attempt.id,
            questionId: question.id,
            answer,
          })
        }
        onSave={save}
      />
    );
  }

  const externalUrl = getExternalUrl(test?.url);
  const isOpeningAttempt =
    mutation.isPending || (!!attemptId && attemptQuery.isPending);

  return (
    <article className={styles.root} aria-labelledby="test-title">
      <Breadcrumbs
        current={title ?? ''}
        items={[
          { label: 'Полезные материалы', to: SLUG.RESOURCES_ARTICLES },
          { label: 'Тесты', to: SLUG.RESOURCES_TESTS },
        ]}
      />
      <div className={styles.hero}>
        <div className={styles.intro}>
          <h1
            className={styles.title}
            id="test-title"
            ref={focusResult ? undefined : headingRef}
            tabIndex={-1}
          >
            {title}
          </h1>
          {test?.description && (
            <p className={styles.description}>{test.description}</p>
          )}
          {isArchived && <p>Тест убрали из каталога.</p>}
          <QuestionnaireMeta
            estimated_duration_minutes={test?.estimated_duration_minutes}
            questions_count={test?.questions_count}
            textClassName={styles.infoText}
          />
          <div className={styles.actions}>
            {test?.type === 'Развлекательный' ? (
              externalUrl ? (
                <ButtonLink className={styles.startButton} href={externalUrl}>
                  Пройти тест на другом сайте
                </ButtonLink>
              ) : (
                <p>Ссылка для прохождения пока недоступна.</p>
              )
            ) : !userId ? (
              <ButtonLink
                className={styles.startButton}
                onClick={() => setLoginOpen(true)}
              >
                Войти, чтобы пройти тест
              </ButtonLink>
            ) : !isStudent ? (
              <p>Прохождение теста доступно обучающимся.</p>
            ) : progressError ? (
              <>
                <p role="alert">{progressError}</p>
                <ButtonLink
                  disabled={attemptQuery.isFetching}
                  variant="secondary"
                  onClick={() => {
                    mutation.reset();
                    void attemptQuery.refetch();
                  }}
                >
                  Повторить загрузку
                </ButtonLink>
              </>
            ) : (
              (!isArchived || question) && (
                <ButtonLink
                  className={styles.startButton}
                  disabled={isOpeningAttempt}
                  onClick={start}
                >
                  {isOpeningAttempt
                    ? 'Загружаем прохождение…'
                    : question
                      ? 'Продолжить тест'
                      : attempt?.completed_at
                        ? 'Пройти тест ещё раз'
                        : 'Пройти тест'}
                </ButtonLink>
              )
            )}
            {!progressError && actionError && <p role="alert">{actionError}</p>}
          </div>
        </div>
        <img
          className={styles.cover}
          alt=""
          src={test?.image ? getTestImageSrc(test.image) : cover}
          onError={({ currentTarget }) => {
            if (currentTarget.getAttribute('src') !== cover)
              currentTarget.src = cover;
          }}
        />
      </div>
      {attempt?.completed_at && (
        <TestResult
          attempt={attempt}
          headingRef={focusResult ? headingRef : undefined}
        />
      )}
      <ModalWindow
        isOpen={isLoginOpen && !userId}
        onClose={() => setLoginOpen(false)}
      />
    </article>
  );
};

export const Test = () => {
  const { id = '' } = useParams();
  const user = useAuth((state) => state.user);
  const isStudent = user?.roles.some((role) => role.code === 'user') ?? false;

  return (
    <TestContent
      isStudent={isStudent}
      key={`${user?.id ?? ''}:${id}`}
      testId={id}
      userId={user?.id ?? ''}
    />
  );
};
