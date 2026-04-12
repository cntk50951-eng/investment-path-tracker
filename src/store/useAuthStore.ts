// ==========================================
// 認證狀態 Store (Firebase)
// ==========================================

import { create } from 'zustand';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase';
import type { User } from '../types';

interface AuthStateInterface {
  // 狀態
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  initAuthListener: () => void;
  setUser: (user: User | null) => void;
  setError: (error: string) => void;
}

export const useAuthStore = create<AuthStateInterface>((set) => ({
  // 初始狀態
  user: null,
  isLoading: false,
  error: null,

  // Google 登錄
  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      set({
        user: {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || undefined,
          isPremium: false,
          premiumTier: 'free',
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ 
        error: error.message || '登錄失敗', 
        isLoading: false 
      });
      throw error;
    }
  },

  // 登出
  logout: async () => {
    set({ isLoading: true });
    try {
      await signOut(auth);
      set({ user: null, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  // 初始化認證監聽器
  initAuthListener: () => {
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({
          user: {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || undefined,
            isPremium: false,
            premiumTier: 'free',
          },
          isLoading: false,
        });
      } else {
        set({ user: null, isLoading: false });
      }
    });
  },

  // 手動設置用戶 (用於 Mock)
  setUser: (user) => set({ user }),

  // 設置錯誤
  setError: (error) => set({ error }),
}));
