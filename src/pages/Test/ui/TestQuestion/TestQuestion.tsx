import { useEffect, useId, useRef, useState } from 'react';
import { getTestImageSrc } from '@/entities/test/api/tests';
import type { TTestAnswer, TTestQuestion } from '@/entities/test/types';
import questionnaire from '@/features/resource-questionnaire/ui/Questionnaire/Questionnaire.module.scss';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';

interface ITestQuestionProps {
  question: TTestQuestion;
  draft?: TTestAnswer;
  error?: string;
  isSaving: boolean;
  onBack: () => void;
  onChange: (answer: TTestAnswer) => void;
  onSave: (answer: TTestAnswer) => void;
}

export const TestQuestion = ({
  question,
  draft,
  error,
  isSaving,
  onBack,
  onChange,
  onSave,
}: ITestQuestionProps) => {
  const name = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const text = draft && 'answer' in draft ? draft.answer : '';
  const selected = draft && 'option_ids' in draft ? draft.option_ids : [];
  const canSave =
    question.type === 'text' ? !!text.trim() : selected.length > 0;

  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  return (
    <form
      className={questionnaire.root}
      aria-labelledby={`${name}-question`}
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave || isSaving) return;
        onSave(
          question.type === 'text'
            ? { answer: text }
            : { option_ids: selected },
        );
      }}
    >
      <span className={questionnaire.counter} id={`${name}-counter`}>
        Вопрос {question.position}
      </span>
      <fieldset
        className={questionnaire.fieldset}
        aria-describedby={
          question.type === 'multiple_choice' ? `${name}-hint` : undefined
        }
        disabled={isSaving}
      >
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
        {question.image &&
          (imageFailed ? (
            <p role="status">Не удалось загрузить изображение к вопросу.</p>
          ) : (
            <img
              className={questionnaire.image}
              alt="Иллюстрация к вопросу"
              src={getTestImageSrc(question.image)}
              onError={() => setImageFailed(true)}
            />
          ))}
        {question.type === 'text' ? (
          <label>
            <span className={questionnaire.customAnswer}>Ваш ответ</span>
            <textarea
              className={questionnaire.textarea}
              maxLength={10000}
              placeholder="Напишите свой ответ"
              required
              rows={4}
              value={text}
              onChange={(event) => onChange({ answer: event.target.value })}
            />
          </label>
        ) : (
          <div className={questionnaire.options}>
            {question.type === 'multiple_choice' && (
              <p className={questionnaire.hint} id={`${name}-hint`}>
                Выберите один или несколько вариантов
              </p>
            )}
            {question.options.map((option) => (
              <label className={questionnaire.option} key={option.id}>
                <input
                  className={questionnaire.input}
                  checked={selected.includes(option.id)}
                  name={name}
                  required={question.type === 'single_choice'}
                  type={
                    question.type === 'single_choice' ? 'radio' : 'checkbox'
                  }
                  value={option.id}
                  onChange={(event) => {
                    if (question.type === 'single_choice') {
                      onChange({ option_ids: [option.id] });
                      return;
                    }
                    const ids = event.target.checked
                      ? [...selected, option.id]
                      : selected.filter((id) => id !== option.id);
                    onChange({ option_ids: ids });
                  }}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
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
          aria-label="Назад к описанию теста"
          variant="secondary"
          onClick={onBack}
        >
          Назад
        </ButtonLink>
        <ButtonLink
          className={questionnaire.button}
          disabled={!canSave || isSaving}
          type="submit"
        >
          {isSaving ? 'Ждите…' : 'Далее'}
        </ButtonLink>
      </div>
    </form>
  );
};
