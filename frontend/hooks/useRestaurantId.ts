import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

/**
 * Хук для получения текущего restaurant_id
 * Сначала проверяет localStorage (для админов с несколькими ресторанами),
 * затем данные пользователя (для админов с одним рестораном)
 */
export function useRestaurantId(): string | null {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    // Сначала проверяем localStorage (для админов с несколькими ресторанами)
    const selectedRestaurantId = localStorage.getItem('selected_restaurant_id');
    if (selectedRestaurantId) {
      setRestaurantId(selectedRestaurantId);
      return;
    }

    // Если в localStorage нет, используем данные пользователя
    if (user?.user) {
      const userRestaurantId = (user.user as any)?.restaurant_id;
      if (userRestaurantId) {
        setRestaurantId(userRestaurantId);
        // Сохраняем в localStorage для удобства
        localStorage.setItem('selected_restaurant_id', userRestaurantId);
      }
    }
  }, [user]);

  return restaurantId;
}

