// ============================================
// Menu Items Controller
// ============================================

import { Response } from 'express';
import { supabase } from '../config/supabase';
import { MenuItem } from '../types';
import { AuthenticatedRequest } from '../middleware/auth';
import { validatePrice, validateString, validateUrl, validateUuid } from '../utils/validation';

/**
 * GET /api/menu
 * Получить меню ресторана или товары по категории
 * Query params: 
 *   - restaurant_id (optional) - ID ресторана/магазина
 *   - category (optional) - название категории для фильтрации товаров из всех магазинов
 *   - include_unavailable (optional) - включать недоступные товары
 * Публичный доступ
 */
export async function getMenuItems(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, category, include_unavailable } = req.query;

    // Если запрашиваются товары главной страницы (is_main_page = true)
    if (req.query.main_page === 'true') {
      console.log('[MenuController] Fetching main page items');
      
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_main_page', true)
        .eq('is_banner', false); // Исключаем баннеры

      // Если не запрошены недоступные товары, фильтруем только доступные
      if (include_unavailable !== 'true') {
        query = query.eq('is_available', true);
      }

      const { data, error } = await query
        .order('name', { ascending: true });

      if (error) {
        console.error('[MenuController] Error fetching main page items:', error);
        throw error;
      }

      console.log('[MenuController] Found main page items:', data?.length || 0);
      res.json({ success: true, data: data || [] });
      return;
    }

    // Если указана категория, возвращаем товары этой категории из всех магазинов и главной страницы
    if (category && !restaurant_id) {
      console.log('[MenuController] Fetching items for category:', category);
      
      // Сначала получаем товары из магазинов
      let storeQuery = supabase
        .from('menu_items')
        .select(`
          *,
          restaurant:restaurants!menu_items_restaurant_id_fkey (
            id,
            name,
            type,
            image_url
          )
        `)
        .eq('category', category as string)
        .eq('is_banner', false)
        .is('is_main_page', false); // Исключаем товары главной страницы

      // Если не запрошены недоступные товары, фильтруем только доступные
      if (include_unavailable !== 'true') {
        storeQuery = storeQuery.eq('is_available', true);
      }

      const { data: storeData, error: storeError } = await storeQuery
        .order('name', { ascending: true });

      if (storeError) {
        console.error('[MenuController] Error fetching store items:', storeError);
        throw storeError;
      }

      // Фильтруем товары только из магазинов
      const storeItems = (storeData || []).filter((item: any) => 
        item.restaurant && item.restaurant.type === 'store'
      );

      // Теперь получаем товары главной страницы с этой категорией
      // Используем те же ID, но фильтруем по is_main_page = true
      let mainPageQuery = supabase
        .from('menu_items')
        .select('*')
        .in('id', allMenuItemIds)
        .eq('is_main_page', true)
        .eq('is_banner', false);

      if (include_unavailable !== 'true') {
        mainPageQuery = mainPageQuery.eq('is_available', true);
      }

      const { data: mainPageData, error: mainPageError } = await mainPageQuery
        .order('name', { ascending: true });

      if (mainPageError) {
        console.error('[MenuController] Error fetching main page items:', mainPageError);
        // Не прерываем выполнение, просто логируем ошибку
      }

      // Объединяем товары из магазинов и главной страницы
      const allItems = [
        ...storeItems,
        ...(mainPageData || []).map((item: any) => ({
          ...item,
          restaurant: null // Товары главной страницы не привязаны к магазину
        }))
      ];

      console.log('[MenuController] Found items:', allItems.length, 'for category:', category);
      res.json({ success: true, data: allItems });
      return;
    }

    // Если запрашиваются все товары без фильтров (для главной страницы)
    if (!restaurant_id && !category) {
      // Возвращаем только товары главной страницы
      let query = supabase
        .from('menu_items')
        .select('*')
        .eq('is_main_page', true)
        .eq('is_banner', false);

      if (include_unavailable !== 'true') {
        query = query.eq('is_available', true);
      }

      const { data, error } = await query
        .order('name', { ascending: true });

      if (error) {
        console.error('[MenuController] Error fetching all main page items:', error);
        throw error;
      }

      console.log('[MenuController] Found all main page items:', data?.length || 0);
      res.json({ success: true, data: data || [] });
      return;
    }

    // Старая логика: если указан restaurant_id
    if (!restaurant_id) {
      return res.status(400).json({ success: false, error: 'restaurant_id or category is required' });
    }

    let query = supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurant_id as string);

    // Если не запрошены недоступные блюда, фильтруем только доступные
    if (include_unavailable !== 'true') {
      query = query.eq('is_available', true);
    }

    const { data, error } = await query
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    res.json({ success: true, data: data as MenuItem[] });
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu items', message: error.message });
  }
}

/**
 * GET /api/menu/:id
 * Получить блюдо по ID
 * Публичный доступ
 */
export async function getMenuItemById(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Menu item not found' });
      }
      throw error;
    }

    res.json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch menu item', message: error.message });
  }
}

/**
 * POST /api/menu
 * Создать новое блюдо
 * Админ ресторана может создавать блюда только для своего ресторана
 */
export async function createMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { restaurant_id, name, description, price, category, image_url, is_available, is_banner, discount_percent, is_main_page } = req.body;

    // Валидация обязательных полей
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields: name, price' });
    }

    // Если is_main_page = true, то restaurant_id должен быть null
    if (is_main_page === true) {
      if (restaurant_id !== null && restaurant_id !== undefined) {
        return res.status(400).json({ success: false, error: 'Main page items cannot have restaurant_id' });
      }
      // Только супер-админы могут создавать товары главной страницы
      if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, error: 'Forbidden: Only super admins can create main page items' });
      }
    } else {
      // Если is_main_page = false или не указано, restaurant_id обязателен
      if (!restaurant_id) {
        return res.status(400).json({ success: false, error: 'Missing required field: restaurant_id' });
      }
      // Валидация типов и значений
      if (!validateUuid(restaurant_id)) {
        return res.status(400).json({ success: false, error: 'Invalid restaurant_id format' });
      }
    }

    if (!validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (!validatePrice(price)) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    if (description && !validateString(description, 0, 2000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 2000 characters' });
    }

    if (category && !validateString(category, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Category must be between 1 and 100 characters' });
    }

    if (image_url && !validateUrl(image_url)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL format' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Супер-админы могут создавать блюда для любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут создавать блюда только для своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only create menu items for your own restaurant'
        });
      }
      
      // Повары не могут создавать блюда
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot create menu items'
        });
      }
    }

    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        restaurant_id: is_main_page === true ? null : restaurant_id,
        name,
        description: description || null,
        price,
        category: category || null, // Категория опциональна (для обратной совместимости)
        image_url: image_url || null,
        is_available: is_available ?? true,
        is_banner: is_banner ?? false,
        is_main_page: is_main_page ?? false,
        discount_percent: discount_percent !== undefined ? (discount_percent === null || discount_percent === '' ? null : parseInt(discount_percent)) : null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Сохраняем связи с категориями, если передан массив categories
    if (req.body.categories && Array.isArray(req.body.categories) && req.body.categories.length > 0) {
      const relations = req.body.categories.map((categoryName: string) => ({
        menu_item_id: data.id,
        category_name: categoryName
      }));

      const { error: relationsError } = await supabase
        .from('menu_item_category_relations')
        .insert(relations);

      if (relationsError) {
        console.error('Error creating category relations:', relationsError);
        // Не прерываем выполнение, так как товар уже создан
      }
    }

    res.status(201).json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to create menu item', message: error.message });
  }
}

/**
 * PATCH /api/menu/:id
 * Обновить блюдо
 * Админ ресторана может обновлять блюда только своего ресторана
 */
export async function updateMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_available, is_banner, discount_percent, is_main_page } = req.body;
    
    // Логируем входящий запрос
    console.log('updateMenuItem called:', {
      menuItemId: id,
      userId: req.user?.telegram_id,
      userRole: req.user?.role,
      body: req.body,
      is_available
    });

    // Валидация ID
    if (!validateUuid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid menu item ID format' });
    }

    // Валидация полей если они переданы
    if (name !== undefined && !validateString(name, 1, 255)) {
      return res.status(400).json({ success: false, error: 'Name must be between 1 and 255 characters' });
    }

    if (description !== undefined && description !== null && !validateString(description, 0, 2000)) {
      return res.status(400).json({ success: false, error: 'Description must be less than 2000 characters' });
    }

    if (price !== undefined && !validatePrice(price)) {
      return res.status(400).json({ success: false, error: 'Price must be a positive number' });
    }

    if (category !== undefined && category !== null && !validateString(category, 1, 100)) {
      return res.status(400).json({ success: false, error: 'Category must be between 1 and 100 characters' });
    }

    if (image_url !== undefined && image_url !== null && !validateUrl(image_url)) {
      return res.status(400).json({ success: false, error: 'Invalid image URL format' });
    }

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о блюде для проверки restaurant_id
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Определяем, обновляется ли только is_available
    const onlyAvailabilityUpdate = 
      is_available !== undefined && 
      name === undefined && 
      description === undefined && 
      price === undefined && 
      category === undefined && 
      image_url === undefined &&
      is_banner === undefined;
    
    // Логируем для отладки
    console.log('updateMenuItem - Request details:', {
      menuItemId: id,
      userId: req.user?.telegram_id,
      userRole: req.user?.role,
      onlyAvailabilityUpdate,
      body: { is_available, is_banner, name, description, price, category, image_url }
    });

    // Супер-админы могут обновлять блюда любых ресторанов
    if (req.user.role === 'super_admin') {
      // Разрешаем все обновления для супер-админов
    }
    // Для restaurant_admin и chef: если обновляется is_available, разрешаем без проверок
    else if (req.user.role === 'restaurant_admin' || req.user.role === 'chef') {
      // Если обновляется is_available (независимо от других полей), разрешаем без проверок
      if (is_available !== undefined) {
        console.log(`Allowing is_available update for ${req.user.role}:`, {
          telegramId: req.user.telegram_id,
          menuItemId: id,
          is_available,
          userRestaurantId: req.user.restaurant_id,
          itemRestaurantId: menuItem.restaurant_id,
          bodyKeys: Object.keys(req.body)
        });
        // Разрешаем без проверок - просто продолжаем выполнение
      } 
      // Если is_available НЕ обновляется, но обновляются другие поля - проверяем права
      else if (name !== undefined || description !== undefined || price !== undefined || category !== undefined || image_url !== undefined || is_banner !== undefined) {
        // Для полного обновления (без is_available) используем строгую проверку
        if (!req.user.restaurant_id) {
          console.error(`${req.user.role} has no restaurant_id for full update`);
          return res.status(403).json({
            success: false,
            error: `Forbidden: ${req.user.role} has no restaurant_id assigned`
          });
        }
        
        const userRestaurantId = String(req.user.restaurant_id || '').trim().toLowerCase();
        const itemRestaurantId = String(menuItem.restaurant_id || '').trim().toLowerCase();
        
        console.log('Checking restaurant_id for full update:', {
          userRestaurantId,
          itemRestaurantId,
          match: userRestaurantId === itemRestaurantId
        });
        
        if (userRestaurantId !== itemRestaurantId) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: You can only update menu items of your own restaurant'
          });
        }
      }
      // Если ничего не обновляется - это странно, но разрешаем
    }
    // Если роль не определена или не разрешена
    else {
      console.error('Unauthorized role for menu update:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Unauthorized role'
      });
    }

    // Валидация discount_percent
    if (discount_percent !== undefined && discount_percent !== null) {
      const discount = Number(discount_percent);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return res.status(400).json({ success: false, error: 'Discount percent must be between 0 and 100' });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (category !== undefined) updateData.category = category;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (is_banner !== undefined) updateData.is_banner = is_banner;
    if (is_main_page !== undefined) {
      updateData.is_main_page = is_main_page;
      // Если is_main_page = true, то restaurant_id должен быть null
      if (is_main_page === true) {
        updateData.restaurant_id = null;
      }
    }
    if (discount_percent !== undefined) {
      updateData.discount_percent = discount_percent !== null ? Number(discount_percent) : null;
    }

    const { data, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Обновляем связи с категориями, если передан массив categories
    if (req.body.categories !== undefined) {
      // Удаляем все существующие связи
      await supabase
        .from('menu_item_category_relations')
        .delete()
        .eq('menu_item_id', id);

      // Создаем новые связи, если передан массив
      if (Array.isArray(req.body.categories) && req.body.categories.length > 0) {
        const relations = req.body.categories.map((categoryName: string) => ({
          menu_item_id: id,
          category_name: categoryName
        }));

        const { error: relationsError } = await supabase
          .from('menu_item_category_relations')
          .insert(relations);

        if (relationsError) {
          console.error('Error updating category relations:', relationsError);
          // Не прерываем выполнение, так как товар уже обновлен
        }
      }
    }

    res.json({ success: true, data: data as MenuItem });
  } catch (error: any) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to update menu item', message: error.message });
  }
}

/**
 * DELETE /api/menu/:id
 * Удалить блюдо
 * Админ ресторана может удалять блюда только своего ресторана
 */
export async function deleteMenuItem(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Проверка прав доступа
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Получаем информацию о блюде для проверки restaurant_id
    const { data: menuItem, error: menuItemError } = await supabase
      .from('menu_items')
      .select('restaurant_id')
      .eq('id', id)
      .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        success: false,
        error: 'Menu item not found'
      });
    }

    // Супер-админы могут удалять блюда любых ресторанов
    if (req.user.role !== 'super_admin') {
      // Админы ресторана могут удалять блюда только своего ресторана
      if (req.user.role === 'restaurant_admin' && req.user.restaurant_id !== menuItem.restaurant_id) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete menu items of your own restaurant'
        });
      }
      
      // Повары не могут удалять блюда
      if (req.user.role === 'chef') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Chefs cannot delete menu items'
        });
      }
    }

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete menu item', message: error.message });
  }
}


