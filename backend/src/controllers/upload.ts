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
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Изображение не предоставлено'
      });
    }

    const file = req.file;
    const { folder } = req.body; // Опциональная папка: 'banners', 'categories', 'restaurants', 'menu'

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${folder || 'uploads'}/${timestamp}-${randomString}.${fileExtension}`;

    // Загружаем файл в Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      return res.status(500).json({
        success: false,
        error: 'Ошибка загрузки изображения',
        message: error.message
      });
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    res.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        path: fileName
      }
    });
  } catch (error: any) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка загрузки изображения',
      message: error.message
    });
  }
}



