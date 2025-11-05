import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  nama: string;
  role: 'puskesmas' | 'admin';
  kode_puskesmas?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      
      login: (user: User, token: string) => {
        set({
          isAuthenticated: true,
          user,
          token,
        });
      },
      
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          token: null,
        });
      },
      
      setUser: (user: User | null) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
);
