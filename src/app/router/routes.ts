import { type ComponentType, lazy } from 'react';
import { SLUG } from '@/shared/config/slug';

const Logout = lazy(() => import('@/pages/Logout/Logout'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword/ResetPassword'));
const Main = lazy(() =>
  import('@/pages/Main/ui/Main/Main').then((module) => ({
    default: module.Main,
  })),
);
const DoctorsPage = lazy(() => import('@/pages/doctors-page/DoctorsPage'));
const DoctorPage = lazy(() => import('@/pages/doctor-page/Doctor-page'));
const News = lazy(() =>
  import('@/pages/News/ui/News/News').then((module) => ({
    default: module.News,
  })),
);
const NewsItem = lazy(() =>
  import('@/pages/NewsItem/ui/NewsItem/NewsItem').then((module) => ({
    default: module.NewsItem,
  })),
);
const Resources = lazy(() =>
  import('@/pages/Resources/ui/Resources/Resources').then((module) => ({
    default: module.Resources,
  })),
);
const Article = lazy(() =>
  import('@/pages/Article/Article').then((module) => ({
    default: module.Article,
  })),
);
const Test = lazy(() =>
  import('@/pages/Test/ui/Test/Test').then((module) => ({
    default: module.Test,
  })),
);
const Survey = lazy(() =>
  import('@/pages/Survey/ui/Survey/Survey').then((module) => ({
    default: module.Survey,
  })),
);
const FaqPage = lazy(() => import('@/pages/faq-page/faq-page'));
const PersonalCabinet = lazy(() =>
  import('@/pages/PersonalCabinet/ui/PersonalCabinet/PersonalCabinet').then(
    (module) => ({ default: module.PersonalCabinet }),
  ),
);
const PsychologistAppointmentPage = lazy(() =>
  import('@/pages/PersonalCabinet/ui/PsychologistAppointmentPage/PsychologistAppointmentPage').then(
    (module) => ({ default: module.PsychologistAppointmentPage }),
  ),
);
const MedicalRecordPage = lazy(() =>
  import('@/pages/PersonalCabinet/ui/MedicalRecordPage/MedicalRecordPage').then(
    (module) => ({ default: module.MedicalRecordPage }),
  ),
);

interface IRoutePath {
  path: string;
  Component: ComponentType;
  navText?: string;
  authOnly?: boolean;
}

// Порядок маршрутов определяет порядок ссылок в шапке
export const routes: IRoutePath[] = [
  { path: SLUG.LOGOUT, Component: Logout },
  { path: SLUG.RESET_PASSWORD, Component: ResetPassword },
  {
    path: SLUG.MAIN,
    Component: Main,
    navText: 'Главная',
  },
  {
    path: SLUG.THERAPISTS,
    Component: DoctorsPage,
    navText: 'Психологи',
  },
  {
    path: `${SLUG.THERAPISTS}/:id`,
    Component: DoctorPage,
  },
  {
    path: SLUG.NEWS,
    Component: News,
    navText: 'Новости',
  },
  {
    path: `${SLUG.NEWS}/:id`,
    Component: NewsItem,
  },
  {
    path: SLUG.RESOURCES,
    Component: Resources,
    navText: 'Полезные материалы',
  },
  {
    path: `${SLUG.ARTICLE}/:id`,
    Component: Article,
  },
  {
    path: `${SLUG.TEST}/:id`,
    Component: Test,
  },
  {
    path: `${SLUG.SURVEY}/:id`,
    Component: Survey,
  },
  {
    path: SLUG.FAQ,
    Component: FaqPage,
    navText: 'FAQ',
  },
  {
    path: SLUG.CABINET,
    Component: PersonalCabinet,
    authOnly: true,
  },
  {
    path: `${SLUG.CABINET_APPOINTMENT}/:id`,
    Component: PsychologistAppointmentPage,
    authOnly: true,
  },
  {
    path: `${SLUG.CABINET_MEDICAL_RECORD}/:id`,
    Component: MedicalRecordPage,
    authOnly: true,
  },
];

export const navPages = routes.filter(
  (route): route is IRoutePath & { navText: string } => !!route.navText,
);
