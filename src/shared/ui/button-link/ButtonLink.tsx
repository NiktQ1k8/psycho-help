import { Link } from 'react-router-dom';
import clsx from 'clsx';
import styles from './ButtonLink.module.scss';
import type { TButtonLinkProps } from './ButtonLink.types';

export type { TButtonLinkProps } from './ButtonLink.types';

const variantClasses = {
  brand_: {
    primary_: styles.buttonLink_brand__primary_,
    secondary: styles.buttonLink_brand__secondary,
  },
  neutral: {
    primary_: styles.buttonLink_neutral_primary_,
    secondary: styles.buttonLink_neutral_secondary,
  },
};

/**
 * Единое оформление для действий и переходов; нативные атрибуты передаются элементу.
 * Без `to`/`href` — <button> с type="button" по умолчанию; явный type имеет приоритет.
 * `to` — React Router Link (нужен Router), `href` — <a>. Их нельзя совмещать.
 * По умолчанию: variant="primary_", color="brand_", iconPosition="left_".
 *
 * @example
 * <ButtonLink type="submit">Сохранить</ButtonLink>
 * <ButtonLink to="/therapists">Специалисты</ButtonLink>
 * <ButtonLink href="/guide.pdf" download>Скачать</ButtonLink>
 */
export const ButtonLink = ({
  variant = 'primary_',
  color = 'brand_',
  children,
  icon,
  iconPosition = 'left_',
  className,
  ...props
}: TButtonLinkProps) => {
  const content = (
    <>
      {iconPosition === 'left_' && icon}
      {children}
      {iconPosition === 'right' && icon}
    </>
  );

  const classNames = clsx(
    styles.buttonLink,
    variantClasses[color][variant],
    className,
  );

  if (props.to !== undefined) {
    return (
      <Link {...props} className={classNames}>
        {content}
      </Link>
    );
  }

  if (props.href !== undefined) {
    return (
      <a {...props} className={classNames}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = props;

  return (
    <button {...buttonProps} type={type} className={classNames}>
      {content}
    </button>
  );
};
