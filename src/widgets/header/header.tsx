import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/api/useAuth';
import ModalWindow from '@/features/auth/modal/modal';
import ThemeToggle from '@/shared/ui/theme-toggle/ThemeToggle';
import { navPages, CABINET_PATH } from '@/app/router/routes';
import { Link } from 'react-router-dom';
import Logo from '@/shared/assets/images/logo.svg?react';
import Profile from '@/shared/assets/images/header/profile.svg?react';
import Auth from '@/shared/assets/images/header/auth.svg?react';
import styles from './header.module.scss';

const Header = () => {
  const { isAuth } = useAuth();
  const headerRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const animatingTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    animatingTimerRef.current = setTimeout(() => setIsAnimating(false), 300);
  }, []);

  useEffect(() => () => clearTimeout(animatingTimerRef.current), []);

  const toggleMenu = useCallback(() => {
    if (menuOpen) {
      closeMenu();
    } else {
      setIsAnimating(true);
      setMenuOpen(true);
    }
  }, [menuOpen, closeMenu]);

  const handleAuthClick = () => {
    closeMenu();
    setModalOpen(true);
  };

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(() => {
      const { marginTop, marginBottom } = getComputedStyle(header);
      const totalHeight = header.offsetHeight + parseFloat(marginTop) + parseFloat(marginBottom);
      document.documentElement.style.setProperty('--header-height', `${totalHeight}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (menuOpen) {
      const initialOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = initialOverflow;
      };
    }
  }, [menuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1200 && menuOpen) {
        closeMenu();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen, closeMenu]);

  return (
    <header className={styles.header} ref={headerRef}>
      <nav className={styles.header__nav} aria-label="Основная навигация">
        <Link className={styles.header__logo} to="/" aria-label="Вернуться на главную страницу">
          <Logo aria-hidden="true" />
        </Link>
        <button
          className={`${styles.header__burger} ${menuOpen ? styles['header__burger--open'] : ''}`}
          onClick={toggleMenu}
          type="button"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="main-nav-menu"
          data-testid="burger-button"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
        <ul
          id="main-nav-menu"
          className={`${styles.header__list} ${isAnimating ? styles['header__list--animating'] : ''} ${menuOpen ? styles['header__list--open'] : ''}`}
          role="list"
        >
          {navPages.map((item, index) => (
            <li className={styles.header__item} key={index}>
              <Link className={styles.header__link} to={item.path} onClick={closeMenu}>
                {item.navText}
              </Link>
            </li>
          ))}
          <li className={styles.header__item}>
            <ThemeToggle className={styles.header__link} />
            {isAuth ? (
              <Link
                className={`${styles.header__link}`}
                to={CABINET_PATH}
                onClick={closeMenu}
                aria-label="Личный кабинет"
              >
                <Profile aria-hidden="true" />
              </Link>
            ) : (
              <button
                className={`${styles.header__link} ${styles['header__link--auth']}`}
                onClick={handleAuthClick}
                type="button"
                aria-label="Открыть окно входа"
                data-testid="auth-button"
              >
                <Auth aria-hidden="true" />
                <span>Войти</span>
              </button>
            )}
          </li>
        </ul>
      </nav>
      {!isAuth && <ModalWindow isOpen={isModalOpen} onClose={() => setModalOpen(false)} />}
    </header>
  );
};

export default Header;
