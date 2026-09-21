import { type FC, useState } from 'react';
import type { Therapist } from '@/entities/therapist/types';
import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';
import { Img } from '@/shared/ui';
import styles from './InfoBlock.module.scss';

interface Props {
  therapist: Therapist;
}

const InfoBlock: FC<Props> = ({ therapist: therapist }) => {
  const [info, setInfo] = useState<
    'Образование' | 'О себе' | 'Подходы в работе'
  >('Образование');

  return (
    <div className={styles.wrapper}>
      <div className={styles.mainInfo}>
        <div className={styles.imgWrapper}>
          <Img
            className={styles.photo}
            photo={
              `${import.meta.env.VITE_REACT_APP_IMAGE_URL}` + therapist.photo
            }
            altPhoto={altPhoto}
          />
          <button className={[styles.regBtn, styles.regBtnTablet].join(' ')}>
            Записаться
          </button>
        </div>
        <div className={styles.info}>
          <div className={styles.infoBlock}>
            <p className={styles.name}>
              {[
                therapist.last_name,
                therapist.first_name,
                therapist.last_name,
              ].join(' ')}
            </p>
            <p className={styles.qual}>{therapist.qualification}</p>
            <p className={styles.exp}>Опыт: {therapist.experience}</p>
          </div>
          <div className={styles.line}></div>
          <div className={styles.infoBlock}>
            <p className={styles.qual}>Принимает лично и онлайн</p>{' '}
            {/*Потом будет браться из бд*/}
            <p className={styles.office}>{therapist.office}</p>
          </div>
          <div className={styles.line}></div>
          <p className={styles.qual}>С чем поможет:</p>
          <div className={styles.consultAreas}>
            {therapist.consult_areas.split(', ').map((item) => (
              <span key={item} className={styles.consultArea}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.btns}>
        <button
          className={
            info === 'Образование'
              ? [styles.infoBtnActive, styles.infoBtn].join(' ')
              : styles.infoBtn
          }
          onClick={() => setInfo('Образование')}
        >
          Образование
        </button>
        <button
          className={
            info === 'О себе'
              ? [styles.infoBtnActive, styles.infoBtn].join(' ')
              : styles.infoBtn
          }
          onClick={() => setInfo('О себе')}
        >
          О себе
        </button>
        <button
          className={
            info === 'Подходы в работе'
              ? [styles.infoBtnActive, styles.infoBtn].join(' ')
              : styles.infoBtn
          }
          onClick={() => setInfo('Подходы в работе')}
        >
          Подходы в работе
        </button>
      </div>

      <div className={styles.supInfo}>
        {info === 'О себе' && (
          <p className={styles.text}>{therapist.description}</p>
        )}
        {info === 'Образование' && (
          <p className={styles.text}>{therapist.education}</p>
        )}
        {info === 'Подходы в работе' && (
          <p className={styles.text}>{therapist.short_description}</p>
        )}
      </div>
    </div>
  );
};

export default InfoBlock;
