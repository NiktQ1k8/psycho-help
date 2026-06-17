import { Link } from 'react-router-dom';
import type { TTestPreview } from '@/entities/test/types';
import ModalWindow from '@/features/auth/modal/modal';
import { useAuthNavigation } from '@/features/auth/model/useAuthNavigation';
import cover from '@/shared/assets/images/resources/test-cover.png';
import { SLUG } from '@/shared/config/slug';
import { pluralizeRu } from '@/shared/lib/format';
import styles from './TestCard.module.scss';

type TProps = {
  test: TTestPreview;
};

export const TestCard = ({ test }: TProps) => {
  const { id } = test;
  const to = `${SLUG.TEST}/${id}`;
  const { handleClick, isLoginOpen, closeLogin } = useAuthNavigation(to);

  return (
    <>
      <Link
        className={styles.card}
        aria-label={test.title}
        to={to}
        onClick={handleClick}
      >
        <div className={styles.imageWrapper}>
          <img className={styles.image} alt="" src={test.image_url ?? cover} />
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>{test.title}</h2>
          {test.description && (
            <p className={styles.description}>{test.description}</p>
          )}
          <div className={styles.info}>
            <span className={styles.infoValue}>
              {test.questions_count}{' '}
              {pluralizeRu(test.questions_count, [
                'вопрос',
                'вопроса',
                'вопросов',
              ])}
            </span>
            {test.estimated_duration_minutes !== null && (
              <span className={styles.infoValue}>
                {test.estimated_duration_minutes}{' '}
                {pluralizeRu(test.estimated_duration_minutes, [
                  'минута',
                  'минуты',
                  'минут',
                ])}
              </span>
            )}
          </div>
        </div>
      </Link>
      <ModalWindow isOpen={isLoginOpen} onClose={closeLogin} />
    </>
  );
};
