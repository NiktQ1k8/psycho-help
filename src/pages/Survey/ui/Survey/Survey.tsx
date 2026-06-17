import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { App } from 'antd';
import { useAuth } from '@/entities/auth/model/useAuth';
import {
  submitMockSurveyAttempt,
  surveyMocks,
} from '@/entities/survey/model/mock';
import type { TSurveyDetail } from '@/entities/survey/types';
import { AuthRequired } from '@/features/auth/ui/AuthRequired/AuthRequired';
import { useResourceAttempts } from '@/features/resource-questionnaire/model/attempts';
import { Questionnaire } from '@/features/resource-questionnaire/ui/Questionnaire/Questionnaire';
import { SLUG } from '@/shared/config/slug';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './Survey.module.scss';

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

  const finishSurvey = (answers: Record<string, string>) => {
    submitMockSurveyAttempt(survey, {
      answers: Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      })),
    });
    completeSurvey(userId, survey.id);
    navigate(SLUG.RESOURCES_SURVEYS);
    void message.success('Спасибо за участие! Ваши ответы сохранены.');
  };

  return (
    <div className={styles.wrapper}>
      <BackButton
        darkColor="var(--labels-brand-tetriary)"
        text="Все опросы"
        to={SLUG.RESOURCES_SURVEYS}
      />
      <Questionnaire
        allowCustomAnswer
        draft={draft}
        questions={survey.questions}
        onBack={() => navigate(SLUG.RESOURCES_SURVEYS)}
        onDraftChange={(next) => setDraft(userId, draftKey, next)}
        onFinish={finishSurvey}
      />
    </div>
  );
};

export const Survey = () => {
  const { id } = useParams();
  const userId = useAuth((state) => state.user?.id);
  const survey = surveyMocks.find((item) => item.id === id);

  return (
    <AuthRequired fallbackTo={SLUG.RESOURCES_SURVEYS}>
      {survey && userId ? (
        <SurveyContent
          key={`${userId}:${survey.id}`}
          survey={survey}
          userId={userId}
        />
      ) : (
        <div className={styles.wrapper}>
          <h1 className={styles.title}>Опрос не найден</h1>
          <p>
            Возможно, ссылка устарела. Выберите другой опрос в полезных
            материалах.
          </p>
          <ButtonLink to={SLUG.RESOURCES_SURVEYS}>Все опросы</ButtonLink>
        </div>
      )}
    </AuthRequired>
  );
};
