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
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Минимальное время показа splash screen - 0.15 секунды
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 150);

    // Анимация появления текста с небольшой задержкой
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 30);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(textTimer);
    };
  }, []);

  useEffect(() => {
    // Скрываем splash screen когда прошло минимум 0.15 секунды И данные загрузились
    if (minTimeElapsed && !isLoading) {
      setIsVisible(false);
      // Небольшая задержка для плавного исчезновения
      setTimeout(() => {
        onFinish();
      }, 100);
    }
  }, [minTimeElapsed, isLoading, onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-white z-50 flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        {/* Текст MINUTKA с анимацией */}
        <h1
          className={`text-6xl md:text-8xl font-extrabold text-orange-500 transition-all duration-500 ease-out ${
            textVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}
          style={{
            letterSpacing: '0.1em',
          }}
        >
          MINUTKA
        </h1>

        {/* Индикатор загрузки - анимационные точки */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 bg-orange-500 rounded-full transition-all duration-300 ${
                  textVisible ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  animation: `pulse 1.5s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CSS для анимации пульсации */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

