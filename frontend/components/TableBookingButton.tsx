// ============================================
// Table Booking Button Component - Кнопка бронирования столика
// ============================================

'use client';

import { useState } from 'react';
import TableBooking from './TableBooking';

interface TableBookingButtonProps {
  restaurantId: string;
  restaurantName: string;
}

export default function TableBookingButton({ restaurantId, restaurantName }: TableBookingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-block w-full md:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors text-center"
      >
        🍽️ Stol bron qilish
      </button>
      
      <TableBooking
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

