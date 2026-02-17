import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';

// Получить все акции
export async function getPromotions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { is_active } = req.query;
    let query = supabase
      .from('promotions')
      .select('*')
      .order('display_order', { ascending: true });

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotions', message: error.message });
  }
}

// Получить акцию по ID
export async function getPromotionById(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotion', message: error.message });
  }
}

// Создать акцию
export async function createPromotion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can create promotions'
      });
    }

    const { name, description, image_url, discount_percent, display_order, is_active, start_date, end_date } = req.body;

    if (!name || !discount_percent) {
      return res.status(400).json({ success: false, error: 'Name and discount_percent are required' });
    }

    if (discount_percent < 1 || discount_percent > 100) {
      return res.status(400).json({ success: false, error: 'Discount percent must be between 1 and 100' });
    }

    const { data, error } = await supabase
      .from('promotions')
      .insert({
        name,
        description: description || null,
        image_url: image_url || null,
        discount_percent,
        display_order: display_order || 0,
        is_active: is_active !== undefined ? is_active : true,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to create promotion', message: error.message });
  }
}

// Обновить акцию
export async function updatePromotion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can update promotions'
      });
    }

    const { id } = req.params;
    const { name, description, image_url, discount_percent, display_order, is_active, start_date, end_date } = req.body;

    if (discount_percent !== undefined && (discount_percent < 1 || discount_percent > 100)) {
      return res.status(400).json({ success: false, error: 'Discount percent must be between 1 and 100' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (discount_percent !== undefined) updateData.discount_percent = discount_percent;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const { data, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({ success: false, error: 'Promotion not found' });
    }

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to update promotion', message: error.message });
  }
}

// Удалить акцию
export async function deletePromotion(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can delete promotions'
      });
    }

    const { id } = req.params;

    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Promotion deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ success: false, error: 'Failed to delete promotion', message: error.message });
  }
}

// Получить товары акции
export async function getPromotionItems(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { id } = req.params;

    const { data, error } = await supabase
      .from('promotion_items')
      .select(`
        *,
        menu_items (
          id,
          name,
          description,
          price,
          image_url,
          is_available,
          category,
          restaurant_id
        )
      `)
      .eq('promotion_id', id)
      .order('display_order', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error fetching promotion items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch promotion items', message: error.message });
  }
}

// Добавить товары к акции
export async function addPromotionItems(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can manage promotion items'
      });
    }

    const { id } = req.params;
    const { menu_item_ids } = req.body;

    if (!Array.isArray(menu_item_ids)) {
      return res.status(400).json({ success: false, error: 'menu_item_ids must be an array' });
    }

    // Если массив пустой, просто возвращаем пустой результат
    if (menu_item_ids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Удаляем существующие товары для этой акции
    await supabase
      .from('promotion_items')
      .delete()
      .eq('promotion_id', id);

    // Добавляем новые товары
    const itemsToInsert = menu_item_ids.map((menu_item_id: string, index: number) => ({
      promotion_id: id,
      menu_item_id,
      display_order: index,
    }));

    const { data, error } = await supabase
      .from('promotion_items')
      .insert(itemsToInsert)
      .select(`
        *,
        menu_items (
          id,
          name,
          description,
          price,
          image_url,
          is_available,
          category,
          restaurant_id
        )
      `);

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Error adding promotion items:', error);
    res.status(500).json({ success: false, error: 'Failed to add promotion items', message: error.message });
  }
}

// Удалить товар из акции
export async function removePromotionItem(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Only super admins can remove promotion items'
      });
    }

    const { id, itemId } = req.params;

    const { error } = await supabase
      .from('promotion_items')
      .delete()
      .eq('promotion_id', id)
      .eq('menu_item_id', itemId);

    if (error) {
      throw error;
    }

    res.json({ success: true, message: 'Promotion item removed successfully' });
  } catch (error: any) {
    console.error('Error removing promotion item:', error);
    res.status(500).json({ success: false, error: 'Failed to remove promotion item', message: error.message });
  }
}

