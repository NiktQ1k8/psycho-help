import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResourceEntities } from '@/pages/resources-page/consts/entities.ts';
import { Articles } from '@/pages/resources-page/entities/articles';
import { Polls } from '@/pages/resources-page/entities/polls';
import { Tests } from '@/pages/resources-page/entities/tests';
import { type ITab, Tabs } from '@/shared/ui/tabs';
import styles from './ResourcesPage.module.scss';
import { TRANSLATES } from './consts/translates.ts';

const TABS = [
  {
    id: ResourceEntities.ARTICLES,
    content: <Articles />,
    label: TRANSLATES.articles,
  },
  {
    id: ResourceEntities.TESTS,
    content: <Tests />,
    label: TRANSLATES.tests,
  },
  {
    id: ResourceEntities.POLLS,
    content: <Polls />,
    label: TRANSLATES.polls,
  },
] as ITab[];

export const ResourcesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const features = TRANSLATES.features.join(' • ');
  useEffect(() => {
    const tabParam = searchParams.get('entity');
    if (
      searchParams.has('entity') &&
      (!tabParam || !Object.values(ResourceEntities).includes(tabParam))
    ) {
      searchParams.delete('entity');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleChangeTab = (tabId: string) => {
    setSearchParams({ entity: tabId });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <div className={styles.info}>
          <h2 className={styles.title}>{TRANSLATES.title}</h2>
          <p className={styles.features}>{features}</p>
        </div>
        <div className={styles.image}>
          <img alt={'resources-image'} src={TRANSLATES.imgSrc} />
        </div>
      </div>

      <div className={styles.content}>
        <Tabs
          contentClassName={styles.tabsContent}
          fullWidth
          tabs={TABS}
          onChange={handleChangeTab}
        />
      </div>
    </div>
  );
};
