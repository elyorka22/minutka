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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-3 flex flex-col h-full">
      {/* Название */}
      <h3 className="text-base font-bold text-gray-900 mb-1.5 line-clamp-1">{pharmacyStore.name}</h3>

      {/* Описание */}
      {pharmacyStore.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2 flex-1">{pharmacyStore.description}</p>
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
              <p className="truncate"><span className="font-medium">Bugun:</span> {todayHours}</p>
            ) : null;
          })()}
        </div>
      )}

      {/* Телефон */}
      <div className="mb-2">
        <p className="text-xs text-gray-500 mb-0.5">Telefon:</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{pharmacyStore.phone}</p>
      </div>

      {/* Кнопка звонка - компактная */}
      <button
        onClick={handleCall}
        className="w-full mt-auto px-3 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors text-sm flex items-center justify-center gap-1.5"
      >
        <span>📞</span>
        <span>Qo'ng'iroq</span>
      </button>
    </div>
  );
}

