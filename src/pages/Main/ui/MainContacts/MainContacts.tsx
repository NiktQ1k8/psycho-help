import styles from './MainContacts.module.scss';
import ContactsImage from './assets/calls-mobile.png';

export const MainContacts = () => {
  return (
    <div className={styles.calls}>
      <div className={styles.calls__text_wrapper}>
        <span className={styles.calls__text}>
          В выходные и праздничные дни, а также ночью за срочной психологической
          помощью можно обратиться по следующим телефонам:
        </span>
      </div>
      <div className={styles.calls__content}>
        <div className={styles.calls__image_wrapper}>
          <img className={styles.calls__image} alt="" src={ContactsImage} />
        </div>
        <div className={styles.calls__block}>
          <div className={styles.calls__item}>
            <span className={styles.calls__title}>
              Горячая линия Московской службы психологической помощи населению:
            </span>
            <div className={styles.calls__1_grid}>
              <a className={styles.calls__phone} href="tel:051">
                051
              </a>
              <a className={styles.calls__phone} href="tel:8 (495) 051">
                8 (495) 051
              </a>
              <span className={styles.calls__phone_text}>
                с городского телефона
              </span>
              <span className={styles.calls__phone_text}>
                с мобильного телефона
              </span>
            </div>
          </div>
          <div className={styles.calls__item}>
            <span className={styles.calls__title}>
              Горячей линии по психологической помощи студенческой молодежи:
            </span>
            <a className={styles.calls__phone} href="tel:8 (800) 222-55-71">
              8 (800) 222-55-71
            </a>
          </div>
          <div className={styles.calls__item}>
            <span className={styles.calls__title}>
              Телефон доверия для детей, подростков и их родителей:
            </span>
            <a className={styles.calls__phone} href="tel:8 (800) 200-01-22">
              8 (800) 200-01-22
            </a>
          </div>
          <div className={styles.calls__item}>
            <span className={styles.calls__title}>
              Горячая линия Центра экстренной психологической помощи МЧС России:
            </span>
            <a className={styles.calls__phone} href="tel:8 (495) 989-50-50">
              8 (495) 989-50-50
            </a>
            <span className={styles.calls__phone_text}>
              бесплатно по Москве
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
