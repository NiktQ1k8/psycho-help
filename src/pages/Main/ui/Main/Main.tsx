import { MainContacts } from '../MainContacts/MainContacts';
import { MainDetails } from '../MainDetails/MainDetails';
import { MainHero } from '../MainHero/MainHero';
import { MainReasons } from '../MainReasons/MainReasons';
import { MainSchedule } from '../MainSchedule/MainSchedule';
import styles from './Main.module.scss';

export const Main = () => {
  return (
    <div className={styles.wrapper}>
      <MainHero />
      <MainReasons />
      <MainDetails />
      <MainSchedule />
      <MainContacts />
    </div>
  );
};
