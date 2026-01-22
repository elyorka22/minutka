// ============================================
// Restaurant Card Component
// ============================================

import Link from 'next/link';
import { Restaurant } from '../../shared/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'your_bot_username';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Контент */}
      <div className="p-4 md:p-6 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{restaurant.name}</h3>
          {restaurant.is_featured && (
            <span className="text-yellow-500 text-xl ml-2">⭐</span>
          )}
        </div>

        {restaurant.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{restaurant.description}</p>
        )}

        {restaurant.working_hours && (
          <div className="text-xs text-gray-500 mb-4">
            <p className="font-medium">Ish vaqti:</p>
            {Object.entries(restaurant.working_hours).slice(0, 2).map(([day, hours]) => (
              <p key={day}>{day}: {hours}</p>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <Link
            href={`/restaurants/${restaurant.id}`}
            className="flex-1 text-center bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
          >
            Buyurtma berish
          </Link>
        </div>
      </div>
    </div>
  );
}

