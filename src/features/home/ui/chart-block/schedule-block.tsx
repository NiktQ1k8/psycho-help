import ScheduleDesktop from '@/features/home/ui/chart-block/img/schedule-desktop.png';
import ScheduleMobile from '@/features/home/ui/chart-block/img/schedule-mobile.png';
import ScheduleTablet from '@/features/home/ui/chart-block/img/schedule-tablet.png';
import styles from './ScheduleBlock.module.scss';

const ScheduleBlock = () => {
  return (
    <section className={styles.section}>
      <div className={styles.scheduleSection}>
        <div className={styles.scheduleInfo}>
          <div className={styles.lunchInfo}>
            <span className={styles.lunchLabel}>Понедельник - Четверг</span>
            <span className={styles.lunchTime}>9:00 – 18:30</span>
          </div>
          <div className={styles.lunchInfo}>
            <span className={styles.lunchLabel}>Пятница</span>
            <span className={styles.lunchTime}>9:30 – 17:15</span>
          </div>
          <div className={styles.fridayInfo}>
            <span className={styles.fridayLabel}>Обед</span>
            <span className={styles.fridayTime}>13:00 – 13:45</span>
          </div>
        </div>
        <div className={styles.scheduleIllustration}>
          <picture className={styles.scheduleImageWrapper}>
            <source media="(max-width: 425px)" srcSet={ScheduleMobile} />
            <source media="(max-width: 768px)" srcSet={ScheduleTablet} />
            <img
              src={ScheduleDesktop}
              alt=""
              className={styles.scheduleImage}
            />
          </picture>
          {/* <span className={styles.illustrationPlaceholder}>Иллюстрация предметов</span> */}
        </div>
      </div>
    </section>
  );
};

export default ScheduleBlock;
