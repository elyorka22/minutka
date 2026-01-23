// ============================================
// Bot Settings Controller
// ============================================

import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

/**
 * Получить все настройки бота
 */
export async function getBotSettings(req: Request, res: Response) {
  try {
    const { data, error } = await supabase
      .from('bot_settings')
      .select('*')
      .order('key');

    if (error) {
      console.error('Error fetching bot settings:', error);
      return res.status(500).json({ error: 'Failed to fetch bot settings' });
    }

    res.json({ data });
  } catch (error: any) {
    console.error('Error in getBotSettings:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Обновить настройку бота
 */
export async function updateBotSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Проверяем существование настройки
    const { data: existing } = await supabase
      .from('bot_settings')
      .select('id')
      .eq('key', key)
      .single();

    if (existing) {
      // Обновляем существующую
      const { data, error } = await supabase
        .from('bot_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        console.error('Error updating bot setting:', error);
        return res.status(500).json({ error: 'Failed to update bot setting' });
      }

      res.json({ data });
    } else {
      // Создаем новую
      const { data, error } = await supabase
        .from('bot_settings')
        .insert({ key, value })
        .select()
        .single();

      if (error) {
        console.error('Error creating bot setting:', error);
        return res.status(500).json({ error: 'Failed to create bot setting' });
      }

      res.status(201).json({ data });
    }
  } catch (error: any) {
    console.error('Error in updateBotSetting:', error);
    res.status(500).json({ error: error.message });
  }
}



