import type { FC } from 'react';
import Logout from '@/pages/Logout/Logout';
import ResetPassword from '@/pages/ResetPassword/ResetPassword';
import { ArticlePage } from '@/pages/article-page/ArticlePage';
import { DoctorPage } from '@/pages/doctor-page';
import { DoctorsPage } from '@/pages/doctors-page';
import { FaqPage } from '@/pages/faq-page';
import { HomePage } from '@/pages/home-page';
import { NewsItemPage } from '@/pages/news-item-page/NewsItemPage';
import { NewsPage } from '@/pages/news-page/NewsPage';
import MedicalRecordPage from '@/pages/personal-cabinet/medical-record-page/MedicalRecordPage';
import PersonalCabinet from '@/pages/personal-cabinet/personal-cabinet';
import PsychologistApplicationPage from '@/pages/personal-cabinet/psychologist-application-page/PsychologistApplicationPage';
import PsychologistAppointmentPage from '@/pages/personal-cabinet/psychologist-appointment-page/PsychologistAppointmentPage';
import { ResourcesPage } from '@/pages/resources-page';
import { TestPage } from '@/pages/test-page';
import { SLUG } from '@/shared/config/slug';

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
    Component: NewsPage,
    navText: 'Новости',
  },
  {
    path: `${SLUG.NEWS}/:id`,
    Component: NewsItemPage,
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
    path: `${SLUG.CABINET_MEDICAL_RECORD}/:id`,
    Component: MedicalRecordPage,
    authOnly: true,
  },
  {
    path: `${SLUG.CABINET_APPLICATION}/:id`,
    Component: PsychologistApplicationPage,
    authOnly: true,
  },
];

export const navPages = routes.filter(
  (route): route is IRoutePath & { navText: string } => !!route.navText,
);
