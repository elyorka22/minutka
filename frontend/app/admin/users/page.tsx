// ============================================
// Admin Users Page - Управление пользователями
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { User } from '@/lib/types';

// Демо данные пользователей
const demoUsers: User[] = [
  {
    id: '1',
    telegram_id: 123456789,
    username: 'user1',
    first_name: 'Иван',
    last_name: 'Иванов',
    phone: '+7 (999) 123-45-67',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    telegram_id: 987654321,
    username: 'user2',
    first_name: 'Мария',
    last_name: 'Петрова',
    phone: '+7 (999) 234-56-78',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    telegram_id: 555666777,
    username: null,
    first_name: 'Алексей',
    last_name: 'Сидоров',
    phone: null,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUsers(demoUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.phone?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="text-center py-12">Загрузка пользователей...</div>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👥 Управление пользователями</h1>
        <div className="text-sm text-gray-600">
          Всего: <span className="font-semibold">{users.length}</span>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Поиск по имени, username или телефону..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base"
        />
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Имя
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Телефон
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата регистрации
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.username ? `@${user.username}` : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone || '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.telegram_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow-md p-4">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {user.first_name} {user.last_name}
              </h3>
              <div className="space-y-1 text-sm">
                {user.username && (
                  <p className="text-gray-600">👤 @{user.username}</p>
                )}
                {user.phone && (
                  <p className="text-gray-600">📞 {user.phone}</p>
                )}
                <p className="text-gray-500">🆔 {user.telegram_id}</p>
                <p className="text-gray-500 text-xs">
                  📅 {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Пользователи не найдены
        </div>
      )}
    </div>
  );
}

