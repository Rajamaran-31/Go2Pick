import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isOnboarded: false,

  initialize: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      const onboarded = await AsyncStorage.getItem('isOnboarded');
      set({
        token,
        user: userStr ? JSON.parse(userStr) : null,
        isOnboarded: onboarded === 'true',
        isLoading: false,
      });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  setOnboarded: async () => {
    try {
      await AsyncStorage.setItem('isOnboarded', 'true');
      set({ isOnboarded: true });
    } catch (e) {}
  },

  login: async (token, user) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      set({ token, user });
    } catch (e) {}
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      set({ token: null, user: null });
    } catch (e) {}
  },

  refreshUser: async () => {
    try {
      const res = await authAPI.getMe();
      await AsyncStorage.setItem('user', JSON.stringify(res.data));
      set({ user: res.data });
    } catch (e) {}
  },

  switchMode: async (mode) => {
    try {
      await authAPI.switchMode({ mode });
      const newUser = { ...get().user, currentMode: mode };
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      set({ user: newUser });
    } catch (e) {}
  },
}));
