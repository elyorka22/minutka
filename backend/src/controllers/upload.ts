// ============================================
// Upload Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * POST /api/upload/image
 * Загрузить изображение в Supabase Storage
 * Body: FormData с полем 'image'
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    console.log('[uploadImage] Request received');
    console.log('[uploadImage] Content-Type:', req.headers['content-type']);
    console.log('[uploadImage] Has file:', !!req.file);
    console.log('[uploadImage] Body keys:', Object.keys(req.body));
    console.log('[uploadImage] Body folder:', req.body?.folder);

    if (!req.file) {
      console.error('[uploadImage] No file provided');
      return res.status(400).json({
        success: false,
        error: 'Изображение не предоставлено',
        details: 'req.file is undefined'
      });
    }

    const file = req.file;
    console.log('[uploadImage] File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferLength: file.buffer?.length
    });

    const { folder } = req.body; // Опциональная папка: 'banners', 'categories', 'restaurants', 'menu'
    console.log('[uploadImage] Folder:', folder || 'uploads');

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${folder || 'uploads'}/${timestamp}-${randomString}.${fileExtension}`;
    console.log('[uploadImage] Generated filename:', fileName);

    // Проверяем существование bucket
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('[uploadImage] Error listing buckets:', bucketsError);
    } else {
      console.log('[uploadImage] Available buckets:', buckets?.map(b => b.name));
      const imagesBucket = buckets?.find(b => b.name === 'images');
      if (!imagesBucket) {
        console.error('[uploadImage] Bucket "images" not found!');
        return res.status(500).json({
          success: false,
          error: 'Bucket "images" не найден в Supabase Storage',
          message: 'Пожалуйста, создайте bucket "images" в Supabase Dashboard → Storage'
        });
      }
      console.log('[uploadImage] Bucket "images" found:', imagesBucket);
    }

    // Загружаем файл в Supabase Storage
    console.log('[uploadImage] Uploading to Supabase Storage...');
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        // Кешируем изображения в браузере на 1 год (31536000 секунд)
        // Это сильно ускоряет повторную загрузку картинок при навигации по сайту
        cacheControl: '31536000',
      });

    if (error) {
      console.error('[uploadImage] Error uploading to Supabase Storage:', error);
      console.error('[uploadImage] Error details:', JSON.stringify(error, null, 2));
      
      // Более детальная обработка ошибок Supabase
      let errorMessage = 'Ошибка загрузки изображения';
      if (error.message) {
        errorMessage = error.message;
      }
      
      // Проверяем специфичные ошибки
      if (error.message?.includes('Bucket not found')) {
        errorMessage = 'Bucket "images" не найден. Пожалуйста, создайте его в Supabase Dashboard → Storage';
      } else if (error.message?.includes('new row violates row-level security')) {
        errorMessage = 'Ошибка прав доступа. Проверьте настройки RLS для Storage';
      } else if (error.message?.includes('duplicate')) {
        errorMessage = 'Файл с таким именем уже существует';
      }
      
      return res.status(500).json({
        success: false,
        error: errorMessage,
        message: error.message,
        details: error
      });
    }

    console.log('[uploadImage] File uploaded successfully:', data?.path);

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    console.log('[uploadImage] Public URL:', urlData.publicUrl);

    res.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: fileName
      }
    });
  } catch (error: any) {
    console.error('[uploadImage] Unexpected error:', error);
    console.error('[uploadImage] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки изображения',
      message: error.message,
      details: error.toString()
    });
  }
}



