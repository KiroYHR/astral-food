import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../api/services';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

interface StoredAuthSnapshot {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const readStoredAuth = (): StoredAuthSnapshot => {
  try {
    const storedUser = localStorage.getItem('astral_user');
    const storedToken = localStorage.getItem('astral_token');

    if (!storedUser || !storedToken) {
      return { user: null, token: null, isAuthenticated: false };
    }

    if (!USE_MOCK && storedToken.startsWith('mock-')) {
      localStorage.removeItem('astral_user');
      localStorage.removeItem('astral_token');
      return { user: null, token: null, isAuthenticated: false };
    }

    const user = JSON.parse(storedUser) as User;
    return { user, token: storedToken, isAuthenticated: true };
  } catch (e) {
    console.error('Lỗi khi đọc auth từ localStorage:', e);
    localStorage.removeItem('astral_user');
    localStorage.removeItem('astral_token');
    return { user: null, token: null, isAuthenticated: false };
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const initialAuth = readStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  isAuthenticated: initialAuth.isAuthenticated,
  isLoading: false,

  initAuth: () => {
    set(readStoredAuth());
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(email, password);
      set({
        user: res.user,
        token: res.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      return res.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));