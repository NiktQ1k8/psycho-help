import type { FC } from 'react';
import {
  ArticlePage,
  DoctorPage,
  DoctorsPage,
  FaqPage,
  HomePage,
  NewsItemPage,
  NewsPage,
  PersonalCabinet,
  ResourcesPage,
  TestPage,
} from '@/pages';
import PsychologistApplicationPage from '@/pages/personal-cabinet/psychologist-application-page/PsychologistApplicationPage';
import PsychologistAppointmentPage from '@/pages/personal-cabinet/psychologist-appointment-page/PsychologistAppointmentPage';

interface RoutePath {
  path: string;
  Component: FC;
  navText?: string;
  authOnly?: boolean;
}

export const CABINET_PATH = '/cabinet';

// Порядок маршрутов определяет порядок ссылок в шапке.
export const routes: RoutePath[] = [
  {
    path: '/',
    Component: HomePage,
    navText: 'Главная',
  },
  {
    path: '/therapists/',
    Component: DoctorsPage,
    navText: 'Психологи',
  },
  {
    path: '/therapists/:id',
    Component: DoctorPage,
  },
  {
    path: '/article/:id',
    Component: ArticlePage,
  },
  {
    path: '/news/',
    Component: NewsPage,
    navText: 'Новости',
  },
  {
    path: '/news/:slug',
    Component: NewsItemPage,
  },
  {
    path: '/resources',
    Component: ResourcesPage,
    navText: 'Полезные материалы',
  },
  {
    path: '/test/:id',
    Component: TestPage,
  },
  {
    path: '/faq',
    Component: FaqPage,
    navText: 'FAQ',
  },
  {
    path: CABINET_PATH,
    Component: PersonalCabinet,
    authOnly: true,
  },
  {
    path: `${CABINET_PATH}/appointment/:id`,
    Component: PsychologistAppointmentPage,
    authOnly: true,
  },
  {
    path: `${CABINET_PATH}/application/:id`,
    Component: PsychologistApplicationPage,
    authOnly: true,
  },
];

export const navPages = routes.filter(
  (route): route is RoutePath & { navText: string } => !!route.navText,
);
