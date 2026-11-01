import { mainReasons } from '../../model/mainContent';
import styles from './MainReasons.module.scss';

export const MainReasons = () => {
  return (
    <section className={styles.root}>
      <h2 className={styles.title}>Чем психолог может помочь?</h2>
      <ul className={styles.list} role="list">
        {mainReasons.map((reason) => (
          <li className={styles.card} key={reason.text}>
            <img className={styles.image} alt="" src={reason.image} />
            <p className={styles.text}>{reason.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};
