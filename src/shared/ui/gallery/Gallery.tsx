import { useRef, useState } from 'react';
import { Image } from 'antd';
import type { Swiper as TSwiperInstance } from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import styles from './Gallery.module.scss';
import './Gallery.swiper.scss';

interface IGalleryProps {
  images?: string[] | null;
  title: string;
}

export const Gallery = ({ images, title }: IGalleryProps) => {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const swiperRef = useRef<TSwiperInstance | null>(null);
  const imageSources = images?.filter(Boolean) ?? [];

  const openPreview = (index: number, trigger: HTMLButtonElement) => {
    trigger.focus({ preventScroll: true });
    swiperRef.current?.keyboard.disable();
    setPreviewIndex(index);
  };

  if (imageSources.length === 0) {
    return null;
  }

  const preview = (
    <Image.PreviewGroup
      items={imageSources.map((image, index) => ({
        src: image,
        alt: `${title} — изображение ${index + 1} из ${imageSources.length}`,
      }))}
      preview={{
        visible: previewIndex !== null,
        current: previewIndex ?? 0,
        onVisibleChange: (visible) => {
          if (!visible) {
            setPreviewIndex(null);
            swiperRef.current?.keyboard.enable();
          }
        },
        onChange: (index) => {
          setPreviewIndex(index);
        },
      }}
    />
  );

  if (imageSources.length === 1) {
    return (
      <div className={styles.gallery}>
        <button
          className={`${styles.imageButton} ${styles.singleImageButton}`}
          type="button"
          aria-label={`Открыть изображение «${title}» во весь экран`}
          onClick={(event) => openPreview(0, event.currentTarget)}
        >
          <img
            className={styles.singleImage}
            src={imageSources[0]}
            alt={title}
          />
        </button>
        {preview}
      </div>
    );
  }

  return (
    <div className={styles.gallery} data-image-gallery>
      <Swiper
        className={styles.slider}
        modules={[A11y, Keyboard, Navigation, Pagination]}
        slidesPerView={1}
        spaceBetween={24}
        navigation
        pagination={{ clickable: true }}
        keyboard={{ enabled: true, pageUpDown: false }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        a11y={{
          containerRole: 'region',
          containerMessage: `Изображения: ${title}`,
          prevSlideMessage: 'Предыдущее изображение',
          nextSlideMessage: 'Следующее изображение',
          firstSlideMessage: 'Это первое изображение',
          lastSlideMessage: 'Это последнее изображение',
          paginationBulletMessage: 'Перейти к изображению {{index}}',
          slideLabelMessage: 'Изображение {{index}} из {{slidesLength}}',
        }}
      >
        {imageSources.map((image, index) => (
          <SwiperSlide className={styles.slide} key={`${image}-${index}`}>
            {({ isActive }) => (
              <button
                className={styles.imageButton}
                type="button"
                tabIndex={isActive ? 0 : -1}
                aria-label={`Открыть изображение ${index + 1} из ${imageSources.length} во весь экран`}
                onClick={(event) => openPreview(index, event.currentTarget)}
              >
                <img
                  className={styles.slideImage}
                  src={image}
                  alt={`${title} — изображение ${index + 1} из ${imageSources.length}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </button>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
      {preview}
    </div>
  );
};
