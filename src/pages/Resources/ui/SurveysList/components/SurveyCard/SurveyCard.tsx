import type { TSurveyPreview } from '@/entities/survey/types';
import ModalWindow from '@/features/auth/modal/modal';
import { useAuthNavigation } from '@/features/auth/model/useAuthNavigation';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { pluralizeRu } from '@/shared/lib/format';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './SurveyCard.module.scss';
import ClockCircleOutlined from './assets/clock-circle-outlined.svg?react';
import InfoCircleOutlined from './assets/info-circle-outlined.svg?react';

type TProps = {
  survey: TSurveyPreview;
};

export const SurveyCard = ({ survey }: TProps) => {
  const { id } = survey;
  const to = `${SLUG.SURVEY}/${id}`;
  const { handleClick, isLoginOpen, closeLogin } = useAuthNavigation(to);

  return (
    <>
      <article className={styles.card}>
        <div className={styles.imageWrapper}>
          <img
            className={styles.image}
            alt=""
            src={survey.image_url ?? cover}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.text}>
            <h2 className={styles.title}>{survey.title}</h2>
            {survey.description && (
              <p className={styles.description}>{survey.description}</p>
            )}
          </div>
          <div className={styles.info}>
            <div className={styles.infoItem}>
              <InfoCircleOutlined
                className={styles.infoIcon}
                aria-hidden
                focusable="false"
              />
              <span className={styles.infoValue}>
                {survey.questions_count}{' '}
                {pluralizeRu(survey.questions_count, [
                  'вопрос',
                  'вопроса',
                  'вопросов',
                ])}
              </span>
            </div>
            {survey.estimated_duration_minutes !== null && (
              <div className={styles.infoItem}>
                <ClockCircleOutlined
                  className={styles.infoIcon}
                  aria-hidden
                  focusable="false"
                />
                <span className={styles.infoValue}>
                  {survey.estimated_duration_minutes}{' '}
                  {pluralizeRu(survey.estimated_duration_minutes, [
                    'минута',
                    'минуты',
                    'минут',
                  ])}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.bottomSlot}>
          <ButtonLink
            className={styles.button}
            aria-label={`Пройти опрос «${survey.title}»`}
            to={to}
            onClick={handleClick}
          >
            Пройти опрос
          </ButtonLink>
        </div>
      </article>
      <ModalWindow isOpen={isLoginOpen} onClose={closeLogin} />
    </>
  );
};
