import { EXTERNAL_LINKS } from '@/shared/config/externalLinks';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './NewsBanner.module.scss';
import vk from './assets/vk.svg';

export const NewsBanner = () => {
  return (
    <aside className={styles.banner}>
      <div className={styles.info}>
        <h2 className={styles.title}>Новости в нашем VK</h2>
        <p className={styles.text}>
          Подпишитесь, чтобы узнавать актуальную информацию первыми
        </p>
      </div>
      <img className={styles.icon} alt="" src={vk} />
      <ButtonLink
        className={styles.link}
        href={EXTERNAL_LINKS.VK}
        rel="noopener noreferrer"
        target="_blank"
      >
        Подписаться
      </ButtonLink>
      <span className={styles.blur1} aria-hidden />
      <span className={styles.blur2} aria-hidden />
      <span className={styles.blur3} aria-hidden />
    </aside>
  );
};
