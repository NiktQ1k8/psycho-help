import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SLUG } from '@/shared/config/slug';
import {
  RESOURCES_ENTITY_STORAGE_KEY,
  ResourceEntities,
  type TResourceEntity,
} from '../../model/entities';
import { ArticlesList } from '../ArticlesList/ArticlesList';
import { ResourcesHero } from '../ResourcesHero/ResourcesHero';
import { type ITab, ResourcesTabs } from '../ResourcesTabs/ResourcesTabs';
import { SurveysList } from '../SurveysList/SurveysList';
import { TestsList } from '../TestsList/TestsList';
import styles from './Resources.module.scss';

const TABS: ITab[] = [
  {
    id: ResourceEntities.ARTICLES,
    to: SLUG.RESOURCES_ARTICLES,
    content: <ArticlesList />,
    label: 'Статьи',
  },
  {
    id: ResourceEntities.TESTS,
    to: SLUG.RESOURCES_TESTS,
    content: <TestsList />,
    label: 'Тесты',
  },
  {
    id: ResourceEntities.SURVEYS,
    to: SLUG.RESOURCES_SURVEYS,
    content: <SurveysList />,
    label: 'Опросы',
  },
];

const isValidEntity = (value: string | null): value is TResourceEntity =>
  !!value && (Object.values(ResourceEntities) as string[]).includes(value);

const getSavedEntity = (): TResourceEntity => {
  const savedEntity = sessionStorage.getItem(RESOURCES_ENTITY_STORAGE_KEY);
  return isValidEntity(savedEntity) ? savedEntity : ResourceEntities.ARTICLES;
};

export const Resources = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const entityParam = searchParams.get('entity');
  const activeTabId = isValidEntity(entityParam)
    ? entityParam
    : getSavedEntity();

  useEffect(() => {
    const entityParam = searchParams.get('entity');
    if (isValidEntity(entityParam)) {
      sessionStorage.setItem(RESOURCES_ENTITY_STORAGE_KEY, entityParam);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('entity', getSavedEntity());
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className={styles.wrapper}>
      <ResourcesHero />

      <ResourcesTabs activeTabId={activeTabId} tabs={TABS} />
    </div>
  );
};
