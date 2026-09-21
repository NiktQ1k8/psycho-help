// import ConcentrationImage from '../../assets/images/main/reasons/reason_concentration.png';
// import FindingYourselfImage from '../../assets/images/main/reasons/reason_finding-yourself.png';
// import ProblemSolvingImage from '../../assets/images/main/reasons/reason_problem-solving.png';
// import MoodSwingsImage from '../../assets/images/main/reasons/reason_mood-swings.png';
// import SelfetimateImage from '../../assets/images/main/reasons/reason_selfetimate.png';
// import StressReductionImage from '../../assets/images/main/reasons/reason_stress-reduction.png';
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

// import DegreeImage from '../../assets/images/main/features/feature_degree.png';
// import FormatImage from '../../assets/images/main/features/feature_format.png';
// import TimeImage from '../../assets/images/main/features/feature_time.png';
// import RescheduleImage from '../../assets/images/main/features/feature_reschedule.png';

//Файл с кностантами(импортируются в другие компоненты как пропсы)

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

// export const REASONS_TO_VISIT = [
//   { title: 'Помощь в нахождении себя', image: FindingYourselfImage },
//   { title: 'Поиск решения в трудный период', image: ProblemSolvingImage },
//   { title: 'Преодолении колебаний в настроении', image: MoodSwingsImage },
//   { title: 'Повышение самооценки', image: SelfetimateImage },
//   { title: 'Повышение концентрации', image: ConcentrationImage },
//   { title: 'Снижение уровня стресса', image: StressReductionImage },
// ];

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
