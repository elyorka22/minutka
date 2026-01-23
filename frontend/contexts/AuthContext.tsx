// ============================================
// Auth Context - Контекст аутентификации
// ============================================

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

interface User {
  role: 'user' | 'super_admin' | 'chef' | 'restaurant_admin';
  user: any;
  telegram_id: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (telegramId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Загружаем пользователя из localStorage при монтировании
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const telegramId = localStorage.getItem('telegram_id');

        if (storedUser && telegramId) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Обновляем данные пользователя с сервера
          await refreshUser();
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('telegram_id');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const refreshUser = async () => {
    try {
      const telegramId = localStorage.getItem('telegram_id');
      if (!telegramId) {
        setUser(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me?telegram_id=${telegramId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.data);
        localStorage.setItem('user', JSON.stringify(data.data));
      } else {
        // Пользователь не найден или ошибка
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('telegram_id');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('telegram_id');
    }
  };

  const login = async (telegramId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me?telegram_id=${telegramId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при входе');
      }

      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('telegram_id', telegramId);

      // Редиректим в зависимости от роли
      const role = data.data.role;
      if (role === 'super_admin') {
        router.push('/admin');
      } else if (role === 'chef') {
        router.push('/chef');
      } else if (role === 'restaurant_admin') {
        router.push('/restaurant-admin');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('telegram_id');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

