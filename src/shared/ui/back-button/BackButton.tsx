import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import ChevronLeft from '@/shared/assets/images/news/chevron-left.svg?react';
import { SLUG } from '@/shared/config/slug';
import styles from './BackButton.module.scss';

type TBackButtonProps = {
  text?: string;
  lightColor?: CSSProperties['color'];
  darkColor?: CSSProperties['color'];
  className?: string;
  onClick?: () => void;
};

export const BackButton = ({
  text = 'Назад',
  lightColor = 'var(--labels-brand-primary)',
  darkColor = 'var(--labels-brand-primary)',
  className,
  onClick,
}: TBackButtonProps) => {
  const navigate = useNavigate();
  const style = {
    '--back-button-light-color': lightColor,
    '--back-button-dark-color': darkColor,
  } as CSSProperties;
  const goBack = () => {
    // React Router хранит номер перехода внутри сайта в idx.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(SLUG.MAIN, { replace: true });
  };

  return (
    <button
      type="button"
      className={clsx(styles.backButton, className)}
      style={style}
      onClick={onClick ?? goBack}
    >
      <ChevronLeft aria-hidden focusable="false" width={24} height={24} />
      {text}
    </button>
  );
};
