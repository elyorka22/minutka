// ============================================
// Splash Screen Component
// ============================================

'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
  isLoading?: boolean;
}

export default function SplashScreen({ onFinish, isLoading = true }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Минимальное время показа splash screen - 1 секунда (стандарт)
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1000);

    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    // Скрываем splash screen когда прошло минимум 1 секунда И данные загрузились
    if (minTimeElapsed && !isLoading) {
      setIsVisible(false);
      // Небольшая задержка для плавного исчезновения
      setTimeout(() => {
        onFinish();
      }, 300);
    }
  }, [minTimeElapsed, isLoading, onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-orange-500 z-50 flex items-center justify-center transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <h1 className="text-6xl md:text-8xl font-bold text-white">
        MINUTKA
      </h1>
    </div>
  );
}

