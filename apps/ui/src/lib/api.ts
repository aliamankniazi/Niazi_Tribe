import axios, { AxiosError, AxiosInstance } from 'axios';
import { getSession } from 'next-auth/react';

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: string[];
}

const envBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '');
const baseURL = envBase || 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

let csrfPromise: Promise<any> | null = null;

// Request interceptor
api.interceptors.request.use(async (config) => {
  // Only get CSRF token for mutations
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    if (!csrfPromise) {
      csrfPromise = api.get('/sanctum/csrf-cookie').finally(() => {
        csrfPromise = null;
      });
    }
    await csrfPromise;
  }
  return config;
});

// Response interceptor -> normalize error
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('API Error:', error.response?.data || error.message);
    const apiError: ApiError = {
      message: (error.response?.data as any)?.message || error.message,
      statusCode: error.response?.status,
      errors: (error.response?.data as any)?.errors,
    };
    return Promise.reject(apiError);
  }
);

export const getCsrfCookie = () => {
  return api.get('/sanctum/csrf-cookie');
};

export default api; 