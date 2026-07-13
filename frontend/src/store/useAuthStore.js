import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { biometricService } from '../services/biometric.service';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authService.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion';
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authService.register({ name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Erreur d'inscription";
      set({ error: message, loading: false });
      throw err;
    }
  },

  loginWithBiometrics: async () => {
    set({ loading: true, error: null });
    try {
      const data = await biometricService.login();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion biométrique';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authService.me();
      set({ user: data.user });
      localStorage.setItem('user', JSON.stringify(data.user));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null });
    }
  },

  clearError: () => set({ error: null }),
}));
