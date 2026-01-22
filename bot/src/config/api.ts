// ============================================
// Backend API Configuration
// ============================================

export const API_BASE_URL = process.env.API_BASE_URL || process.env.BACKEND_URL || 'http://localhost:3001';

/**
 * Выполнить запрос к Backend API
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}


