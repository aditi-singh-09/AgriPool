import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

export const api = axios.create({ baseURL: API_BASE_URL });

const TOKEN_KEY = 'agripool.accessToken';
const REFRESH_KEY = 'agripool.refreshToken';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  setAccess: (accessToken: string) => localStorage.setItem(TOKEN_KEY, accessToken),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthEndpoint) {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) {
        tokenStorage.clear();
        return Promise.reject(error);
      }

      original._retried = true;
      try {
        refreshPromise ??= api
          .post('/auth/refresh', { refreshToken })
          .then((res) => {
            tokenStorage.setAccess(res.data.accessToken);
            return res.data.accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });

        const newAccessToken = await refreshPromise;
        original.headers.set('Authorization', `Bearer ${newAccessToken}`);
        return api(original);
      } catch (refreshError) {
        tokenStorage.clear();
        window.location.assign('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message;
    if (message) return message;
    if (error.code === 'ERR_NETWORK') return "Can't reach the AgriPool API right now.";
  }
  return 'Something went wrong. Please try again.';
}
