// ============================================
// Pharmacy/Store Card Component
// ============================================

'use client';

interface PharmacyStore {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  working_hours: any;
  is_active: boolean;
}

interface PharmacyStoreCardProps {
  pharmacyStore: PharmacyStore;
}

export default function PharmacyStoreCard({ pharmacyStore }: PharmacyStoreCardProps) {
  const handleCall = () => {
    window.location.href = `tel:${pharmacyStore.phone}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-4">
      {/* Название */}
      <h3 className="text-lg font-bold text-gray-900 mb-2">{pharmacyStore.name}</h3>

      {/* Описание */}
      {pharmacyStore.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{pharmacyStore.description}</p>
      )}

      {/* Время работы */}
      {pharmacyStore.working_hours && (
        <div className="text-xs text-gray-500 mb-2">
          {(() => {
            const today = new Date();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDay = dayNames[today.getDay()];
            const todayHours = pharmacyStore.working_hours[currentDay];
            return todayHours ? (
              <p><span className="font-medium">Bugun:</span> {todayHours}</p>
            ) : null;
          })()}
        </div>
      )}

      {/* Телефон и кнопка звонка */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{pharmacyStore.phone}</p>
        <button
          onClick={handleCall}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm flex items-center gap-2"
        >
          📞 Qo'ng'iroq qilish
        </button>
      </div>
    </div>
  );
}

