import { create } from 'zustand';

type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  authenticate: () => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>()(setState => ({
  isAuthenticated: false,
  isLoading: true,
  authenticate: () => {
    setState({ isAuthenticated: true });
  },
  logout: () => {
    setState({ isAuthenticated: false });
  },
  setLoading: (loading: boolean) => {
    setState({ isLoading: loading });
  },
}));
