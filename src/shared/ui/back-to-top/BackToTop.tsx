import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './BackToTop.module.scss';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const lastScroll = useRef<number>(
    typeof window !== 'undefined' ? window.scrollY : 0,
  );

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;
      const isScrollingUp = current < lastScroll.current;
      const pastThreshold = current > 300;
      setVisible(isScrollingUp && pastThreshold);
      lastScroll.current = current;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    lastScroll.current = window.scrollY;
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Наверх"
      title="Наверх"
      className={clsx(styles.button, { [styles.visible]: visible })}
      onClick={handleClick}
    >
      <span className={styles.icon} aria-hidden>
        ↑
      </span>
    </button>
  );
};

export default BackToTop;
