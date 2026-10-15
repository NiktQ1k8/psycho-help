import axios from 'axios';
import { getErrorMessage } from './errors';

export const $serviceClient = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL,
  withCredentials: true,
});

export const $api = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL,
  withCredentials: true,
});

const rejectWithMessage = (error: unknown) => {
  if (axios.isAxiosError(error) && !axios.isCancel(error)) {
    error.message = getErrorMessage(error);
  }
  return Promise.reject(error);
};

$serviceClient.interceptors.response.use(
  (response) => response,
  rejectWithMessage,
);

$api.interceptors.response.use((response) => response, rejectWithMessage);
