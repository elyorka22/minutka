// ============================================
// Error Handler Utilities for Frontend
// ============================================

/**
 * Обрабатывает ошибки API и возвращает понятное сообщение для пользователя
 */
export function handleApiError(error: any): string {
  // Если это уже строка с сообщением
  if (typeof error === 'string') {
    return error;
  }

  // Если это объект ошибки с message
  if (error?.message) {
    // Проверяем, есть ли более детальное сообщение в response
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message;
  }

  // Если это объект с error полем
  if (error?.error) {
    return error.error;
  }

  // Если это response с данными
  if (error?.response?.data) {
    if (error.response.data.error) {
      return error.response.data.error;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
  }

  // Стандартные сообщения для кодов ошибок
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Неверные данные. Проверьте введенную информацию.';
      case 401:
        return 'Требуется авторизация. Пожалуйста, войдите в систему.';
      case 403:
        return 'Доступ запрещен. У вас нет прав для выполнения этого действия.';
      case 404:
        return 'Запрашиваемый ресурс не найден.';
      case 409:
        return 'Конфликт данных. Возможно, запись уже существует.';
      case 500:
        return 'Ошибка сервера. Пожалуйста, попробуйте позже.';
      case 503:
        return 'Сервис временно недоступен. Пожалуйста, попробуйте позже.';
      default:
        return `Ошибка ${error.response.status}. Пожалуйста, попробуйте позже.`;
    }
  }

  // Ошибка сети
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Превышено время ожидания. Проверьте подключение к интернету.';
  }

  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }

  // Общая ошибка
  return 'Произошла ошибка. Пожалуйста, попробуйте позже.';
}

/**
 * Показывает ошибку пользователю (toast или alert как fallback)
 */
export function showError(error: any, customMessage?: string): void {
  const message = customMessage || handleApiError(error);
  
  // В браузере пытаемся использовать toast, если доступен
  if (typeof window !== 'undefined') {
    // Проверяем, доступен ли ToastContext
    try {
      // Динамически импортируем useToast, если нужно
      // Но для простоты используем alert как fallback
      // Toast должен вызываться из компонентов через useToast hook
      alert(message);
    } catch {
      alert(message);
    }
  } else {
    console.error('Error:', message);
  }
}

/**
 * Логирует ошибку в консоль для отладки
 */
export function logError(error: any, context?: string): void {
  const message = handleApiError(error);
  const logMessage = context ? `[${context}] ${message}` : message;
  
  console.error('API Error:', logMessage);
  console.error('Error details:', error);
}

