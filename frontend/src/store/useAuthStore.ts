import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { getMockDb } from '../api/mockData';
import { authService } from '../api/services';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initAuth: () => void;
  login: (email: string) => Promise<void>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  initAuth: () => {
    try {
      const storedUser = localStorage.getItem('astral_user');
      const storedToken = localStorage.getItem('astral_token');
      if (storedUser && storedToken) {
        const user = JSON.parse(storedUser) as User;
        set({ user, token: storedToken, isAuthenticated: true });
        return;
      }
    } catch (e) {
      console.error('Lỗi khi đọc auth từ localStorage:', e);
    }

    // Mặc định nạp tài khoản Khách hàng mẫu
    const db = getMockDb();
    const defaultCustomer = db.users.find((u) => u.role === 'CUSTOMER') || db.users[0];
    const defaultToken = `mock-token-${defaultCustomer.id}`;
    localStorage.setItem('astral_user', JSON.stringify(defaultCustomer));
    localStorage.setItem('astral_token', defaultToken);
    set({ user: defaultCustomer, token: defaultToken, isAuthenticated: true });
  },

  login: async (email: string) => {
    set({ isLoading: true });
    try {
      const res = await authService.login(email);
      set({ user: res.user, token: res.access_token, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  quickSwitchRole: (role: UserRole) => {
    const db = getMockDb();
    const targetUser = db.users.find((u) => u.role === role);
    if (!targetUser) return;
    const token = `mock-token-${targetUser.id}`;
    localStorage.setItem('astral_user', JSON.stringify(targetUser));
    localStorage.setItem('astral_token', token);
    set({ user: targetUser, token, isAuthenticated: true });
  },
}));