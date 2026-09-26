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
