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
    // Минимальное время показа splash screen - 1 секунда (стандарт)
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1000);

    // Анимация появления текста с небольшой задержкой
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 100);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(textTimer);
    };
  }, []);

  useEffect(() => {
    // Скрываем splash screen когда прошло минимум 1 секунда И данные загрузились
    if (minTimeElapsed && !isLoading) {
      setIsVisible(false);
      // Небольшая задержка для плавного исчезновения
      setTimeout(() => {
        onFinish();
      }, 500);
    }
  }, [minTimeElapsed, isLoading, onFinish]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 z-50 flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        {/* Иконка еды с анимацией */}
        <div
          className={`mb-6 transition-all duration-700 ease-out ${
            textVisible
              ? 'opacity-100 scale-100 rotate-0'
              : 'opacity-0 scale-50 rotate-12'
          }`}
        >
          <div className="text-8xl md:text-9xl">🍽️</div>
        </div>

        {/* Текст MINUTKA с анимацией */}
        <h1
          className={`text-6xl md:text-8xl font-extrabold text-white transition-all duration-700 ease-out ${
            textVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}
          style={{
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            letterSpacing: '0.1em',
          }}
        >
          MINUTKA
        </h1>

        {/* Подзаголовок с анимацией */}
        <p
          className={`mt-4 text-xl md:text-2xl text-orange-100 font-medium transition-all duration-700 ease-out delay-200 ${
            textVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          Ovqat yetkazib berish
        </p>

        {/* Индикатор загрузки */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${
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

