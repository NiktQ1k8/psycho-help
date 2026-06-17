export type TSurveyPreview = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  questions_count: number;
  estimated_duration_minutes: number | null;
  created_at: string;
};

export type TSurveyDetail = TSurveyPreview & {
  questions: TSurveyQuestion[];
  is_completed: boolean;
};

export type TSurveyQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
};

export type TSurveyAttempt = {
  answers: { question_id: string; answer: string }[];
};
