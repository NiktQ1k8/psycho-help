import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { TSurveyQuestion } from '@/entities/survey/types';
import type { TQuestionnaireDraft } from '@/features/resource-questionnaire/model/attempts';
import questionnaire from '@/features/resource-questionnaire/ui/Questionnaire/Questionnaire.module.scss';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';

interface ISurveyQuestionProps {
  questions: TSurveyQuestion[];
  draft?: TQuestionnaireDraft;
  onDraftChange: (draft: TQuestionnaireDraft) => void;
  onFinish: () => void;
  onBack: () => void;
}

const MAX_ANSWER_LENGTH = 5000;
const emptyDraft: TQuestionnaireDraft = { questionIndex: 0, answers: {} };

export const SurveyQuestion = ({
  questions,
  draft = emptyDraft,
  onDraftChange,
  onFinish,
  onBack,
}: ISurveyQuestionProps) => {
  const name = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [error, setError] = useState('');
  const questionIndex = Math.max(
    0,
    Math.min(draft.questionIndex, questions.length - 1),
  );
  const question = questions[questionIndex];
  const answer = draft.answers[question.id];
  const getAnswerValue = (item: TSurveyQuestion) => {
    const savedAnswer = draft.answers[item.id];
    const value = savedAnswer?.optionId
      ? item.options.find(({ id }) => id === savedAnswer.optionId)?.text
      : savedAnswer?.text;
    return value?.trim() ?? '';
  };
  const isCustom =
    question.options.length === 0 || (answer !== undefined && !answer.optionId);
  const isLastQuestion = questionIndex === questions.length - 1;
  const canContinue = !!getAnswerValue(question);

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
    const invalidIndex = questions.findIndex((item) => {
      const value = getAnswerValue(item);
      return !value || value.length > MAX_ANSWER_LENGTH;
    });
    if (invalidIndex !== -1) {
      goToQuestion(invalidIndex);
      setError(
        getAnswerValue(questions[invalidIndex])
          ? `Сократите ответ до ${MAX_ANSWER_LENGTH} символов.`
          : 'Ответьте на этот вопрос, чтобы завершить опрос.',
      );
      return;
    }
    onFinish();
  };

  return (
    <form
      className={questionnaire.root}
      aria-labelledby={`${name}-question`}
      onSubmit={handleSubmit}
    >
      <span className={questionnaire.counter} id={`${name}-counter`}>
        {questionIndex + 1} из {questions.length}
      </span>
      <fieldset className={questionnaire.fieldset}>
        <legend>
          <h1
            className={questionnaire.title}
            aria-describedby={`${name}-counter`}
            id={`${name}-question`}
            ref={headingRef}
            tabIndex={-1}
          >
            {question.text}
          </h1>
        </legend>
        <div className={questionnaire.options}>
          {question.options.map((option) => (
            <label className={questionnaire.option} key={option.id}>
              <input
                className={questionnaire.input}
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
          {question.options.length > 0 && (
            <label className={questionnaire.option}>
              <input
                className={questionnaire.input}
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
          <label>
            <span className={questionnaire.customAnswer}>Ваш ответ</span>
            <textarea
              className={questionnaire.textarea}
              key={question.id}
              maxLength={MAX_ANSWER_LENGTH}
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
        <p className={questionnaire.error} role="alert">
          {error}
        </p>
      )}
      <div className={questionnaire.buttons}>
        <ButtonLink
          className={questionnaire.button}
          aria-label={
            questionIndex === 0
              ? 'Назад к опросам'
              : 'Назад к предыдущему вопросу'
          }
          variant="secondary"
          onClick={() =>
            questionIndex === 0 ? onBack() : goToQuestion(questionIndex - 1)
          }
        >
          Назад
        </ButtonLink>
        <ButtonLink
          className={questionnaire.button}
          disabled={!canContinue}
          type="submit"
        >
          {isLastQuestion ? 'Завершить' : 'Далее'}
        </ButtonLink>
      </div>
    </form>
  );
};
