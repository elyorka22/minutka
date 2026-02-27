// ============================================
// Image Upload Component
// Компонент для загрузки изображений с компьютера или телефона
// ============================================

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { shouldUnoptimizeImage } from '@/lib/imageUtils';

interface ImageUploadProps {
  value: string; // Текущий URL изображения
  onChange: (url: string) => void; // Callback при изменении
  folder?: string; // Папка для загрузки: 'banners', 'categories', 'restaurants', 'menu'
  label?: string;
  required?: boolean;
  className?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// Максимальный размер картинки по большей стороне (в пикселях),
// до которого мы уменьшаем изображение перед загрузкой.
const MAX_IMAGE_DIMENSION = 1400;

// Перекодируем картинку в JPEG/WebP меньшего размера перед загрузкой,
// чтобы ускорить её последующую загрузку на сайте.
async function resizeImageIfNeeded(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        try {
          const width = image.width;
          const height = image.height;

          // Если картинка и так небольшая — ничего не делаем
          const maxSide = Math.max(width, height);
          if (maxSide <= MAX_IMAGE_DIMENSION) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }

          const scale = MAX_IMAGE_DIMENSION / maxSide;
          const targetWidth = Math.round(width * scale);
          const targetHeight = Math.round(height * scale);

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            resolve(file);
            return;
          }

          ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(url);
              if (!blob) {
                resolve(file);
                return;
              }

              const optimizedFile = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { type: 'image/jpeg' }
              );

              console.log('[ImageUpload] Original size:', file.size, 'Optimized size:', optimizedFile.size);
              resolve(optimizedFile);
            },
            'image/jpeg',
            0.8
          );
        } catch (err) {
          URL.revokeObjectURL(url);
          console.error('[ImageUpload] resizeImageIfNeeded error:', err);
          resolve(file);
        }
      };

      image.onerror = (err) => {
        URL.revokeObjectURL(url);
        console.error('[ImageUpload] Failed to load image for resize:', err);
        resolve(file);
      };

      image.src = url;
    } catch (error) {
      console.error('[ImageUpload] resizeImageIfNeeded unexpected error:', error);
      resolve(file);
    }
  });
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  label = 'Изображение',
  required = false,
  className = '',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Жёсткий лимит размера (например, 10MB), чтобы не принимать совсем огромные файлы
    if (file.size > 10 * 1024 * 1024) {
      alert('Размер изображения не должен превышать 10MB');
      return;
    }

    // Показываем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем на сервер
    setUploading(true);
    try {
      // Уменьшаем изображение перед загрузкой, если оно слишком большое
      const uploadFile = await resizeImageIfNeeded(file);

      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('folder', folder);

      console.log('[ImageUpload] Uploading image:', {
        fileName: uploadFile.name,
        fileSize: uploadFile.size,
        fileType: uploadFile.type,
        folder: folder,
        apiUrl: `${API_BASE_URL}/api/upload/image`
      });

      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
        // Не устанавливаем Content-Type вручную - браузер сделает это автоматически с правильным boundary
      });

      console.log('[ImageUpload] Response status:', response.status);
      console.log('[ImageUpload] Response headers:', Object.fromEntries(response.headers.entries()));

      // Проверяем, является ли ответ JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ImageUpload] Non-JSON response:', text);
        throw new Error(`Сервер вернул неожиданный ответ: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[ImageUpload] Response data:', data);

      if (!response.ok || !data.success) {
        const errorMessage = data.error || data.message || 'Ошибка загрузки изображения';
        const errorDetails = data.details ? `\nДетали: ${JSON.stringify(data.details)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      if (!data.data || !data.data.url) {
        throw new Error('Сервер не вернул URL изображения');
      }

      // Обновляем значение
      onChange(data.data.url);
      setPreview(data.data.url);
      console.log('[ImageUpload] Image uploaded successfully:', data.data.url);
    } catch (error: any) {
      console.error('[ImageUpload] Error uploading image:', error);
      console.error('[ImageUpload] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      const errorMessage = error.message || 'Ошибка загрузки изображения';
      alert(`Ошибка загрузки изображения:\n${errorMessage}`);
      setPreview(value || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Превью изображения */}
      {preview && (
        <div className="mb-4 relative w-full h-48 rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            onError={() => setPreview(null)}
            unoptimized={shouldUnoptimizeImage(preview)}
          />
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              ✕ Удалить
            </button>
          )}
        </div>
      )}

      {/* Кнопка загрузки */}
      <div className="flex items-center gap-4">
        <label className="flex-1 cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors text-center">
            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                <span>Загрузка...</span>
              </div>
            ) : (
              <div className="text-gray-600">
                <span className="text-primary-500 font-semibold">📤 Нажмите для загрузки</span>
                <span className="block text-sm mt-1">или перетащите изображение сюда</span>
                <span className="block text-xs text-gray-400 mt-1">JPG, PNG, WEBP до 5MB</span>
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Поле для URL (опционально, для ручного ввода) */}
      <div className="mt-4">
        <label className="block text-xs text-gray-500 mb-1">
          Или введите URL изображения:
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPreview(e.target.value || null);
          }}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}


