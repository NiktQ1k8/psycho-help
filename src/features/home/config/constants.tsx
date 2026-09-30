import DegreeImage from '@/shared/assets/images/main/features/DegreeImage.svg';
import FormatImage from '@/shared/assets/images/main/features/FormatImage.svg';
import RescheduleImage from '@/shared/assets/images/main/features/RescheduleImage.svg';
import TimeImage from '@/shared/assets/images/main/features/TimeImage.svg';
import ControlEmotions from '@/shared/assets/images/main/reasons/control_of_emotions_red_t.png';
import MirrorRed from '@/shared/assets/images/main/reasons/mirror_red_t.png';
import PhoneRed from '@/shared/assets/images/main/reasons/phone_red_t.png';
import PuzzleRed from '@/shared/assets/images/main/reasons/puzzle_red_t.png';
import StarRed from '@/shared/assets/images/main/reasons/star_red_t.png';
import StormRed from '@/shared/assets/images/main/reasons/storm_red_t.png';

export const SERVICE_PROPS = [
  'Индивидуальное психологическое консультирование',
  'Тренинги',
  'Тематические лекции и беседы',
  'Социально-психологическое анкетирование, тестирование и опросы',
];

export const REASONS_TO_VISIT = [
  { title: '...в поиске себя', image: StarRed },
  { title: '...в поиске выхода\nиз депрессии', image: StormRed },
  { title: '...в преодолении\nперепадов настроения', image: ControlEmotions },
  { title: '...в повышении\nконцентрации', image: PuzzleRed },
  { title: '...в повышении\nсамооценки', image: MirrorRed },
  { title: '...в снижении\nуровня стресса', image: PhoneRed },
];

export const FEATURES_OF_WORK = [
  {
    title: 'График работы',
    image: TimeImage,
    desc: 'Психологическая служба работает в течение всего календарного года, за исключением выходных и государственных праздников',
  },
  {
    title: 'Формат консультаций',
    image: FormatImage,
    desc: 'Консультации проводятся очно и дистанционно с помощью: мобильной связи, мессенджеров, зума, скайпа, электронной почты',
  },
  {
    title: 'Компетентые психологи',
    image: DegreeImage,
    desc: 'Все психологи службы обладают опытом работы и высшим образованием для оказания самой качественной поддержки',
  },
  {
    title: 'Перенос или пропуск консультации',
    image: RescheduleImage,
    desc: 'В случае необходимости переноса консультации, необходимо как можно раньше сообщить об этом сотруднику СПП. Пропуск запланированной консультации без предупреждения не допускается',
  },
];
