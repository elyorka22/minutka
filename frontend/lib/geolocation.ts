// ============================================
// Geolocation Utilities
// ============================================

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  address?: string;
  error?: string;
}

/**
 * Получить текущую геолокацию пользователя через HTML5 Geolocation API
 */
export async function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        error: 'Geolokatsiya qo\'llab-quvvatlanmaydi. Brauzeringizni yangilang yoki boshqa brauzer ishlating.',
      });
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true, // Используем GPS если доступен
      timeout: 10000, // Таймаут 10 секунд
      maximumAge: 0, // Не использовать кэшированные данные
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Получаем адрес через reverse geocoding
        try {
          const address = await reverseGeocode(latitude, longitude);
          resolve({
            latitude,
            longitude,
            address,
          });
        } catch (error) {
          // Если reverse geocoding не удался, возвращаем только координаты
          resolve({
            latitude,
            longitude,
            address: `${latitude}, ${longitude}`,
          });
        }
      },
      (error) => {
        let errorMessage = 'Geolokatsiyani aniqlab bo\'lmadi.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Geolokatsiya ruxsati rad etildi. Iltimos, brauzer sozlamalarida ruxsat bering.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Geolokatsiya ma\'lumotlari mavjud emas.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Geolokatsiya so\'rovi vaqti tugadi. Qayta urinib ko\'ring.';
            break;
        }
        
        reject({
          error: errorMessage,
        });
      },
      options
    );
  });
}

/**
 * Reverse geocoding - преобразование координат в адрес
 * Использует бесплатный Nominatim API (OpenStreetMap)
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    // Используем Nominatim API (OpenStreetMap) - бесплатно, без API ключа
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Minutka Delivery App', // Требуется Nominatim
      },
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Формируем адрес из данных
    const address = data.address;
    if (!address) {
      return `${latitude}, ${longitude}`;
    }

    // Формируем читаемый адрес
    const addressParts: string[] = [];
    
    // Добавляем компоненты адреса в порядке приоритета
    if (address.road) addressParts.push(address.road);
    if (address.house_number) addressParts.push(address.house_number);
    if (address.suburb || address.neighbourhood) {
      addressParts.push(address.suburb || address.neighbourhood);
    }
    if (address.city || address.town || address.village) {
      addressParts.push(address.city || address.town || address.village);
    }
    if (address.state) addressParts.push(address.state);
    if (address.country) addressParts.push(address.country);

    return addressParts.join(', ') || `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Возвращаем координаты если не удалось получить адрес
    return `${latitude}, ${longitude}`;
  }
}

/**
 * Проверка поддержки геолокации в браузере
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator;
}

