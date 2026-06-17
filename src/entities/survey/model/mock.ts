import { moscowDate } from '@/shared/lib/date-time';
import type { TSurveyAttempt, TSurveyDetail } from '../types';

const questionTexts = [
  'Как часто вы чувствуете напряжение в течение дня?',
  'Трудно ли вам расслабиться после учёбы или работы?',
  'Бывает ли, что стресс мешает вам уснуть?',
  'Как часто вы откладываете дела из-за усталости?',
  'Как часто вы находите время на отдых и хобби?',
  'Как часто вы делитесь своими переживаниями с близкими?',
  'Что помогает вам справляться с напряжением?',
];

const questionCounts = [7, 1, 3, 5, 4, 6, 2];

export const surveyMocks: TSurveyDetail[] = Array.from(
  { length: 20 },
  (_, index) => {
    const id = `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const questions = questionTexts
      .slice(0, questionCounts[index] ?? questionTexts.length)
      .map((text, questionIndex) => ({
        id: `21000000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(questionIndex + 1).padStart(12, '0')}`,
        text,
        options:
          questionIndex === questionTexts.length - 1
            ? []
            : ['Никогда', 'Редко', 'Иногда', 'Часто', 'Почти всегда'].map(
                (option, optionIndex) => ({
                  id: `22000000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(questionIndex * 10 + optionIndex + 1).padStart(12, '0')}`,
                  text: option,
                }),
              ),
      }));

    return {
      id,
      title: 'Как вы справляетесь со стрессом?',
      description:
        'Поделитесь, как вы справляетесь с напряжением в повседневной жизни. Можно выбрать предложенный вариант или написать свой ответ. Ответы помогут лучше понять, какая поддержка нужна студентам.',
      image_url: null,
      created_at: moscowDate('2026-11-01T12:00:00+03:00')
        .minus({ hours: index })
        .toISO()!,
      questions_count: questions.length,
      estimated_duration_minutes:
        index === 4 ? null : Math.max(1, Math.ceil(questions.length / 2)),
      questions,
      is_completed: false,
    };
  },
);

export const submitMockSurveyAttempt = (
  survey: TSurveyDetail,
  { answers }: TSurveyAttempt,
) => {
  const submitted = new Map(
    answers.map(({ question_id, answer }) => [question_id, answer]),
  );
  if (
    answers.length !== survey.questions.length ||
    submitted.size !== survey.questions.length ||
    survey.questions.some((question) => {
      const answer = submitted.get(question.id);
      return !answer?.trim() || answer.length > 5000;
    })
  ) {
    throw new Error('Ответьте на каждый вопрос опроса.');
  }
  return { is_completed: true };
};
