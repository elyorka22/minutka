// ============================================
// Telegram Bot for Minutka
// ============================================

import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import { startHandler } from './handlers/start';
import { restaurantHandler } from './handlers/restaurant';
import { orderHandler } from './handlers/order';
import { locationHandler } from './handlers/location';
import { orderStatusHandler } from './handlers/orderStatus';
import { courierHandler, courierToggleActiveHandler } from './handlers/courier';
import { botInfoHandler, partnershipHandler, chatIdHandler } from './handlers/botInfo';
import { initBot as initRestaurantNotification } from './services/restaurantNotification';
import { initBot as initUserNotification } from './services/userNotification';
import { initBot as initAdminNotification } from './services/adminNotification';
import { createMainMenuKeyboard } from './keyboards/mainMenu';
import { createCourierMenuKeyboard } from './keyboards/courierMenu';
import { supabase } from './config/supabase';

// Load environment variables
dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Initialize notification services
initRestaurantNotification(bot);
initUserNotification(bot);
initAdminNotification(bot);

// Register handlers
bot.start(async (ctx) => {
  await startHandler(ctx);
  
  // Проверяем, является ли пользователь курьером, и показываем ему специальное меню
  const telegramId = ctx.from?.id;
  if (telegramId) {
    const { data: courier } = await supabase
      .from('couriers')
      .select('id, is_active')
      .eq('telegram_id', telegramId)
      .single();
    
    if (courier) {
      // Показываем меню курьера с reply keyboard
      const statusText = courier.is_active ? '✅ Faol' : '❌ Nofaol';
      const courierKeyboard = createCourierMenuKeyboard(courier.is_active);
      await ctx.reply(
        `🚚 *Kuryer paneli*\n\n` +
        `Holat: ${statusText}\n\n` +
        `${courier.is_active ? 'Siz buyurtmalarni olishingiz mumkin.' : 'Buyurtmalarni olish uchun faollashtiring.'}`,
        {
          parse_mode: 'Markdown',
          ...courierKeyboard
        }
      );
    }
  }
});
// Команда /restaurants удалена, так как рестораны доступны на сайте

// Callback query handlers (inline keyboard buttons)
bot.on('callback_query', async (ctx: Context) => {
  const data = (ctx.callbackQuery as any)?.data;
  
  if (!data) return;

  // Обработка выбора ресторана
  if (data.startsWith('restaurant:')) {
    await restaurantHandler(ctx, data.split(':')[1]);
    return;
  }

  // Обработка действий с заказом (для ресторанов)
  if (data.startsWith('order:')) {
    const [action, orderId] = data.split(':').slice(1);
    await orderStatusHandler(ctx, orderId, action);
    return;
  }

  // Обработка действий курьера
  if (data.startsWith('courier:')) {
    const parts = data.split(':');
    const action = parts[1];
    const orderId = parts[2]; // Может быть undefined для toggle_active
    await courierHandler(ctx, orderId || '', action);
    return;
  }
});

// Обработка текстовых сообщений (заказ, адрес или кнопки меню)
bot.on('text', async (ctx) => {
  const text = (ctx.message as any)?.text;
  
  // Проверяем, не является ли это кнопкой меню
  // Получаем актуальные тексты кнопок из БД для сравнения
  try {
    const { data: settings } = await supabase
      .from('bot_settings')
      .select('key, value')
      .in('key', ['button_bot_info_text', 'button_partnership_text']);

    const settingsMap: Record<string, string> = {};
    settings?.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    const botInfoText = settingsMap['button_bot_info_text'] || 'ℹ️ Bot haqida';
    const partnershipText = settingsMap['button_partnership_text'] || '🤝 Hamkorlik';

    if (text === botInfoText || text === 'ℹ️ Bot haqida') {
      await botInfoHandler(ctx);
      return;
    }
    
    if (text === partnershipText || text === '🤝 Hamkorlik') {
      await partnershipHandler(ctx);
      return;
    }
  } catch (error) {
    // Fallback на старые значения
    if (text === 'ℹ️ Bot haqida') {
      await botInfoHandler(ctx);
      return;
    }
    
    if (text === '🤝 Hamkorlik') {
      await partnershipHandler(ctx);
      return;
    }
  }
  
    if (text === '🆔 Chat ID') {
      await chatIdHandler(ctx);
      return;
    }
    
    // Обработка кнопок курьера
    if (text === '✅ Faollashtirish' || text === '❌ O\'chirish') {
      // Проверяем, является ли пользователь курьером
      const telegramId = ctx.from?.id;
      if (telegramId) {
        const { data: courier } = await supabase
          .from('couriers')
          .select('id')
          .eq('telegram_id', telegramId)
          .single();
        
        if (courier) {
          await courierToggleActiveHandler(ctx);
          return;
        }
      }
    }
  
    // Обычная обработка заказа/адреса
  const session = (ctx as any).session || {};
  // Если уже есть ресторан и заказ, то это адрес
  if (session.selectedRestaurantId && session.orderText) {
    await locationHandler(ctx);
  } else {
    // Иначе это описание заказа
    await orderHandler(ctx);
  }
});

// Обработка геолокации
bot.on('location', locationHandler);

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('Произошла ошибка. Попробуйте позже или начните заново: /start');
});

// Webhook mode (для production на Railway)
if (process.env.WEBHOOK_URL) {
  const port = process.env.PORT || 3002;
  bot.launch({
    webhook: {
      domain: process.env.WEBHOOK_URL,
      port: Number(port)
    }
  });
  console.log(`🤖 Bot running in webhook mode on port ${port}`);
} else {
  // Polling mode (для разработки)
  bot.launch();
  console.log('🤖 Bot running in polling mode');
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

