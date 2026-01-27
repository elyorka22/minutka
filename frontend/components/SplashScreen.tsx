// ============================================
// Splash Screen Component
// ============================================

'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Показываем splash screen минимум 2 секунды
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Небольшая задержка для плавного исчезновения
      setTimeout(() => {
        onFinish();
      }, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

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

