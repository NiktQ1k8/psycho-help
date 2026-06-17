import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import type { TQuestionnaireDraft } from '../../model/attempts';
import styles from './Questionnaire.module.scss';

interface IQuestionnaireProps {
  questions: {
    id: string;
    text: string;
    options: { id: string; text: string }[];
  }[];
  draft?: TQuestionnaireDraft;
  allowCustomAnswer?: boolean;
  onDraftChange: (draft: TQuestionnaireDraft) => void;
  onFinish: (answers: Record<string, string>) => void;
  onBack: () => void;
}

const emptyDraft: TQuestionnaireDraft = { questionIndex: 0, answers: {} };

export const Questionnaire = ({
  questions,
  draft = emptyDraft,
  allowCustomAnswer = false,
  onDraftChange,
  onFinish,
  onBack,
}: IQuestionnaireProps) => {
  const name = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState('');
  const questionIndex = Math.max(
    0,
    Math.min(draft.questionIndex, questions.length - 1),
  );
  const question = questions[questionIndex];
  const answer = draft.answers[question.id];
  const getAnswerValue = (item: (typeof questions)[number]) => {
    const savedAnswer = draft.answers[item.id];
    const option = item.options.find(
      (itemOption) => itemOption.id === savedAnswer?.optionId,
    );
    if (savedAnswer?.optionId) {
      return option ? (allowCustomAnswer ? option.text : option.id) : undefined;
    }
    return allowCustomAnswer ? savedAnswer?.text : undefined;
  };
  const isCustom =
    allowCustomAnswer &&
    (question.options.length === 0 ||
      (answer !== undefined && !answer.optionId));
  const isLastQuestion = questionIndex === questions.length - 1;
  const canContinue = !!getAnswerValue(question)?.trim();

  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  const changeAnswer = (patch: { optionId?: string; text?: string }) => {
    setError('');
    onDraftChange({
      ...draft,
      answers: { ...draft.answers, [question.id]: { ...answer, ...patch } },
    });
  };

  const goToQuestion = (index: number) => {
    setError('');
    onDraftChange({ ...draft, questionIndex: index });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canContinue) return;
    if (!isLastQuestion) {
      goToQuestion(questionIndex + 1);
      return;
    }
    const unansweredIndex = questions.findIndex(
      (item) => !getAnswerValue(item)?.trim(),
    );
    if (unansweredIndex !== -1) {
      goToQuestion(unansweredIndex);
      setError('Ответьте на этот вопрос, чтобы завершить прохождение.');
      return;
    }

    setError('');
    try {
      onFinish(
        Object.fromEntries(
          questions.map((item) => [item.id, getAnswerValue(item)!.trim()]),
        ),
      );
    } catch {
      setError('Не удалось сохранить ответы. Попробуйте ещё раз.');
    }
  };

  return (
    <form
      className={styles.wrapper}
      aria-labelledby={`${name}-question`}
      onSubmit={handleSubmit}
    >
      <p className={styles.counter} aria-atomic="true" aria-live="polite">
        {questionIndex + 1} из {questions.length}
      </p>
      <progress
        className={styles.progress}
        aria-label="Ход прохождения"
        max={questions.length}
        value={questionIndex + 1}
      />
      <fieldset className={styles.question}>
        <legend className={styles.legend}>
          <h1
            className={styles.title}
            id={`${name}-question`}
            ref={headingRef}
            tabIndex={-1}
          >
            {question.text}
          </h1>
        </legend>
        <div className={styles.options}>
          {question.options.map((option) => (
            <label className={styles.option} key={option.id}>
              <input
                checked={!isCustom && answer?.optionId === option.id}
                name={name}
                required
                type="radio"
                value={option.id}
                onChange={() => changeAnswer({ optionId: option.id })}
              />
              <span>{option.text}</span>
            </label>
          ))}
          {allowCustomAnswer && question.options.length > 0 && (
            <label className={styles.option}>
              <input
                checked={isCustom}
                name={name}
                required
                type="radio"
                value="other"
                onChange={() => changeAnswer({ optionId: undefined })}
              />
              <span>Другое</span>
            </label>
          )}
        </div>
        {isCustom && (
          <label className={styles.customAnswer}>
            Ваш ответ
            <textarea
              key={question.id}
              maxLength={5000}
              placeholder="Напишите, что вы думаете"
              required
              rows={4}
              value={answer?.text ?? ''}
              onChange={(event) =>
                changeAnswer({ optionId: undefined, text: event.target.value })
              }
            />
          </label>
        )}
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.buttons}>
        <ButtonLink
          variant="secondary"
          onClick={() =>
            questionIndex === 0 ? onBack() : goToQuestion(questionIndex - 1)
          }
        >
          Назад
        </ButtonLink>
        <ButtonLink disabled={!canContinue} type="submit">
          {isLastQuestion ? 'Завершить' : 'Далее'}
        </ButtonLink>
      </div>
    </form>
  );
};
