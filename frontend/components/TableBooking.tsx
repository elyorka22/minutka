// ============================================
// Table Booking Component - Форма бронирования столика
// ============================================

'use client';

import { useState } from 'react';

interface TableBookingProps {
  restaurantId: string;
  restaurantName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TableBooking({ restaurantId, restaurantName, isOpen, onClose }: TableBookingProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Формируем текст бронирования для отправки
    const bookingText = `🍽️ "${restaurantName}" restoranida stol bron qilish\n\n` +
      `👤 Ism: ${formData.name}\n` +
      `📞 Telefon: ${formData.phone}\n` +
      `📅 Sana: ${formData.date}\n` +
      `🕐 Vaqt: ${formData.time}\n` +
      `👥 Mehmonlar soni: ${formData.guests}\n` +
      (formData.notes ? `📝 Izoh: ${formData.notes}\n` : '');

    // Здесь можно добавить отправку на сервер или в Telegram
    // Для MVP просто показываем успешное сообщение
    setTimeout(() => {
      alert('Bron so\'rovi yuborildi! Siz bilan tasdiqlash uchun bog\'lanamiz.');
      setFormData({
        name: '',
        phone: '',
        date: '',
        time: '',
        guests: '2',
        notes: '',
      });
      setIsSubmitting(false);
      onClose();
    }, 500);
  };

  // Получаем минимальную дату (сегодня)
  const today = new Date().toISOString().split('T')[0];
  
  // Получаем максимальную дату (через 30 дней)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Stol bron qilish</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Закрыть форму"
          >
            ×
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Ism *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Sana *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              min={today}
              max={maxDateStr}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Vaqt *
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
              Mehmonlar soni *
            </label>
            <select
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="1">1 mehmon</option>
              <option value="2">2 mehmon</option>
              <option value="3">3 mehmon</option>
              <option value="4">4 mehmon</option>
              <option value="5">5 mehmon</option>
              <option value="6">6 mehmon</option>
              <option value="7">7+ mehmon</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Izoh
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Maxsus xohishlar (ixtiyoriy)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Yuborilmoqda...' : 'Bron qilish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

