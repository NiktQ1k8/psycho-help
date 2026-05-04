import type { FC } from 'react';
import {
  ArticlePage,
  DoctorPage,
  DoctorsPage,
  FaqPage,
  HomePage,
  PersonalCabinet,
  ResourcesPage,
  TestPage,
} from '@/pages';
import { News } from '@/pages/News/ui/News/News';
import { NewsItem } from '@/pages/NewsItem/ui/NewsItem/NewsItem';
import PsychologistApplicationPage from '@/pages/personal-cabinet/psychologist-application-page/PsychologistApplicationPage';
import PsychologistAppointmentPage from '@/pages/personal-cabinet/psychologist-appointment-page/PsychologistAppointmentPage';
import { SLUG } from '@/shared/config/slug';

interface RoutePath {
  path: string;
  Component: FC;
  navText?: string;
  authOnly?: boolean;
}

// Порядок маршрутов определяет порядок ссылок в шапке.
export const routes: RoutePath[] = [
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
    path: `${SLUG.CABINET_APPOINTMENT}/:id`,
    Component: PsychologistAppointmentPage,
    authOnly: true,
  },
  {
    path: `${SLUG.CABINET_APPLICATION}/:id`,
    Component: PsychologistApplicationPage,
    authOnly: true,
  },
];

export const navPages = routes.filter(
  (route): route is RoutePath & { navText: string } => !!route.navText,
);
