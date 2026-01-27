// ============================================
// Cart Context - Управление состоянием корзины
// ============================================

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { MenuItem } from '@/lib/types';

// Тип элемента корзины
export interface CartItem {
  item: MenuItem;
  quantity: number;
}

// Тип контекста корзины
interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Провайдер корзины
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Добавить товар в корзину
  const addItem = useCallback((item: MenuItem, quantity: number = 1) => {
    if (!item.is_available) return;

    setItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.item.id === item.id);
      
      if (existingItem) {
        // Если товар уже есть, увеличиваем количество
        return prevItems.map((cartItem) =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // Если товара нет, добавляем новый
        return [...prevItems, { item, quantity }];
      }
    });
  }, []);

  // Удалить товар из корзины
  const removeItem = useCallback((itemId: string) => {
    setItems((prevItems) => prevItems.filter((cartItem) => cartItem.item.id !== itemId));
  }, []);

  // Обновить количество товара
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((cartItem) =>
        cartItem.item.id === itemId
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  }, [removeItem]);

  // Очистить корзину
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Получить общую стоимость
  const getTotalPrice = useCallback(() => {
    return items.reduce((total, cartItem) => {
      return total + cartItem.item.price * cartItem.quantity;
    }, 0);
  }, [items]);

  // Получить общее количество товаров
  const getTotalItems = useCallback(() => {
    return items.reduce((total, cartItem) => total + cartItem.quantity, 0);
  }, [items]);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Хук для использования корзины
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}




