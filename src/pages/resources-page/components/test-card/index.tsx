import type { HTMLAttributes, MouseEvent, ReactNode } from 'react';
import clsx from 'clsx';
import styles from './TestCard.module.scss';

interface IProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  imageSrc?: string;
  bottomSlot?: ReactNode;
  info?: {
    key: string;
    value: string;
  };
  ellipseDescription?: boolean;
  className?: string;
  hasHorizontalDesktopVersion?: boolean;
  onClick?: (e: MouseEvent) => void;
}

export const TestCard = ({
  className,
  title,
  info,
  onClick,
  description,
  ellipseDescription,
  imageSrc,
  bottomSlot,
  hasHorizontalDesktopVersion,
  ...props
}: IProps) => {
  return (
    <div
      {...props}
      onClick={onClick}
      className={clsx(styles.wrapper, className, {
        [styles.desktop]: hasHorizontalDesktopVersion,
        [styles.clickable]: onClick,
      })}
    >
      <div className={styles.imageWrapper}>
        {!!imageSrc && <img src={imageSrc} alt={`image-${title}`} />}
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {!!description && (
          <p
            className={clsx(styles.description, {
              [styles.ellipse]: ellipseDescription,
            })}
          >
            {description}
          </p>
        )}
        {!!info && (
          <div className={styles.info}>
            <p>{info.key}</p>
            <p>{info.value}</p>
          </div>
        )}
        <div className={styles.bottomSlot}>{bottomSlot}</div>
      </div>
    </div>
  );
};
