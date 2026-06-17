export type TTestPreview = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  type: 'Медицинский' | 'Развлекательный';
  questions_count: number;
  estimated_duration_minutes: number | null;
  created_at: string;
};

export type TTestDetail = TTestPreview & {
  questions: TTestQuestion[];
  last_attempt: TTestResult | null;
};

export type TTestQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

export type TTestAttempt = {
  answers: { question_id: string; option_id: string }[];
};

export type TTestResult = {
  id: string;
  test_id: string;
  title: string;
  type: TTestPreview['type'];
  score: number;
  max_score: number;
  result_text: string;
  recommendations: string[];
  completed_at: string;
};
