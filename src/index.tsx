/* Используемые в проекте библиотеки:
  React-Router - для переходов по урлам
  antd - По сути, готовые компоненты
  axios - для удобных запросов к БД
*/
/* Композиция проекта:
 В целом обычная для React (страницы делятся на компоненты и отдельно пишутся)
 В src/components сделаны переиспользуемые компоненты, которые могут появиться несколько раз за проект
 В src/pages сделаны собственно сами страницы сайта
 Элементы со стилями выделены в отдельный файл, откуда потом импортируются в файл компонента и там используются
 В папке API выведена вся работа с БД, .
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@/shared/scss/index.scss';
import App from './app/App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_REACT_APP_PUBLIC_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
