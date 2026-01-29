'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getMyRestaurants } from '@/lib/api';
import Image from 'next/image';

interface RestaurantOption {
  restaurant_id: string;
  admin_id: string;
  restaurant: {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    is_active: boolean;
    is_featured: boolean;
  };
}

export default function SelectRestaurantPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'restaurant_admin') {
      if (user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user || user.role !== 'restaurant_admin') return;

      const telegramId = localStorage.getItem('telegram_id');
      if (!telegramId) {
        setError('Telegram ID не найден');
        setLoadingRestaurants(false);
        return;
      }

      try {
        setLoadingRestaurants(true);
        console.log('[SelectRestaurant] Fetching restaurants for telegram_id:', telegramId);
        const data = await getMyRestaurants(telegramId);
        console.log('[SelectRestaurant] Received restaurants:', data);
        setRestaurants(data);
        
        // Если только один ресторан, автоматически выбираем его
        if (data.length === 1) {
          console.log('[SelectRestaurant] Only one restaurant, auto-selecting:', data[0].restaurant_id);
          handleSelectRestaurant(data[0].restaurant_id);
        } else if (data.length === 0) {
          console.error('[SelectRestaurant] No restaurants found');
          setError('У вас нет доступных ресторанов');
        } else {
          console.log(`[SelectRestaurant] Found ${data.length} restaurants, showing selection page`);
        }
      } catch (err: any) {
        console.error('[SelectRestaurant] Error fetching restaurants:', err);
        setError('Ошибка при загрузке ресторанов');
      } finally {
        setLoadingRestaurants(false);
      }
    };

    if (user && user.role === 'restaurant_admin') {
      fetchRestaurants();
    }
  }, [user]);

  const handleSelectRestaurant = (restaurantId: string) => {
    localStorage.setItem('selected_restaurant_id', restaurantId);
    router.push('/restaurant-admin');
  };

  if (loading || loadingRestaurants) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Выберите ресторан
          </h1>
          <p className="text-gray-600">
            У вас есть доступ к нескольким ресторанам. Выберите ресторан, с которым хотите работать.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((option) => (
            <button
              key={option.restaurant_id}
              onClick={() => handleSelectRestaurant(option.restaurant_id)}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-left"
            >
              {option.restaurant.image_url ? (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={option.restaurant.image_url}
                    alt={option.restaurant.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {option.restaurant.name}
              </h3>
              {option.restaurant.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {option.restaurant.description}
                </p>
              )}
              {option.restaurant.is_featured && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-yellow-600 bg-yellow-100 rounded">
                  TOP
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

