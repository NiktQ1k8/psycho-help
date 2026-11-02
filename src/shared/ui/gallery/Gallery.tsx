import { type ReactElement, cloneElement, useRef, useState } from 'react';
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
      items={imageSources}
      preview={{
        imageRender: (image, { current }) =>
          cloneElement(image as ReactElement<{ alt: string }>, {
            alt: `${title} — изображение ${current + 1} из ${imageSources.length}`,
          }),
        open: previewIndex !== null,
        current: previewIndex ?? 0,
        onOpenChange: (open) => {
          if (!open) {
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
          aria-label={`Открыть изображение «${title}» во весь экран`}
          type="button"
          onClick={(event) => openPreview(0, event.currentTarget)}
        >
          <img
            className={styles.singleImage}
            alt={title}
            src={imageSources[0]}
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
        keyboard={{ enabled: true, pageUpDown: false }}
        modules={[A11y, Keyboard, Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        slidesPerView={1}
        spaceBetween={24}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
      >
        {imageSources.map((image, index) => (
          <SwiperSlide className={styles.slide} key={`${image}-${index}`}>
            {({ isActive }) => (
              <button
                className={styles.imageButton}
                aria-label={`Открыть изображение ${index + 1} из ${imageSources.length} во весь экран`}
                tabIndex={isActive ? 0 : -1}
                type="button"
                onClick={(event) => openPreview(index, event.currentTarget)}
              >
                <img
                  className={styles.slideImage}
                  alt={`${title} — изображение ${index + 1} из ${imageSources.length}`}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  src={image}
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
