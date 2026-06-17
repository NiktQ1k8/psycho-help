import { moscowDate } from '@/shared/lib/date-time';
import type { TTestAttempt, TTestDetail, TTestResult } from '../types';

const questionTexts = [
  'Часто ли вы скрываете раздражение, чтобы избежать конфликта?',
  'Сложно ли вам рассказать близким о своих переживаниях?',
  'Предпочитаете ли вы отвлечься, когда становится грустно?',
  'Бывает ли, что вы соглашаетесь, хотя хотите отказать?',
  'Трудно ли вам признаться себе, что вы злитесь?',
  'Стараетесь ли вы выглядеть спокойным, когда тревожитесь?',
  'Бывает ли, что вы обесцениваете собственные чувства?',
  'Оставляете ли вы переживания на потом ради повседневных дел?',
  'Сложно ли вам попросить о поддержке?',
  'Считаете ли вы проявление чувств признаком слабости?',
];

const questionCounts = [10, 1, 2, 4, 6, 3, 7, 8, 5];

export const testMocks: TTestDetail[] = Array.from(
  { length: 23 },
  (_, index) => {
    const id = `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    const questions = questionTexts
      .slice(0, questionCounts[index] ?? questionTexts.length)
      .map((text, questionIndex) => ({
        id: `11000000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(questionIndex + 1).padStart(12, '0')}`,
        text,
        options: ['Да', 'Нет', 'Не знаю'].map((option, optionIndex) => ({
          id: `12000000-${String(index + 1).padStart(4, '0')}-4000-8000-${String(questionIndex * 10 + optionIndex + 1).padStart(12, '0')}`,
          text: option,
        })),
      }));

    return {
      id,
      title: 'Какие чувства вы подавляете?',
      type: 'Развлекательный',
      description:
        'Этот тест поможет задуматься о том, как вы выражаете свои эмоции. Выберите один ответ на каждый вопрос, который лучше всего описывает ваш привычный способ реагировать.',
      image_url: null,
      created_at: moscowDate('2026-11-01T12:00:00+03:00')
        .minus({ hours: index })
        .toISO()!,
      questions_count: questions.length,
      estimated_duration_minutes:
        index === 6 ? null : Math.max(1, Math.ceil(questions.length / 2)),
      questions,
      last_attempt: null,
    };
  },
);

const resultRanges = [
  {
    maxRatio: 1 / 3,
    text: '<h3>Вы открыто выражаете свои чувства</h3><p>Судя по ответам, вам обычно удаётся замечать свои переживания и говорить о них. Это помогает лучше понимать собственные потребности.</p><p>Продолжайте <strong>прислушиваться к себе</strong> и оставлять время на отдых.</p>',
    recommendations: [
      'Замечайте, что помогает вам восстанавливаться',
      'Делитесь переживаниями с людьми, которым доверяете',
    ],
  },
  {
    maxRatio: 2 / 3,
    text: '<h3>Иногда вы откладываете переживания</h3><p>В некоторых ситуациях вам проще отодвинуть свои чувства на второй план. Попробуйте замечать, когда это происходит.</p><p>Можно начать с простого вопроса: <em>«Что я сейчас чувствую?»</em></p>',
    recommendations: [
      'Выделяйте время, чтобы побыть наедине с собой',
      'Попробуйте записывать свои переживания',
    ],
  },
  {
    maxRatio: 1,
    text: '<h3>Вы часто держите чувства при себе</h3><p>По ответам видно, что вам бывает трудно выражать свои переживания. Подумайте, какая поддержка помогла бы вам говорить о них свободнее.</p><p>Не требуйте от себя всегда справляться в одиночку. При желании можно <a href="/therapists">обратиться к психологу</a>.</p>',
    recommendations: [
      'Давайте себе время на отдых',
      'Обсудите переживания с человеком, которому доверяете',
    ],
  },
];

export const getMockTestResult = (
  test: TTestDetail,
  { answers }: TTestAttempt,
): TTestResult => {
  const selected = new Map(
    answers.map(({ question_id, option_id }) => [question_id, option_id]),
  );
  if (
    answers.length !== test.questions.length ||
    selected.size !== test.questions.length ||
    test.questions.some(
      (question) =>
        !question.options.some(
          (option) => option.id === selected.get(question.id),
        ),
    )
  ) {
    throw new Error('Ответьте на каждый вопрос теста.');
  }

  // Временная имитация подсчёта на бэке: за первый вариант — один балл.
  const score = test.questions.filter(
    (question) => selected.get(question.id) === question.options[0].id,
  ).length;
  const range = resultRanges.find(
    ({ maxRatio }) => score / test.questions.length <= maxRatio,
  )!;

  return {
    id: crypto.randomUUID(),
    test_id: test.id,
    title: test.title,
    type: test.type,
    score,
    max_score: test.questions.length,
    result_text: range.text,
    recommendations: [...range.recommendations],
    completed_at: moscowDate().toISO()!,
  };
};
