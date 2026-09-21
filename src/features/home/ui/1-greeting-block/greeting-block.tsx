import { useState } from 'react';
import clsx from 'clsx';
import GreetingDesktop from '@/features/home/ui/1-greeting-block/img/greeting-desktop.png';
import GreetingMobile from '@/features/home/ui/1-greeting-block/img/greeting-mobile.png';
import GreetingTablet from '@/features/home/ui/1-greeting-block/img/greeting-tablet.png';
import Online from '@/features/home/ui/online.svg?react';
import Personally from '@/features/home/ui/personally.svg?react';
import styles from './GreetingBlock.module.scss';

const GreetingBlock = () => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleAppointment = () => {
    // TODO: Добавить обработку записи на прием
    console.log('Записаться на прием');
  };

  const handleSelect = (type: number) => {
    if (selectedOption === type) {
      setSelectedOption(null);
      return;
    }
    setSelectedOption(type);
  };

  return (
    <div className={styles.greeting}>
      <div className={styles.greeting__content}>
        <div className={styles.greeting__block}>
          <div className={styles.greeting__text}>
            <div className={styles.greeting__title_wrapper}>
              <span className={styles.greeting__title}>
                Помощь психолога для студентов и сотрудников
              </span>
            </div>
            <div className={styles.greeting__subtitle_wrapper}>
              <span className={styles.greeting__subtitle}>
                Иногда справляться с трудностями в одиночку бывает тяжело. Наши
                психологи помогут вам найти выход. Консультации бесплатны,
                конфиденциальны и доступны очно или онлайн.
              </span>
            </div>
          </div>
          <div className={styles.greeting__controls}>
            <div className={styles.greeting__options}>
              <button
                onClick={() => handleSelect(1)}
                className={clsx(styles.greeting__option, {
                  [styles.greeting__selected]: selectedOption === 1,
                })}
              >
                <Personally className={styles.greeting__option_icon} />
                <span className={styles.greeting__option_text}>лично</span>
              </button>
              <button
                onClick={() => handleSelect(2)}
                className={clsx(styles.greeting__option, {
                  [styles.greeting__selected]: selectedOption === 2,
                })}
              >
                <Online className={styles.greeting__option_icon} />
                <span className={styles.greeting__option_text}>онлайн</span>
              </button>
            </div>
            <button
              onClick={handleAppointment}
              className={styles.greeting__submit}
            >
              Записаться
            </button>
          </div>
        </div>
        <div className={styles.greeting__image_wrapper}>
          <picture>
            <source media="(max-width: 425px)" srcSet={GreetingMobile} />
            <source media="(max-width: 768px)" srcSet={GreetingTablet} />
            <img
              src={GreetingDesktop}
              alt="Иллюстрация на главной странице"
              className={styles.greeting__image}
            />
          </picture>
        </div>
      </div>
    </div>
  );
};

export default GreetingBlock;
