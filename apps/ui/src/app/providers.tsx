'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';
import { getCsrfCookie } from '@/lib/api';

interface ProvidersProps {
  children: ReactNode;
}

// Create contexts for global state
const AuthContext = createContext<any>(null);
const TreeContext = createContext<any>(null);

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    getCsrfCookie();
  }, []);
  
  // You can add any global providers here
  // For now, Zustand stores are already global
  
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 