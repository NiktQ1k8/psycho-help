import type { CSSProperties } from 'react';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { SLUG } from '@/shared/config/slug';
import styles from './BackButton.module.scss';
import ChevronLeft from './assets/chevron-left.svg?react';

type TBackButtonProps = {
  text?: string;
  lightColor?: CSSProperties['color'];
  darkColor?: CSSProperties['color'];
  className?: string;
  onClick?: () => void;
  to?: LinkProps['to'];
};

export const BackButton = ({
  text = 'Назад',
  lightColor = 'var(--labels-brand-primary)',
  darkColor = 'var(--labels-brand-primary)',
  className,
  onClick,
  to,
}: TBackButtonProps) => {
  const navigate = useNavigate();
  const style = {
    '--back-button-light-color': lightColor,
    '--back-button-dark-color': darkColor,
  } as CSSProperties;
  const goBack = () => {
    // React Router хранит номер перехода внутри сайта в idx.
    const historyState = window.history.state as { idx?: number } | null;
    if ((historyState?.idx ?? 0) > 0) navigate(-1);
    else navigate(SLUG.MAIN, { replace: true });
  };

  const content = (
    <>
      <ChevronLeft aria-hidden focusable="false" height={24} width={24} />
      {text}
    </>
  );
  const classNames = clsx(styles.backButton, className);

  if (to !== undefined) {
    return (
      <Link className={classNames} style={style} to={to} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={classNames}
      style={style}
      type="button"
      onClick={onClick ?? goBack}
    >
      {content}
    </button>
  );
};
