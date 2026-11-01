import Image1 from '../assets/main-reasons-1.svg';
import Image2 from '../assets/main-reasons-2.svg';
import Image3 from '../assets/main-reasons-3.svg';
import Image4 from '../assets/main-reasons-4.svg';
import Image5 from '../assets/main-reasons-5.svg';
import Image6 from '../assets/main-reasons-6.svg';
import type { TMAinReason, TMAinSchedule } from './mainTypes';

export const mainReasons: TMAinReason[] = [
  { text: '...в поиске себя', image: Image1 },
  { text: '...в поиске выхода\nиз депрессии', image: Image2 },
  { text: '...в преодолении\nперепадов настроения', image: Image3 },
  { text: '...в повышении\nконцентрации', image: Image4 },
  { text: '...в повышении\nсамооценки', image: Image5 },
  { text: '...в снижении\nуровня стресса', image: Image6 },
];
export const mainSchedule: TMAinSchedule[] = [
  { label: 'Понедельник - Четверг', time: '9:30 – 18:30' },
  { label: 'Пятница', time: '9:30 – 17:15' },
  { label: 'Обед', time: '13:00 – 13:45' },
];
