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
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError('Telegram ID ni kiriting');
        setLoading(false);
        return;
      }

      if (!password || !password.trim()) {
        setError('Parolni kiriting');
        setLoading(false);
        return;
      }

      const telegramIdNum = telegramId.trim();
      console.log('Attempting login with Telegram ID:', telegramIdNum, 'Role: xodim');

      // Используем AuthContext для входа с паролем (только для сотрудников)
      await loginWithAuth(telegramIdNum, password);
      
      // Если дошли сюда, значит вход успешен, но редирект еще не произошел
      // Это нормально, редирект произойдет через useEffect когда user обновится
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Kirishda xatolik. Telegram ID, parol (agar xodim bo\'lsangiz) va internet ulanishini tekshiring.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍽️ Minutka</h1>
          <p className="text-gray-600">Xodimlar uchun kirish</p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Eslatma:</strong> Bu sahifa faqat xodimlar (adminlar va oshpazlar) uchun. 
            Mijozlar buyurtma berish uchun ro'yxatdan o'tishlari shart emas. 
            Agar siz buyurtma holatini kuzatmoqchi bo'lsangiz, buyurtma berishda Chat ID ni ko'rsating.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="telegram_id" className="block text-sm font-medium text-gray-700 mb-2">
              Telegram ID *
            </label>
            <input
              type="text"
              id="telegram_id"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Telegram ID ni kiriting"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              Telegram ID ni botda "🆔 Chat ID" tugmasini bosib bilib olishingiz mumkin
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parol *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolni kiriting"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Parol hisob yaratilganda administrator tomonidan beriladi
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
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary-500 hover:text-primary-600">
            ← Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}

