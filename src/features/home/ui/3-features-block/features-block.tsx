import { useNavigate } from 'react-router-dom';
import FeatureDesktop_1 from '@/features/home/ui/3-features-block/img/1/features-desktop.png';
import FeatureMobile_1 from '@/features/home/ui/3-features-block/img/1/features-mobile.png';
import FeatureTablet_1 from '@/features/home/ui/3-features-block/img/1/features-tablet.png';
import FeatureDesktop_2 from '@/features/home/ui/3-features-block/img/2/features-desktop.png';
import FeatureMobile_2 from '@/features/home/ui/3-features-block/img/2/features-mobile.png';
import FeatureTablet_2 from '@/features/home/ui/3-features-block/img/2/features-tablet.png';
import { Button } from '@/shared/ui';
import styles from './features-block.module.scss';

const FeaturesBlock = () => {
  const navigate = useNavigate();

  const handleShowAllTherapists = () => {
    navigate('/therapists');
  };

  return (
    <div className={styles.features}>
      <div className={styles.features__grid}>
        <div className={styles.features__grid_1}>
          <picture className={styles.features__1_image_wrapper}>
            <source media="(max-width: 425px)" srcSet={FeatureMobile_1} />
            <source media="(max-width: 768px)" srcSet={FeatureTablet_1} />
            <img
              src={FeatureDesktop_1}
              alt=""
              className={styles.features__1_image}
            />
          </picture>
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
          <Button onClick={handleShowAllTherapists} color="neutral">
            Смотреть всех
          </Button>
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
            <picture className={styles.features__5_image_wrapper}>
              <source media="(max-width: 425px)" srcSet={FeatureMobile_2} />
              <source media="(max-width: 768px)" srcSet={FeatureTablet_2} />
              <img
                src={FeatureDesktop_2}
                alt=""
                className={styles.features__2_image}
              />
            </picture>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesBlock;
