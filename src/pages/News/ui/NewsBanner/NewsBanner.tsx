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
      <img className={styles.icon} src={vk} alt="" />
      <ButtonLink
        className={styles.link}
        href={EXTERNAL_LINKS.VK}
        target="_blank"
        rel="noopener noreferrer"
      >
        Подписаться
      </ButtonLink>
    </aside>
  );
};
