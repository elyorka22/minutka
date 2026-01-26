// ============================================
// Cart Component - Корзина с формой оформления заказа
// ============================================

'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { createOrder } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

interface CartProps {
  restaurantId: string;
  restaurantName: string;
  telegramBotUsername: string;
  buttonPosition?: 'floating' | 'header';
}

export default function Cart({ restaurantId, restaurantName, telegramBotUsername, buttonPosition = 'floating' }: CartProps) {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart();
  const { showSuccess, showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [chatId, setChatId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  // Формирование текста заказа
  const formatOrderText = () => {
    let orderText = `🍽️ "${restaurantName}" restoranidan buyurtma\n\n`;
    
    items.forEach((cartItem) => {
      orderText += `${cartItem.item.name} x${cartItem.quantity} - ${cartItem.item.price * cartItem.quantity} сум\n`;
    });
    
    orderText += `\n💰 Jami: ${totalPrice} сум\n`;
    
    if (name) {
      orderText += `\n👤 Ism: ${name}\n`;
    }
    
    if (phone) {
      orderText += `📞 Telefon: ${phone}\n`;
    }
    
    if (address) {
      orderText += `📍 Manzil: ${address}\n`;
    }
    
    if (notes) {
      orderText += `\n📝 Izoh: ${notes}\n`;
    }
    
    return orderText;
  };

  // Отправка заказа через API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Savatcha bo\'sh');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderText = formatOrderText();
      
      // Создаем или получаем пользователя по telegram_id
      let userId: string;
      
      if (chatId) {
        // Если указан Chat ID, создаем или находим пользователя
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        
        // Сначала проверяем, существует ли пользователь
        const checkUserResponse = await fetch(`${API_BASE_URL}/api/users?telegram_id=${chatId}`);
        const checkUserData = await checkUserResponse.json();
        
        if (checkUserData.success && checkUserData.data && checkUserData.data.length > 0) {
          userId = checkUserData.data[0].id;
        } else {
          // Создаем нового пользователя
          const createUserResponse = await fetch(`${API_BASE_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegram_id: parseInt(chatId, 10),
              first_name: name || null,
              phone: phone || null
            })
          });
          const createUserData = await createUserResponse.json();
          
          if (!createUserData.success) {
            throw new Error(createUserData.error || 'Failed to create user');
          }
          
          userId = createUserData.data.id;
        }
      } else {
        // Если Chat ID не указан, создаем временного пользователя без telegram_id
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
        const createUserResponse = await fetch(`${API_BASE_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: name || null,
            phone: phone || null
          })
        });
        const createUserData = await createUserResponse.json();
        
        if (!createUserData.success) {
          throw new Error(createUserData.error || 'Failed to create user');
        }
        
        userId = createUserData.data.id;
      }

      // Создаем заказ
      await createOrder({
        restaurant_id: restaurantId,
        user_id: userId,
        order_text: orderText,
        address: address || undefined
      });

      // Успешно оформлен заказ
      showSuccess('Buyurtma muvaffaqiyatli qabul qilindi!');
      
      // Очищаем корзину после отправки
      clearCart();
      setIsOpen(false);
      setAddress('');
      setPhone('');
      setName('');
      setNotes('');
      setChatId('');
    } catch (error: any) {
      console.error('Error creating order:', error);
      showError('Buyurtma yuborishda xatolik yuz berdi: ' + (error.message || 'Noma\'lum xatolik'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Кнопка корзины
  const CartButton = () => {
    // Для плавающей кнопки скрываем, если корзина пуста и не открыта
    if (totalItems === 0 && !isOpen && buttonPosition === 'floating') {
      return null;
    }

    // Для кнопки в хедере всегда показываем
    const buttonClasses = buttonPosition === 'header'
      ? "bg-primary-500 text-white rounded-lg px-4 py-2 shadow-md hover:bg-primary-600 transition-colors flex items-center gap-2"
      : "fixed bottom-6 right-6 bg-primary-500 text-white rounded-full px-6 py-4 shadow-lg hover:bg-primary-600 transition-colors z-50 flex items-center gap-2";

    return (
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClasses}
      >
        <span className="text-xl">🛒</span>
        <span className="font-semibold">Savatcha</span>
        {totalItems > 0 && (
          <span className="bg-white text-primary-500 rounded-full px-2 py-1 text-sm font-bold">
            {totalItems}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Кнопка открытия корзины */}
      {!isOpen && <CartButton />}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Боковая панель корзины */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[500px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Savatcha</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Закрыть корзину"
          >
            ×
          </button>
        </div>

        {/* Содержимое корзины */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Savatcha bo\'sh</p>
            </div>
          ) : (
            <>
              {/* Список товаров */}
              <div className="space-y-4 mb-6">
                {items.map((cartItem) => (
                  <div key={cartItem.item.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                    {cartItem.item.image_url && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={cartItem.item.image_url}
                          alt={cartItem.item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{cartItem.item.name}</h3>
                      <p className="text-sm text-gray-600">{cartItem.item.price}₽ × {cartItem.quantity}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                          className="bg-gray-200 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-300 transition-colors"
                        >
                          −
                        </button>
                        <span className="text-lg font-semibold w-8 text-center">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                          className="bg-primary-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-primary-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-lg font-bold text-primary-600 w-20 text-right">
                        {cartItem.item.price * cartItem.quantity} сум
                      </span>
                      <button
                        onClick={() => removeItem(cartItem.item.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label="Удалить товар"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Итого */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                      <span className="text-xl font-semibold text-gray-900">Jami:</span>
                  <span className="text-2xl font-bold text-primary-600">{totalPrice} сум</span>
                </div>
              </div>

              {/* Форма оформления заказа */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Ism *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ismingiz"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Yetkazib berish manzili *
                  </label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ko\'cha, uy, kvartira"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Buyurtma uchun izoh
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Qo\'shimcha xohishlar (ixtiyoriy)"
                  />
                </div>

                <div>
                  <label htmlFor="chatId" className="block text-sm font-medium text-gray-700 mb-1">
                        Chat ID (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    id="chatId"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Telegram Chat ID (xabarlar olish uchun)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Chat ID ni bot orqali bilib olishingiz mumkin: /start va "🆔 Chat ID" tugmasini bosing
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Yuborilmoqda...' : '✅ Buyurtma berish'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

