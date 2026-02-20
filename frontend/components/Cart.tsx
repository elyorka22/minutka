// ============================================
// Cart Component - Корзина с формой оформления заказа
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import { createOrder } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { getCurrentLocation, isGeolocationSupported } from '@/lib/geolocation';
import { getTelegramUserId } from '@/lib/telegram-webapp';

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
  const [phone, setPhone] = useState('+998');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [chatId, setChatId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Автоматически определяем telegram_id и имя из Telegram Web App при монтировании
  useEffect(() => {
    const telegramId = getTelegramUserId();
    if (telegramId && !chatId) {
      setChatId(telegramId);
    }
    
    // Автоматически заполняем имя из Telegram Web App
    if (typeof window !== 'undefined') {
      const webApp = (window as any).Telegram?.WebApp;
      if (webApp?.initDataUnsafe?.user) {
        const user = webApp.initDataUnsafe.user;
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        if (fullName && !name) {
          setName(fullName);
        }
      }
    }
  }, []);

  const totalPrice = getTotalPrice();
  const totalItems = getTotalItems();

  // Формирование текста заказа
  const formatOrderText = () => {
    let orderText = `🍽️ "${restaurantName}" restoranidan buyurtma\n\n`;
    
    items.forEach((cartItem) => {
      const itemPrice = cartItem.item.discount_percent && cartItem.item.discount_percent > 0
        ? Math.round(cartItem.item.price * (1 - cartItem.item.discount_percent / 100))
        : cartItem.item.price;
      orderText += `${cartItem.item.name} x${cartItem.quantity} - ${itemPrice * cartItem.quantity} so'm\n`;
    });
    
    orderText += `\n💰 Jami: ${totalPrice} so'm\n`;
    
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

      // Создаем заказ без создания пользователя
      // telegram_id используется только для уведомлений
      await createOrder({
        restaurant_id: restaurantId,
        user_id: null, // Не создаем пользователя
        user_telegram_id: chatId ? parseInt(chatId, 10) : undefined, // Telegram ID для уведомлений
        order_text: orderText,
        address: address || (latitude && longitude ? `Geolokatsiya: ${latitude}, ${longitude}` : undefined),
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });

      // Успешно оформлен заказ
      showSuccess('Buyurtma muvaffaqiyatli qabul qilindi!');
      
      // Очищаем корзину после отправки
      clearCart();
      setIsOpen(false);
      setAddress('');
      setPhone('+998');
      setName('');
      setNotes('');
      setChatId('');
      setLatitude(null);
      setLongitude(null);
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Более детальное сообщение об ошибке
      let errorMessage = 'Noma\'lum xatolik';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Error details:', {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      });
      
      showError(`Buyurtma yuborishda xatolik yuz berdi: ${errorMessage}`);
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
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Savatcha</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-2xl sm:text-3xl"
            aria-label="Закрыть корзину"
          >
            ×
          </button>
        </div>

        {/* Содержимое корзины */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">Savatcha bo'sh</p>
            </div>
          ) : (
            <>
              {/* Список товаров */}
              <div className="space-y-3 mb-6">
                {items.map((cartItem) => (
                  <div key={cartItem.item.id} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Изображение и основная информация */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {cartItem.item.image_url && (
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={cartItem.item.image_url}
                              alt={cartItem.item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{cartItem.item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">{cartItem.item.price} so'm × {cartItem.quantity}</p>
                        </div>
                      </div>
                      
                      {/* Кнопки управления и цена */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="bg-gray-200 text-gray-700 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-gray-300 transition-colors text-sm sm:text-base"
                          >
                            −
                          </button>
                          <span className="text-base sm:text-lg font-semibold w-6 sm:w-8 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="bg-primary-500 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-primary-600 transition-colors text-sm sm:text-base"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-base sm:text-lg font-bold text-primary-600 text-right min-w-[70px] sm:min-w-[80px]">
                          {(() => {
                            const itemPrice = cartItem.item.discount_percent && cartItem.item.discount_percent > 0
                              ? Math.round(cartItem.item.price * (1 - cartItem.item.discount_percent / 100))
                              : cartItem.item.price;
                            return itemPrice * cartItem.quantity;
                          })()} so'm
                        </span>
                        <button
                          onClick={() => removeItem(cartItem.item.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 text-lg sm:text-xl"
                          aria-label="Удалить товар"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Итого */}
              <div className="border-t pt-4 mb-4 sm:mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg sm:text-xl font-semibold text-gray-900">Jami:</span>
                  <span className="text-xl sm:text-2xl font-bold text-primary-600">{totalPrice} so'm</span>
                </div>
              </div>

              {/* Форма оформления заказа */}
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Скрытое поле для имени - заполняется автоматически из Telegram */}
                <div className="hidden">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                {/* Скрытое поле для chatId - заполняется автоматически из Telegram */}
                <div className="hidden">
                  <input
                    type="text"
                    id="chatId"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-sm sm:text-base text-gray-700 font-medium pointer-events-none">
                      +998
                    </span>
                    <input
                      type="tel"
                      id="phone"
                      value={phone.replace('+998', '')}
                      onChange={(e) => {
                        // Удаляем все нецифровые символы
                        const digits = e.target.value.replace(/\D/g, '');
                        // Ограничиваем до 9 цифр
                        const limitedDigits = digits.slice(0, 9);
                        // Обновляем состояние с префиксом
                        setPhone('+998' + limitedDigits);
                      }}
                      onKeyDown={(e) => {
                        // Предотвращаем удаление префикса
                        if (e.key === 'Backspace' && phone === '+998') {
                          e.preventDefault();
                        }
                      }}
                      required
                      maxLength={9}
                      className="w-full pl-16 sm:pl-20 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="901234567"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Faqat 9 ta raqam kiriting (masalan: 901234567)
                  </p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Yetkazib berish manzili {!latitude && !longitude && '*'}
                  </label>
                  <div className="flex gap-2 mb-2">
                    {isGeolocationSupported() && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsGettingLocation(true);
                          try {
                            const location = await getCurrentLocation();
                            setLatitude(location.latitude);
                            setLongitude(location.longitude);
                            // Не заполняем адрес - курьер увидит позицию на карте
                            showSuccess('Geolokatsiya aniqlandi! Kuryer sizning joylashuvingizni kartada ko\'radi.');
                          } catch (error: any) {
                            showError(error.error || 'Geolokatsiyani aniqlab bo\'lmadi');
                          } finally {
                            setIsGettingLocation(false);
                          }
                        }}
                        disabled={isGettingLocation}
                        className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {isGettingLocation ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            <span>Aniqlanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <span>📍</span>
                            <span>Avtomatik aniqlash</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required={!latitude || !longitude}
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder={latitude && longitude ? "Qo'shimcha ma'lumot (ixtiyoriy)" : "Ko'cha, uy, kvartira yoki 'Avtomatik aniqlash' tugmasini bosing"}
                  />
                  {latitude && longitude && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✅ Geolokatsiya aniqlandi! Kuryer sizning joylashuvingizni kartada ko'radi.
                      </p>
                      <p className="text-xs text-gray-500">
                        📍 Koordinatalar: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Buyurtma uchun izoh
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    placeholder="Qo'shimcha xohishlar (ixtiyoriy)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary-500 text-white py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-primary-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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

