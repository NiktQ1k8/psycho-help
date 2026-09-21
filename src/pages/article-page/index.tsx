import { Link, useNavigate } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Button } from '@/shared/ui';
import styles from './ArticlePage.module.scss';
import { TRANSLATES as t } from './constants';
import { mockArticlePageData } from './mocks';
import type { TArticleContentItem } from './models';

const parseContentData = (
  item: TArticleContentItem,
  index: number | string,
) => {
  const key = `article-content-${item.type}-${index}`;

  switch (item.type) {
    case 'p':
      return <p key={key}>{item.data}</p>;

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const Tag = item.type;
      return <Tag key={key}>{item.data}</Tag>;
    }

    case 'image':
      return (
        <div className={styles.imageWrapper} key={key}>
          <img src={item.src} alt={item.alt} />
        </div>
      );
    case 'ul':
      return (
        <ul key={key} className={styles.list}>
          {item.items.map((listItem, listIndex) => (
            <li key={`${key}-${listIndex}`}>{listItem}</li>
          ))}
        </ul>
      );
    case 'block':
      return (
        <div className={styles.block} key={key}>
          {item.data.map((blockItem, blockIndex) =>
            parseContentData(blockItem, `${key}-${blockIndex}`),
          )}
        </div>
      );

    default:
      return null;
  }
};

export const ArticlePage = () => {
  const data = mockArticlePageData;
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/resources');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        <Link to="/resources" className={styles.backButton}>
          <LeftOutlined />
          {t.materials}
        </Link>

        <div className={styles.info}>
          <p className={styles.date}>{dayjs(data.date).format('DD.MM.YYYY')}</p>
          <p className={styles.author}>{data.author}</p>
        </div>
      </div>
      <h1 className={styles.title}>{data.title}</h1>
      <div className={styles.content}>
        {data?.content?.map(parseContentData)}
      </div>

      <Button
        className={styles.bottomBtn}
        icon={<LeftOutlined />}
        variant="secondary"
        onClick={handleBack}
      >
        {t.other}
      </Button>
    </div>
  );
};
