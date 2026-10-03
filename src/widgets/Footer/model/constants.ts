import { EXTERNAL_LINKS } from '@/shared/config/externalLinks';
// import Max from '../assets/max.svg?react';
import Tg from '../assets/tg.svg?react';
import Vk from '../assets/vk.svg?react';
import type { location, social } from './types';

export const socials: social[] = [
  // { icon: Max, link: EXTERNAL_LINKS.MAX },
  { icon: Vk, link: EXTERNAL_LINKS.VK },
  { icon: Tg, link: EXTERNAL_LINKS.TG },
];

export const locations: location[] = [
  {
    address: 'ул. Большая Семёновская, 38',
    auditorium: 'ауд. В-509',
    letters: 'БС',
  },
  {
    address: 'ул. Прянишникова, 2а',
    auditorium: 'ауд. 1401',
    letters: 'ПР',
  },
  {
    address: 'ул. Павла Корчагина, 22',
    auditorium: 'ауд. 239',
    letters: 'ПК',
  },
  {
    address: 'ул. Автозаводская, 16',
    auditorium: 'ауд. 1109',
    letters: 'АВ',
  },
];
