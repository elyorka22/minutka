// ============================================
// Client Access Denied Page
// ============================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientAccessDeniedPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Если пользователь не клиент, редиректим
    if (user) {
      const role = user.role;
      if (role === 'super_admin') {
        router.push('/admin');
      } else if (role === 'restaurant_admin') {
        router.push('/restaurant-admin');
      }
      // Если роль 'user', остаемся на этой странице
    } else {
      // Если не авторизован, редиректим на главную
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Yoqimli xaridlar tilaymiz!
          </h1>
          <p className="text-gray-600 text-lg">
            Bu sahifa faqat restoran adminlari uchun
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            Bosh sahifaga qaytish
          </Link>
          <p className="text-sm text-gray-500">
            Agar siz restoran admini bo'lsangiz, iltimos, to'g'ri hisob ma'lumotlari bilan kirishga urinib ko'ring.
          </p>
        </div>
      </div>
    </div>
  );
}

