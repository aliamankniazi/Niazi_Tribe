import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signIn, signOut } from 'next-auth/react';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });

          if (result?.error) {
            throw new Error(result.error);
          }
          // The user will be set through the session callback in next-auth
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const result = await signIn('credentials', {
            redirect: false,
            name,
            email,
            password,
            isRegister: 'true',
          });

          if (result?.error) {
            throw new Error(result.error);
          }
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        signOut({ redirect: true, callbackUrl: '/login' });
        set({ user: null, isAuthenticated: false });
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'niazi-auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 