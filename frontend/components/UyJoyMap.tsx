'use client';

// ============================================
// Uy-joy Map Section
// Карта города + список объявлений по недвижимости
// ============================================

import React from 'react';

interface UyJoyListing {
  id: string;
  title: string;
  type: 'rent' | 'sale';
  price: string;
  address: string;
  description?: string;
}

// Примерные координаты города: 40°59′52″ с. ш. 71°14′25″ в. д.
// Перевод в десятичный формат:
// 40 + 59/60 + 52/3600 ≈ 40.9978
// 71 + 14/60 + 25/3600 ≈ 71.2403
const CITY_CENTER = {
  lat: 40.9978,
  lng: 71.2403,
};

// Простые примеры объявлений (позже можно будет брать с бэкенда)
const SAMPLE_LISTINGS: UyJoyListing[] = [
  {
    id: '1',
    title: 'Аренда торгового помещения 50 м²',
    type: 'rent',
    price: '$500 / месяц',
    address: 'Центр города, рядом с рынком',
    description: 'Проходное место, идеально для магазина или кофейни.',
  },
  {
    id: '2',
    title: 'Продажа помещения 120 м²',
    type: 'sale',
    price: '$85 000',
    address: 'Жилой массив, 1-й этаж',
    description: 'Отдельный вход, есть парковка перед домом.',
  },
  {
    id: '3',
    title: 'Аренда офиса 30 м²',
    type: 'rent',
    price: '$300 / месяц',
    address: 'Деловой центр города',
    description: 'Светлый офис, кондиционер, быстрый интернет.',
  },
];

function getOpenStreetMapEmbedUrl() {
  // Делаем небольшой прямоугольник вокруг центра города
  const delta = 0.05;
  const minLat = CITY_CENTER.lat - delta;
  const maxLat = CITY_CENTER.lat + delta;
  const minLng = CITY_CENTER.lng - delta;
  const maxLng = CITY_CENTER.lng + delta;

  // bbox: minLng,minLat,maxLng,maxLat
  const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;

  // В качестве маркера используем центр города
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${CITY_CENTER.lat},${CITY_CENTER.lng}`;
}

export default function UyJoyMap() {
  const iframeUrl = getOpenStreetMapEmbedUrl();

  return (
    <div className="relative w-full h-full">
      {/* Карта занимает всю доступную область */}
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Uy-joy map"
      />

      {/* Панель объявлений поверх карты */}
      <div className="absolute inset-4 md:inset-6 flex justify-end pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg max-w-sm w-full md:w-80 p-3 md:p-4 flex flex-col">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
            🏠 Uy-joy e&apos;lonlari
          </h2>

          <div className="space-y-2 md:space-y-3 overflow-y-auto max-h-[60vh]">
            {SAMPLE_LISTINGS.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-2.5 md:p-3 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      item.type === 'rent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {item.type === 'rent' ? 'Аренда' : 'Продажа'}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-gray-700 font-medium mb-1">
                  {item.price}
                </p>

                <p className="text-xs text-gray-500 mb-1 line-clamp-2">
                  📍 {item.address}
                </p>

                {item.description && (
                  <p className="text-[11px] md:text-xs text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-2 text-[11px] md:text-xs text-gray-400">
            Ko&apos;proq e&apos;lonlar tez orada qo&apos;shiladi.
          </p>
        </div>
      </div>
    </div>
  );
}


