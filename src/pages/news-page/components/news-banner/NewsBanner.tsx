import vk from '@/shared/assets/images/news/vk.svg';
import styles from './NewsBanner.module.scss';

export const NewsBanner = () => {
  return (
    <div className={styles.banner}>
      <div className={styles.info}>
        <h3 className={styles.title}>Новости в нашем VK</h3>
        <p className={styles.text}>Подпишитесь, чтобы узнавать актуальную информацию первыми</p>
      </div>
      <img src={vk} alt="VK" className={styles.icon} />
      <a
        className={styles.link}
        href="https://vk.com/spp_polytech"
        target="_blank"
        rel="noopener noreferrer external"
      >
        Подписаться
      </a>
    </div>
  );
};
