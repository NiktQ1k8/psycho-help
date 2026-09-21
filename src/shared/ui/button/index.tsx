import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './Button.module.scss';

export interface IButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'medium';
  iconPosition?: 'left' | 'right';
  icon?: ReactNode;
  color?: 'neutral' | 'brand';
}

export const Button = ({
  variant = 'primary',
  size = 'medium',
  children,
  color = 'brand',
  className,
  iconPosition = 'left',
  icon,
  ...props
}: IButtonProps) => {
  const { disabled } = props || {};
  const content = icon ? (
    <>
      {iconPosition === 'left' && <div className={styles.icon}>{icon}</div>}
      {children}
      {iconPosition === 'right' && <div className={styles.icon}>{icon}</div>}
    </>
  ) : (
    children
  );
  return (
    <button
      {...props}
      className={clsx(
        styles.button,
        styles[variant],
        className,
        styles[size],
        styles[`color-${color}`],
        {
          [styles.disabled]: disabled,
          [styles.hasIcon]: !!icon,
        },
      )}
    >
      {content}
    </button>
  );
};
