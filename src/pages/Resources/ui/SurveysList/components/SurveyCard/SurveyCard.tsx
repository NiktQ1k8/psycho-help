import type { TSurveyPreview } from '@/entities/survey/types';
import ModalWindow from '@/features/auth/modal/modal';
import { useAuthNavigation } from '@/features/auth/model/useAuthNavigation';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { QuestionnaireMeta } from '@/shared/ui/questionnaire-meta/QuestionnaireMeta';
import styles from './SurveyCard.module.scss';

type TProps = {
  survey: TSurveyPreview;
};

export const SurveyCard = ({ survey }: TProps) => {
  const { id } = survey;
  const to = `${SLUG.SURVEY}/${id}`;
  const { handleClick, isLoginOpen, closeLogin } = useAuthNavigation(to);

  return (
    <>
      <article className={styles.root}>
        <img
          className={styles.image}
          alt=""
          loading="lazy"
          src={survey.image_url ?? cover}
          onError={({ currentTarget }) => {
            if (currentTarget.getAttribute('src') !== cover)
              currentTarget.src = cover;
          }}
        />
        <div className={styles.content}>
          <div className={styles.description}>
            <h2 className={styles.title}>{survey.title}</h2>
            {survey.description && (
              <p className={styles.text}>{survey.description}</p>
            )}
          </div>
          <QuestionnaireMeta
            estimated_duration_minutes={survey.estimated_duration_minutes}
            questions_count={survey.questions_count}
            textClassName={styles.infoText}
          />
        </div>
        <ButtonLink
          className={styles.button}
          aria-label={`Пройти опрос «${survey.title}»`}
          to={to}
          onClick={handleClick}
        >
          Пройти опрос
        </ButtonLink>
      </article>
      <ModalWindow isOpen={isLoginOpen} onClose={closeLogin} />
    </>
  );
};
