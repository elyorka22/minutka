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
  login: (telegramId: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Проверка истечения сессии (30 минут неактивности)
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут в миллисекундах

  const checkSessionExpiry = () => {
    if (typeof window === 'undefined') return false;
    
    const lastActivity = localStorage.getItem('last_activity');
    if (!lastActivity) return false;
    
    const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
    return timeSinceLastActivity > SESSION_TIMEOUT;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('telegram_id');
    localStorage.removeItem('last_activity');
    router.push('/login');
  };

  // Загружаем пользователя из localStorage при монтировании
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Проверяем истечение сессии
        if (checkSessionExpiry()) {
          console.log('Session expired, clearing user data');
          localStorage.removeItem('user');
          localStorage.removeItem('telegram_id');
          localStorage.removeItem('last_activity');
          setUser(null);
          setLoading(false);
          return;
        }

        const storedUser = localStorage.getItem('user');
        const telegramId = localStorage.getItem('telegram_id');

        if (storedUser && telegramId) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Обновляем данные пользователя с сервера
          await refreshUser();
          
          // Обновляем время последней активности
          localStorage.setItem('last_activity', Date.now().toString());
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('telegram_id');
        localStorage.removeItem('last_activity');
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Проверяем истечение сессии каждую минуту
    const sessionCheckInterval = setInterval(() => {
      if (checkSessionExpiry() && user) {
        console.log('Session expired, logging out');
        logout();
      }
    }, 60 * 1000); // Проверка каждую минуту

    return () => clearInterval(sessionCheckInterval);
  }, [user]);

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
        localStorage.setItem('last_activity', Date.now().toString()); // Обновляем время активности
      } else {
        // Пользователь не найден или ошибка
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('telegram_id');
        localStorage.removeItem('last_activity');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('telegram_id');
    }
  };

  const login = async (telegramId: string, password?: string) => {
    setLoading(true);
    try {
      console.log('AuthContext: Attempting login with Telegram ID:', telegramId, password ? 'with password' : 'without password');
      
      // Если есть пароль, отправляем POST запрос с паролем
      const url = password 
        ? `${API_BASE_URL}/api/auth/login`
        : `${API_BASE_URL}/api/auth/me?telegram_id=${telegramId}`;
      
      const options: RequestInit = {
        method: password ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (password) {
        options.body = JSON.stringify({ telegram_id: telegramId, password });
      }

      console.log('AuthContext: API URL:', url);
      
      const response = await fetch(url, options);

      console.log('AuthContext: Response status:', response.status);
      console.log('AuthContext: Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AuthContext: Response error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Ошибка при подключении к серверу' };
        }
        throw new Error(errorData.error || errorData.message || `Ошибка ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AuthContext: Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при входе');
      }

      setUser(data.data);
      localStorage.setItem('user', JSON.stringify(data.data));
      localStorage.setItem('telegram_id', telegramId);
      localStorage.setItem('last_activity', Date.now().toString()); // Обновляем время активности

      console.log('AuthContext: User logged in, role:', data.data.role);

      // Редиректим в зависимости от роли
      const role = data.data.role;
      if (role === 'super_admin') {
        console.log('AuthContext: Redirecting to /admin');
        router.push('/admin');
      } else if (role === 'chef') {
        console.log('AuthContext: Redirecting to /chef');
        router.push('/chef');
      } else if (role === 'restaurant_admin') {
        console.log('AuthContext: Redirecting to /restaurant-admin');
        router.push('/restaurant-admin');
      } else {
        console.log('AuthContext: Redirecting to /');
        router.push('/');
      }
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('telegram_id');
    localStorage.removeItem('last_activity');
    router.push('/login');
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

