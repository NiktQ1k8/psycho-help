import { useState } from 'react';
import ComputerIcon from '@/shared/assets/images/doctors/computer.svg?react';
import doctorImg from '@/shared/assets/images/doctors/titleImg.svg';
import UserIcon from '@/shared/assets/images/doctors/user.svg?react';
import styles from './Title.module.scss';

const Title = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'online'>('personal');
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Психологи</h1>
          <p className={styles.text}>
            На этой странице с психологами вы найдёте широкий выбор
            специалистов, которые помогут вам справиться с различными жизненными
            ситуациями.
          </p>
          <div className={styles.containerTabButton}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'personal' ? styles.active : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <UserIcon className={styles.icon} />
                лично
              </button>

              <button
                className={`${styles.tab} ${activeTab === 'online' ? styles.active : ''}`}
                onClick={() => setActiveTab('online')}
              >
                <ComputerIcon className={styles.icon} />
                онлайн
              </button>
            </div>

            <button className={styles.button}>
              <span className={styles.buttonTextFull}>Записаться на приём</span>
              <span className={styles.buttonTextShort}>Записаться</span>
            </button>
          </div>
        </div>
        <img
          src={doctorImg}
          alt="Изображение диалога с психологом"
          className={styles.titleImg}
        />
      </div>
    </div>
  );
};

export default Title;
