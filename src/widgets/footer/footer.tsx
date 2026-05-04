import VkIcon from '@/shared/assets/images/footer/vk.svg';
import TgIcon from '@/shared/assets/images/footer/tg.svg';
import styles from './footer.module.scss';
import FooterLogo from '@/shared/assets/images/footer/logo.svg?react';

const Footer = () => {
  const addresses = [
    {
      street: 'ул. Большая Семёновская, 38',
      auditorium: 'ауд. В-509',
      letters: 'БС',
    },
    {
      street: 'ул. Прянишникова, 2а',
      auditorium: 'ауд. 1401',
      letters: 'ПР',
    },
    {
      street: 'ул. Павла Корчагина, 22',
      auditorium: 'ауд. 239',
      letters: 'ПК',
    },
    {
      street: 'ул. Автозаводская, 16',
      auditorium: 'ауд. 1109',
      letters: 'АВ',
    },
  ];

  const socialLinks = [
    { icon: VkIcon, alt: 'VK', link: 'https://vk.com/spp_polytech' },
    { icon: TgIcon, alt: 'Telegram', link: 'https://t.me/spp_mospolytech' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* Верхняя секция с логотипом, контактами и соцсетями */}
        <div className={styles.topSection}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <FooterLogo />
            </div>
          </div>

          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>Телефон:</span>
              <a href="tel:+74952230541" className={styles.contactValue}>
                +7 (495) 223-05-41
              </a>
            </div>
            <div className={styles.contactItem}>
              <span className={styles.contactLabel}>E-mail:</span>
              <a href="mailto:psycholog@mospolytech.ru" className={styles.contactValue}>
                psycholog@mospolytech.ru
              </a>
            </div>
          </div>

          <div className={styles.socialSection}>
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.link}
                className={styles.socialLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src={social.icon} alt={social.alt} className={styles.socialIcon} />
              </a>
            ))}
          </div>
        </div>

        {/* Секция с адресами */}
        <div className={styles.addressesSection}>
          {addresses.map((address, index) => (
            <div key={index} className={styles.addressItem}>
              <div className={styles.addressBackgroundLetters}>{address.letters}</div>
              <div className={styles.adressItemContent}>
                <p className={styles.addressStreet}>{address.street}</p>
                <p className={styles.addressAuditorium}>{address.auditorium}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Копирайт */}
        <div className={styles.copyright}>
          <p>© 2025 Служба психологической помощи (СПП) Московского Политеха.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
