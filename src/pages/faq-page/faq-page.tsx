import QuestionsList from '@/features/faq/ui/questions-list';
import FaqImage from '@/shared/assets/images/main/faq/questions_blue_t 1.png';
import styles from './FaqPage.module.scss';
import { TRANSLATES, faq } from './constants';

const FaqPage = () => {
  return (
    <>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.header}>
            <div className={styles.headline}>
              <h1 className={styles.faq}>{TRANSLATES.title}</h1>
              <p className={styles.description}>{TRANSLATES.description}</p>
            </div>
            <img
              src={FaqImage}
              alt={TRANSLATES.imgAlt}
              className={styles.image}
            />
          </div>
          <QuestionsList questions={faq} />
        </div>
      </div>
    </>
  );
};

export default FaqPage;
