import axios from 'axios';
import { useAuthStore } from '@stores/authStore';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let loggingOut = false;

api.interceptors.response.use(
  response => response,
  error => {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401 && !loggingOut) {
        loggingOut = true;
        api
          .post('/api/auth/logout')
          .catch(() => {})
          .finally(() => {
            useAuthStore.getState().logout();
            loggingOut = false;
          });
      }

      const errorData = error.response.data as Record<string, unknown>;
      let errors: string[];

      if (Array.isArray(errorData.message)) {
        errors = errorData.message as string[];
      } else if (typeof errorData.message === 'string') {
        errors = [errorData.message];
      } else {
        errors = ['Unknown error'];
      }

      throw new ApiError(
        `API Error: ${error.response.status}`,
        error.response.status,
        errors,
      );
    }
    throw error;
  },
);
