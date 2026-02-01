// ============================================
// Pharmacies/Stores Management Page
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { getPharmaciesStores, createPharmacyStore, updatePharmacyStore, deletePharmacyStore } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { handleApiError } from '@/lib/errorHandler';

interface PharmacyStore {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  working_hours: {
    start_day?: string;
    end_day?: string;
    start_time?: string;
    end_time?: string;
    closed_days?: string[];
  } | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DAYS_OF_WEEK = [
  { key: 'Dushanba', label: 'Dushanba' },
  { key: 'Seshanba', label: 'Seshanba' },
  { key: 'Chorshanba', label: 'Chorshanba' },
  { key: 'Payshanba', label: 'Payshanba' },
  { key: 'Juma', label: 'Juma' },
  { key: 'Shanba', label: 'Shanba' },
  { key: 'Yakshanba', label: 'Yakshanba' },
];

export default function PharmaciesStoresPage() {
  const [pharmaciesStores, setPharmaciesStores] = useState<PharmacyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    working_hours: {
      start_day: '',
      end_day: '',
      start_time: '',
      end_time: '',
      closed_days: [] as string[],
    },
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchPharmaciesStores();
  }, []);

  const fetchPharmaciesStores = async () => {
    try {
      const data = await getPharmaciesStores();
      setPharmaciesStores(data);
    } catch (error) {
      console.error('Error fetching pharmacies/stores:', error);
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pharmacyStore: PharmacyStore) => {
    setEditing(pharmacyStore.id);
    const workingHours = pharmacyStore.working_hours || {
      start_day: '',
      end_day: '',
      start_time: '',
      end_time: '',
      closed_days: [],
    };
    setFormData({
      name: pharmacyStore.name,
      description: pharmacyStore.description || '',
      phone: pharmacyStore.phone,
      working_hours: {
        start_day: workingHours.start_day || '',
        end_day: workingHours.end_day || '',
        start_time: workingHours.start_time || '',
        end_time: workingHours.end_time || '',
        closed_days: workingHours.closed_days || [],
      },
      is_active: pharmacyStore.is_active,
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditing(null);
    setShowAddForm(false);
    setFormData({
      name: '',
      description: '',
      phone: '',
      working_hours: {
        start_day: '',
        end_day: '',
        start_time: '',
        end_time: '',
        closed_days: [],
      },
      is_active: true,
    });
  };

  const handleSave = async (id?: string) => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      showError('Название и телефон обязательны');
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await updatePharmacyStore(id, formData);
        showSuccess('Аптека/магазин успешно обновлен!');
      } else {
        await createPharmacyStore(formData);
        showSuccess('Аптека/магазин успешно создан!');
      }
      await fetchPharmaciesStores();
      handleCancel();
    } catch (error) {
      console.error('Error saving pharmacy/store:', error);
      showError(handleApiError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту аптеку/магазин?')) {
      return;
    }

    try {
      await deletePharmacyStore(id);
      showSuccess('Аптека/магазин успешно удален!');
      await fetchPharmaciesStores();
    } catch (error) {
      console.error('Error deleting pharmacy/store:', error);
      showError(handleApiError(error));
    }
  };

  const handleToggleActive = async (pharmacyStore: PharmacyStore) => {
    try {
      await updatePharmacyStore(pharmacyStore.id, { is_active: !pharmacyStore.is_active });
      showSuccess('Статус успешно обновлен!');
      await fetchPharmaciesStores();
    } catch (error) {
      console.error('Error toggling pharmacy/store:', error);
      showError(handleApiError(error));
    }
  };

  if (loading) {
    return <div className="text-center py-12">Загрузка аптек/магазинов...</div>;
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">💊 Dorixonalar / 🛒 Do'konlar</h1>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditing(null);
            setFormData({
              name: '',
              description: '',
              phone: '',
              working_hours: {
                start_day: '',
                end_day: '',
                start_time: '',
                end_time: '',
                closed_days: [],
              },
              is_active: true,
            });
          }}
          className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm sm:text-base"
        >
          + Добавить аптеку/магазин
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editing) && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
            {editing ? 'Редактировать аптеку/магазин' : 'Добавить новую аптеку/магазин'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="Например: Аптека №1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="+998901234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                rows={3}
                placeholder="Описание аптеки/магазина"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время работы
              </label>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      День начала работы
                    </label>
                    <select
                      value={formData.working_hours.start_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          working_hours: { ...formData.working_hours, start_day: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Tanlang</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.key} value={day.key}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      День окончания работы
                    </label>
                    <select
                      value={formData.working_hours.end_day}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          working_hours: { ...formData.working_hours, end_day: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="">Tanlang</option>
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.key} value={day.key}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время начала
                    </label>
                    <input
                      type="time"
                      value={formData.working_hours.start_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          working_hours: { ...formData.working_hours, start_time: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Время окончания
                    </label>
                    <input
                      type="time"
                      value={formData.working_hours.end_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          working_hours: { ...formData.working_hours, end_time: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Закрытые дни
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const isClosed = formData.working_hours.closed_days?.includes(day.key) || false;
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            const closedDays = formData.working_hours.closed_days || [];
                            const newClosedDays = isClosed
                              ? closedDays.filter((d) => d !== day.key)
                              : [...closedDays, day.key];
                            setFormData({
                              ...formData,
                              working_hours: { ...formData.working_hours, closed_days: newClosedDays },
                            });
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            isClosed
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Активна
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleSave(editing || undefined)}
                disabled={saving || !formData.name || !formData.phone}
                className="w-full sm:w-auto px-6 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {saving ? 'Сохранение...' : editing ? 'Сохранить изменения' : 'Создать'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacies/Stores List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {pharmaciesStores.map((pharmacyStore) => (
          <div
            key={pharmacyStore.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{pharmacyStore.name}</h3>
              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <p><span className="font-medium">Телефон:</span> {pharmacyStore.phone}</p>
                {pharmacyStore.description && (
                  <p className="line-clamp-2">{pharmacyStore.description}</p>
                )}
                {pharmacyStore.working_hours && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Время работы:</p>
                    {pharmacyStore.working_hours.start_day && pharmacyStore.working_hours.end_day && (
                      <p className="text-xs">
                        {pharmacyStore.working_hours.start_day} dan {pharmacyStore.working_hours.end_day} gacha
                        {pharmacyStore.working_hours.start_time && pharmacyStore.working_hours.end_time && (
                          <> {pharmacyStore.working_hours.start_time} dan {pharmacyStore.working_hours.end_time} gacha</>
                        )}
                      </p>
                    )}
                    {pharmacyStore.working_hours.closed_days && pharmacyStore.working_hours.closed_days.length > 0 && (
                      <p className="text-xs text-red-600">
                        Yopiq: {pharmacyStore.working_hours.closed_days.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                <p>Статус: {pharmacyStore.is_active ? '✅ Активна' : '❌ Неактивна'}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={() => handleEdit(pharmacyStore)}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors text-sm"
                >
                  ✏️ Редактировать
                </button>
                <button
                  onClick={() => handleToggleActive(pharmacyStore)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    pharmacyStore.is_active
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {pharmacyStore.is_active ? '⏸️' : '▶️'}
                </button>
                <button
                  onClick={() => handleDelete(pharmacyStore.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors text-sm"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {pharmaciesStores.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Dorixonalar/Do'konlar topilmadi. Birinchi dorixona/do'kon qo'shing.
        </div>
      )}
    </div>
  );
}

