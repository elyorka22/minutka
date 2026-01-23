// ============================================
// Login Page - Вход через Telegram ID
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export default function LoginPage() {
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, login: loginWithAuth } = useAuth();

  // Если пользователь уже авторизован, редиректим
  useEffect(() => {
    if (user) {
      const role = user.role;
      if (role === 'super_admin') {
        router.push('/admin');
      } else if (role === 'chef') {
        router.push('/chef');
      } else if (role === 'restaurant_admin') {
        router.push('/restaurant-admin');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!telegramId || !telegramId.trim()) {
        setError('Введите ваш Telegram ID');
        setLoading(false);
        return;
      }

      const telegramIdNum = telegramId.trim();
      console.log('Attempting login with Telegram ID:', telegramIdNum);
      console.log('API URL:', `${API_BASE_URL}/api/auth/me?telegram_id=${telegramIdNum}`);

      // Проверяем пользователя и получаем его роль
      const response = await fetch(`${API_BASE_URL}/api/auth/me?telegram_id=${telegramIdNum}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Ошибка при подключении к серверу' };
        }
        throw new Error(errorData.error || errorData.message || `Ошибка ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Ошибка при входе');
      }

      // Используем AuthContext для входа (он сам сохранит данные и сделает редирект)
      await loginWithAuth(telegramIdNum);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Ошибка при входе. Проверьте ваш Telegram ID и подключение к интернету.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍽️ Minutka</h1>
          <p className="text-gray-600">Вход в систему</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="telegram_id" className="block text-sm font-medium text-gray-700 mb-2">
              Telegram ID
            </label>
            <input
              type="text"
              id="telegram_id"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Введите ваш Telegram ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              Ваш Telegram ID можно узнать в боте, нажав кнопку "🆔 Chat ID"
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary-500 hover:text-primary-600">
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}

