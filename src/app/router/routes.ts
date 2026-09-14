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
import PsychologistAppointmentPage from '@/pages/personal-cabinet/psychologist-appointment-page/PsychologistAppointmentPage';
import PsychologistApplicationPage from '@/pages/personal-cabinet/psychologist-application-page/PsychologistApplicationPage';

/*
 Тип маршрута:
 - "path" — URL-путь
 - "Component" — React-компонент, который будет отрисован по этому пути
 - "navText?" — этот текст отображается в хедере.
      Если маршрут не должен быть в навигации, то navText не указывается
 - "authOnly?" — если есть, то маршрут доступен только авторизованным пользователям.
      Если страница не требует авторизации, то authOnly не указывается

 Для header важен порядок маршрутов, так как он отрисовывает их в том же порядке, что и в массиве routes

 Здесь использовалось "FC<any>", но "any" убрали,
 так как все текущие страницы не принимают внешних пропсов.

 Если позже появятся страницы с пропсами (например, компоненту нужно будет передавать userId),
 можно сделать тип дженериком:
 *ts
 interface RoutePath<T = Record<string, unknown>> {
   path: string;
   Component: FC<T>;
 }
 и тогда конкретный маршрут можно будет описывать с указанием пропсов:
 *ts
 { path: '/example', Component: ExamplePage as FC<ExampleProps> }
 */

interface RoutePath {
  path: string;
  Component: FC; // Компонент без пропсов
  navText?: string;
  authOnly?: boolean;
}

export const CABINET_PATH = '/cabinet';

// Список всех урлов, а также компонентов, отрисовываемых при нахождении на одном из них

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
  // {
  //   path: '/news/:slug',
  //   Component: NewsItemPage,
  // },
  {
    path: '/news/:id',
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
