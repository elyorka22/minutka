// ============================================
// Change Password Page - Изменение пароля
// ============================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { changePassword } from '@/lib/api';

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Проверяем, что пользователь является сотрудником
  if (!user || (user.role !== 'super_admin' && user.role !== 'restaurant_admin' && user.role !== 'chef')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">Эта страница доступна только для сотрудников.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-primary-500 text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Валидация
    if (!formData.old_password || !formData.new_password || !formData.confirm_password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('Новый пароль должен содержать не менее 6 символов');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Новые пароли не совпадают');
      return;
    }

    if (formData.old_password === formData.new_password) {
      setError('Новый пароль должен отличаться от текущего');
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        telegram_id: user.telegram_id,
        old_password: formData.old_password,
        new_password: formData.new_password,
      });

      setSuccess(true);
      setFormData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });

      // Перенаправляем через 2 секунды
      setTimeout(() => {
        if (user.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/restaurant-admin');
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError(err.message || 'Ошибка при изменении пароля. Проверьте текущий пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">🔐 Изменить пароль</h1>

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <p className="font-semibold">Пароль успешно изменен!</p>
            <p className="text-sm mt-1">Вы будете перенаправлены через несколько секунд...</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текущий пароль *
            </label>
            <input
              type="password"
              value={formData.old_password}
              onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Введите текущий пароль"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Новый пароль *
            </label>
            <input
              type="password"
              value={formData.new_password}
              onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Введите новый пароль (минимум 6 символов)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Минимум 6 символов
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Подтвердите новый пароль *
            </label>
            <input
              type="password"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Повторите новый пароль"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Изменение...' : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


