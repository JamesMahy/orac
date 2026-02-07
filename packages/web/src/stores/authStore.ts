import { create } from 'zustand';

type AuthState = {
  credentials: string | null;
  isAuthenticated: boolean;
  setCredentials: (username: string, password: string) => void;
  authenticate: () => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(setState => ({
  credentials: null,
  isAuthenticated: false,
  setCredentials: (username, password) => {
    const encoded = btoa(`${username}:${password}`);
    setState({ credentials: encoded });
  },
  authenticate: () => {
    setState({ isAuthenticated: true });
  },
  logout: () => {
    setState({ credentials: null, isAuthenticated: false });
  },
}));
