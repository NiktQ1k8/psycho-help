import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App } from 'antd';
import { useAuth } from '@/entities/auth/model/useAuth';
import { surveyMocks } from '@/entities/survey/model/mock';
import type { TSurveyDetail } from '@/entities/survey/types';
import { AuthRequired } from '@/features/auth/ui/AuthRequired/AuthRequired';
import { useResourceAttempts } from '@/features/resource-questionnaire/model/attempts';
import { ResourceUnavailable } from '@/features/resources/ui/ResourceUnavailable/ResourceUnavailable';
import { SLUG } from '@/shared/config/slug';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { SurveyQuestion } from '../SurveyQuestion/SurveyQuestion';

interface ISurveyContentProps {
  survey: TSurveyDetail;
  userId: string;
}

const SurveyContent = ({ survey, userId }: ISurveyContentProps) => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const notifyOnOpen = useRef(
    useResourceAttempts.getState().users[userId]?.surveys[survey.id] ??
      survey.is_completed,
  );
  const draftKey = `survey:${survey.id}`;
  const draft = useResourceAttempts(
    (state) => state.users[userId]?.drafts[draftKey],
  );
  const { setDraft, completeSurvey } = useResourceAttempts.getState();

  useEffect(() => {
    if (notifyOnOpen.current) {
      notifyOnOpen.current = false;
      void message.info(
        'Вы уже проходили этот опрос. При желании можно пройти его снова.',
        6,
      );
    }
  }, [message]);

  const finishSurvey = () => {
    completeSurvey(userId, survey.id);
    navigate(SLUG.RESOURCES_SURVEYS);
    void message.success('Спасибо за участие! Опрос завершён.');
  };

  return (
    <SurveyQuestion
      draft={draft}
      questions={survey.questions}
      onBack={() => navigate(SLUG.RESOURCES_SURVEYS)}
      onDraftChange={(next) => setDraft(userId, draftKey, next)}
      onFinish={finishSurvey}
    />
  );
};

export const Survey = () => {
  const { id } = useParams();
  const userId = useAuth((state) => state.user?.id);
  const survey = surveyMocks.find((item) => item.id === id);
  usePageTitle(survey?.title ?? 'Опрос');

  if (!survey?.questions.length) {
    return (
      <ResourceUnavailable
        text={survey ? 'В опросе пока нет вопросов' : 'Опрос не найден'}
        to={SLUG.RESOURCES_SURVEYS}
      />
    );
  }

  return (
    <AuthRequired fallbackTo={SLUG.RESOURCES_SURVEYS}>
      {userId && (
        <SurveyContent
          key={`${userId}:${survey.id}`}
          survey={survey}
          userId={userId}
        />
      )}
    </AuthRequired>
  );
};
