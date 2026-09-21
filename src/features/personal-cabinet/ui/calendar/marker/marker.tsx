import type { FC } from 'react';
import styles from './Marker.module.scss';

type Props = {
  text: string;
  type: string;
};

const types: Record<string, string> = {
  Accepted: '#FFCF52',
  Approved: '#33C175',
  selected: '#1890ff',
};

const Marker: FC<Props> = ({ text, type }) => {
  return (
    <div className={styles.marker}>
      <div
        className={styles.markerColor}
        style={{ backgroundColor: types[type] }}
      ></div>
      <div className={styles.markerText}>{text}</div>
    </div>
  );
};

export default Marker;
