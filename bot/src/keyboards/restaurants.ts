// ============================================
// Keyboard for Restaurant Selection
// ============================================

import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';
import { Restaurant } from '../types';

/**
 * Создает inline клавиатуру со списком ресторанов
 */
export function createRestaurantKeyboard(restaurants: Restaurant[]): InlineKeyboardMarkup {
  const buttons = restaurants.map(restaurant => [
    {
      text: restaurant.name,
      callback_data: `restaurant:${restaurant.id}`
    }
  ]);

  return {
    inline_keyboard: buttons
  };
}


