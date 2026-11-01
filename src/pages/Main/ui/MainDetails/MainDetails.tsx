import clsx from 'clsx';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './MainDetails.module.scss';
import ImageNotebook from './assets/main-details-notebook.svg';
import ImagePsychologist from './assets/main-details-psychologist.svg';

export const MainDetails = () => {
  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Особенности работы </h2>
      <div className={styles.content}>
        <div className={clsx(styles.card, styles.card_1)}>
          <div className={styles.features__1_image_wrapper}>
            <img
              className={styles.features__1_image}
              alt=""
              src={ImagePsychologist}
            />
          </div>
          <div className={styles.features__1_content}>
            <span className={styles.features__1_title}>
              Компетентые психологи
            </span>
            <span className={styles.features__1_text}>
              Наши специалисты имеют высшее психологическое образование и
              практический опыт. Мы гарантируем бережную и профессиональную
              помощь.
            </span>
          </div>
          <ButtonLink color="neutral" to={SLUG.THERAPISTS}>
            Смотреть всех
          </ButtonLink>
        </div>
        <div className={styles.features__grid_2}>
          <span className={styles.features__2_title}>График работы</span>
          <span className={styles.features__2_text}>
            Служба доступна в течение всего года. Приём ведётся в будние дни,
            кроме официальных праздников.
          </span>
        </div>
        <div className={styles.features__grid_3}>
          <span className={styles.features__3_title}>Формат консультаций</span>
          <span className={styles.features__3_text}>
            Очные встречи в вузе или дистанционно: по телефону, через
            мессенджеры, Zoom, Skype или e-mail.
          </span>
        </div>
        <div className={styles.features__grid_4}>
          <div className={styles.features__4_content}>
            <div className={styles.features_4_block}>
              <span className={styles.features__4_title}>
                Перенос или пропуск консультации
              </span>
              <span className={styles.features__4_text}>
                Если встречу нужно перенести, просьба сообщить об этом заранее.
                Пропуск без предупреждения не допускается.
              </span>
            </div>
            <div className={styles.features__5_image_wrapper}>
              <img
                className={styles.features__2_image}
                alt=""
                src={ImageNotebook}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
