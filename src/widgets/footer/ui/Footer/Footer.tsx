import type { FC } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/shared/assets/images/logo.svg?react';
import { locations, socials } from '../../model/constants';
import styles from './Footer.module.scss';

export const Footer: FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <Link className={styles.logo} to="/">
            <Logo className={styles.logoSvg} width={120} height={36} />
          </Link>
          <div className={styles.contacts}>
            <div className={styles.contact}>
              <span className={styles.contactLabel}>Телефон:</span>
              <a className={styles.contactValue} href="tel:+74952230541">
                +7 (495) 223-05-41
              </a>
            </div>
            <div className={styles.contact}>
              <span className={styles.contactLabel}>E-mail:</span>
              <a
                className={styles.contactValue}
                href="mailto:psycholog@mospolytech.ru"
              >
                psycholog@mospolytech.ru
              </a>
            </div>
          </div>
          <div className={styles.socials}>
            {socials.map((social) => (
              <a
                className={styles.social}
                key={social.link}
                href={social.link}
                target="_blank"
              >
                <social.icon width={20} height={20} />
              </a>
            ))}
          </div>
        </div>
        <ul className={styles.locations}>
          {locations.map((location) => (
            <li className={styles.location} key={location.letters}>
              <span className={styles.address}>{location.address}</span>
              <span className={styles.auditorium}>{location.auditorium}</span>
              <span className={styles.letters} aria-hidden>
                {location.letters}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Служба психологической помощи (СПП)
          Московского Политеха.
        </p>
      </div>
    </footer>
  );
};
