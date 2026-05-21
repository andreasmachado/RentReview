import { createContext, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api.js';
import type { AuthUser } from '../lib/api.js';
import type { LoginInput, RegisterInput } from '@shared/validation';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshUser() {
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'UNAUTHORIZED') {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  async function login(data: LoginInput) {
    const { user } = await api.auth.login(data);
    setUser(user);
  }

  async function logout() {
    await api.auth.logout();
    setUser(null);
  }

  async function register(data: RegisterInput) {
    await api.auth.register(data);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
