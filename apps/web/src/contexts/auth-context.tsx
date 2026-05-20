'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { JwtPayload } from '@paiol/types';
import { apiClient, setAccessToken } from '@/lib/api-client';

interface AuthState {
  producer: JwtPayload | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    producer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.post<{ accessToken: string; expiresIn: number; user: JwtPayload | null }>('/auth/refresh', {});
      setAccessToken(res.accessToken);
      setState({ producer: res.user, isLoading: false, isAuthenticated: !!res.user });
    } catch {
      setAccessToken(null);
      setState({ producer: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.delete('/auth/logout');
    } finally {
      setAccessToken(null);
      setState({ producer: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...state, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
