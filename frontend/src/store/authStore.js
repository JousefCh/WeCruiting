import { create } from 'zustand';
import * as authService from '../services/authService';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: true,

  initialize: async () => {
    const token = localStorage.getItem('wecruiting_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { user } = await authService.getMe();
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem('wecruiting_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await authService.login(email, password);
    localStorage.setItem('wecruiting_token', token);
    set({ user, token });
    return user;
  },

  register: async (name, email, password) => {
    const { token, user } = await authService.register(name, email, password);
    localStorage.setItem('wecruiting_token', token);
    set({ user, token });
    return user;
  },

  logout: () => {
    localStorage.removeItem('wecruiting_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;
