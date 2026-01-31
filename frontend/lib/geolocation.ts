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
 * Пытается получить максимально детальный адрес
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    // Используем Nominatim API с максимальной детализацией
    // zoom=18 - максимальная детализация для получения улиц и домов
    // addressdetails=1 - получить все детали адреса
    // extratags=1 - получить дополнительные теги
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&extratags=1&namedetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Minutka Delivery App', // Требуется Nominatim
        'Accept-Language': 'uz,ru,en', // Приоритет языков для Узбекистана
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

    // Формируем детальный адрес с приоритетом на улицу и дом
    const addressParts: string[] = [];
    
    // Приоритет 1: Улица и номер дома (самое важное)
    if (address.road || address.street || address.pedestrian) {
      const streetName = address.road || address.street || address.pedestrian;
      if (address.house_number) {
        addressParts.push(`${streetName}, ${address.house_number}`);
      } else if (address.house) {
        addressParts.push(`${streetName}, ${address.house}`);
      } else {
        addressParts.push(streetName);
      }
    }
    
    // Приоритет 2: Район, микрорайон, квартал
    if (address.suburb) {
      addressParts.push(address.suburb);
    } else if (address.neighbourhood) {
      addressParts.push(address.neighbourhood);
    } else if (address.quarter) {
      addressParts.push(address.quarter);
    }
    
    // Приоритет 3: Город, поселок, село
    if (address.city) {
      addressParts.push(address.city);
    } else if (address.town) {
      addressParts.push(address.town);
    } else if (address.village) {
      addressParts.push(address.village);
    }
    
    // Приоритет 4: Область/регион (только если нет детального адреса)
    if (addressParts.length === 0 && address.state) {
      addressParts.push(address.state);
    }
    
    // Приоритет 5: Страна (только если совсем нет данных)
    if (addressParts.length === 0 && address.country) {
      addressParts.push(address.country);
    }

    // Если получили только общие данные (город, область), добавляем подсказку
    const result = addressParts.join(', ') || `${latitude}, ${longitude}`;
    
    // Проверяем, есть ли детальная информация (улица или дом)
    const hasDetailedInfo = !!(address.road || address.street || address.house_number || address.house);
    
    if (!hasDetailedInfo && result !== `${latitude}, ${longitude}`) {
      // Если нет детальной информации, добавляем подсказку для пользователя
      return result + ' (ko\'cha va uy raqamini qo\'shing)';
    }

    return result;
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

