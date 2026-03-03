'use client';

// ============================================
// Uy-joy Map Section
// Карта города с точками объявлений
// ============================================

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface UyJoyListing {
  id: string;
  title: string;
  type: 'rent' | 'sale';
  price: string;
  address: string;
  description?: string;
  lat: number;
  lng: number;
}

// Примерные координаты города: 40°59′52″ с. ш. 71°14′25″ в. д.
// Перевод в десятичный формат:
// 40 + 59/60 + 52/3600 ≈ 40.9978
// 71 + 14/60 + 25/3600 ≈ 71.2403
const CITY_CENTER = {
  lat: 40.9978,
  lng: 71.2403,
};

// Простые примеры объявлений с координатами рядом с центром города
const SAMPLE_LISTINGS: UyJoyListing[] = [
  {
    id: '1',
    title: 'Аренда торгового помещения 50 м²',
    type: 'rent',
    price: '$500 / месяц',
    address: 'Центр города, рядом с рынком',
    description: 'Проходное место, идеально для магазина или кофейни.',
    lat: CITY_CENTER.lat + 0.01,
    lng: CITY_CENTER.lng,
  },
  {
    id: '2',
    title: 'Продажа помещения 120 м²',
    type: 'sale',
    price: '$85 000',
    address: 'Жилой массив, 1-й этаж',
    description: 'Отдельный вход, есть парковка перед домом.',
    lat: CITY_CENTER.lat - 0.008,
    lng: CITY_CENTER.lng + 0.012,
  },
  {
    id: '3',
    title: 'Аренда офиса 30 м²',
    type: 'rent',
    price: '$300 / месяц',
    address: 'Деловой центр города',
    description: 'Светлый офис, кондиционер, быстрый интернет.',
    lat: CITY_CENTER.lat + 0.005,
    lng: CITY_CENTER.lng - 0.015,
  },
];

export default function UyJoyMap() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // уже инициализировано

    // Инициализируем карту
    const map = L.map(mapContainerRef.current).setView(
      [CITY_CENTER.lat, CITY_CENTER.lng],
      13
    );
    mapInstanceRef.current = map;

    // Подключаем слой тайлов OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Добавляем маркеры для объявлений (круги вместо дефолтных иконок)
    SAMPLE_LISTINGS.forEach((item) => {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: 10,
        color: '#f97316', // оранжевый
        weight: 2,
        fillColor: '#fb923c',
        fillOpacity: 0.9,
      }).addTo(map);

      const popupHtml = `
        <div style="min-width: 180px;">
          <div style="font-weight: 600; margin-bottom: 4px;">${item.title}</div>
          <div style="font-weight: 600; color: #16a34a; margin-bottom: 4px;">${item.price}</div>
          <div style="font-size: 12px; margin-bottom: 4px;">📍 ${item.address}</div>
          ${
            item.description
              ? `<div style="font-size: 11px; color: #6b7280;">${item.description}</div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}

