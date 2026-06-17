export type TPsyTestType = 'Медицинский' | 'Развлекательный';

export type TPsyTest = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  type: TPsyTestType;
  url: string | null;
  created_at: string;
  questions_count?: number;
  estimated_duration_minutes?: number | null;
};

export type TTestQuestionType = 'text' | 'single_choice' | 'multiple_choice';

export type TTestQuestion = {
  id: string;
  position: number;
  text: string;
  image: string | null;
  type: TTestQuestionType;
  options: { id: string; text: string }[];
};

export type TTestAnswer = { answer: string } | { option_ids: string[] };

export type TTestSavedAnswer = TTestAnswer & {
  question: TTestQuestion;
  answered_at: string;
};

export type TTestAttempt = {
  id: string;
  test_id: string;
  user_id: string;
  test_title: string;
  started_at: string;
  completed_at: string | null;
  answers: TTestSavedAnswer[];
  next_question: TTestQuestion | null;
};

export type TTestQuestionInput =
  | { type?: 'text'; text: string }
  | {
      type: Exclude<TTestQuestionType, 'text'>;
      text: string;
      options: { text: string }[];
    };

export type TTestCreate = Pick<TPsyTest, 'title' | 'description'> & {
  image?: string | null;
} & (
    | { type: 'Медицинский'; questions: TTestQuestionInput[] }
    | { type: 'Развлекательный'; url: string }
  );

export type TTestUpdate = Partial<
  Pick<TPsyTest, 'title' | 'description' | 'image' | 'url'>
>;
