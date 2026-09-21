import axios from 'axios';
import cookieParser from 'cookie-parser';
import express from 'express';
import fs from 'fs';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import router from './api-router.js';

let should_reroute = true;

if (process.env.NODE_ENV === 'production') {
  console.error(
    'Attempted to run development server in production mode. Exiting...',
  );
  process.exit(1);
}
process.loadEnvFile('.env.development');

if (!process.env.DEVEL_BACKEND_URL) {
  console.error('DEVEL_BACKEND_URL is not set');
  process.exit(1);
}
process.argv.forEach((val, index) => {
  if (val == '--skip-connect') {
    console.log('Skipping backend connection check');
    should_reroute = false;
  }
});

const app = express();

app.use(cookieParser());

if (should_reroute) {
  try {
    console.assert(
      (
        await axios.request({
          baseURL: process.env.DEVEL_BACKEND_URL,
          timeout: 2000,
          url: '/openapi.json',
        })
      ).status === 200,
    );
    console.warn(
      '\x1b[33m%s\x1b[0m',
      'Succesfully connected to development backend, assuming api server is not dead.\nApi requests will be routed to real server. To override this behavior, use the --skip-connect flag.',
    );
    app.use(
      '/',
      createProxyMiddleware({
        target: process.env.DEVEL_BACKEND_URL,
        changeOrigin: true,
      }),
    );
  } catch (error) {
    console.log(error);
    console.error(
      '\x1b[33m%s\x1b[0m',
      'Failed to connect to development backend. Trying to initialize local server',
    );
    should_reroute = false;
  }
}

if (!should_reroute) {
  app.use(express.json());
  let apiPath = new URL(process.env.VITE_REACT_APP_API_URL).pathname;
  if (apiPath !== '/' && apiPath.endsWith('/')) {
    apiPath = apiPath.slice(0, -1);
  }
  app.use(apiPath, router);
  app.get('/image/*imagesPath', (req, res) => {
    fs.access(
      path.join(process.cwd(), ...req.params.imagesPath),
      fs.constants.F_OK,
      (err) => {
        if (err) {
          return res.status(404).json({ message: 'Файл не найден' });
        }
        res.sendFile(path.join(process.cwd(), ...req.params.imagesPath));
      },
    );
  });
}

app.listen(8000, () => {
  console.log(
    '\x1b[32m%s\x1b[0m',
    'Local server succesfully started as http://localhost:8000',
  );
});
