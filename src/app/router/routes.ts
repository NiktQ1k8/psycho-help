import { type FC, lazy } from 'react';
import { SLUG } from '@/shared/config/slug';

const Logout = lazy(() => import('@/pages/Logout/Logout'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword/ResetPassword'));
const HomePage = lazy(() => import('@/pages/home-page/home-page'));
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
const ResourcesPage = lazy(() =>
  import('@/pages/resources-page').then((module) => ({
    default: module.ResourcesPage,
  })),
);
const ArticlePage = lazy(() =>
  import('@/pages/article-page/ArticlePage').then((module) => ({
    default: module.ArticlePage,
  })),
);
const TestPage = lazy(() =>
  import('@/pages/test-page').then((module) => ({
    default: module.TestPage,
  })),
);
const FaqPage = lazy(() => import('@/pages/faq-page/faq-page'));
const PersonalCabinet = lazy(
  () => import('@/pages/personal-cabinet/personal-cabinet'),
);
const PsychologistApplicationPage = lazy(
  () =>
    import('@/pages/personal-cabinet/psychologist-application-page/PsychologistApplicationPage'),
);
const PsychologistAppointmentPage = lazy(
  () =>
    import('@/pages/personal-cabinet/psychologist-appointment-page/PsychologistAppointmentPage'),
);
const MedicalRecordPage = lazy(
  () =>
    import('@/pages/personal-cabinet/medical-record-page/MedicalRecordPage'),
);

interface IRoutePath {
  path: string;
  Component: FC;
  navText?: string;
  authOnly?: boolean;
}

// Порядок маршрутов определяет порядок ссылок в шапке
export const routes: IRoutePath[] = [
  { path: SLUG.LOGOUT, Component: Logout },
  { path: SLUG.RESET_PASSWORD, Component: ResetPassword },
  {
    path: SLUG.MAIN,
    Component: HomePage,
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
    Component: ResourcesPage,
    navText: 'Полезные материалы',
  },
  {
    path: `${SLUG.ARTICLE}/:id`,
    Component: ArticlePage,
  },
  {
    path: `${SLUG.TEST}/:id`,
    Component: TestPage,
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
    path: `${SLUG.CABINET_APPLICATION}/:id`,
    Component: PsychologistApplicationPage,
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
