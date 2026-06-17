import { Link, type LinkProps } from 'react-router-dom';
import { SLUG } from '@/shared/config/slug';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import styles from './Breadcrumbs.module.scss';

interface IBreadcrumbItem {
  label: string;
  to: LinkProps['to'];
}

interface IBreadcrumbsProps {
  className?: string;
  items?: readonly IBreadcrumbItem[];
  current: string;
}

export const Breadcrumbs = ({
  className,
  items = [],
  current,
}: IBreadcrumbsProps) => (
  <div className={className}>
    <nav className={styles.breadcrumbs} aria-label="Хлебные крошки">
      <ol className={styles.list} role="list">
        <li className={styles.item}>
          <Link className={styles.link} to={SLUG.MAIN}>
            Главная
          </Link>
        </li>
        {items.map(({ label, to }) => (
          <li className={styles.item} key={label}>
            <span aria-hidden="true"> / </span>
            <Link className={styles.link} to={to}>
              {label}
            </Link>
          </li>
        ))}
        <li className={styles.item} aria-current="page">
          <span aria-hidden="true"> / </span>
          {current}
        </li>
      </ol>
    </nav>
    <div className={styles.mobile}>
      <BackButton to={items.at(-1)?.to ?? SLUG.MAIN} />
    </div>
  </div>
);
