// ============================================
// Backend API Server
// Express + TypeScript
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import restaurantsRouter from './routes/restaurants';
import ordersRouter from './routes/orders';
import bannersRouter from './routes/banners';
import botSettingsRouter from './routes/botSettings';
import chefsRouter from './routes/chefs';
import menuRouter from './routes/menu';
import restaurantAdminsRouter from './routes/restaurant-admins';
import superAdminsRouter from './routes/super-admins';
import uploadRouter from './routes/upload';
import usersRouter from './routes/users';
import statsRouter from './routes/stats';
import authRouter from './routes/auth';
import cleanupRouter from './routes/cleanup';
import pharmaciesStoresRouter from './routes/pharmacies-stores';
import pharmacyStoreCategoryRelationsRouter from './routes/pharmacy-store-category-relations';
import couriersRouter from './routes/couriers';
import menuViewsRouter from './routes/menuViews';
import storeCategoriesRouter from './routes/storeCategories';
import storeCarouselsRouter from './routes/storeCarousels';
import { generalLimiter, strictLimiter, createUpdateLimiter } from './middleware/rateLimit';
import { bigIntSerializerMiddleware } from './middleware/bigintSerializer';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Разрешаем запросы без origin (например, Postman, мобильные приложения)
    if (!origin) {
      return callback(null, true);
    }

    // Разрешаем localhost для разработки
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Разрешаем все Vercel домены (production и preview)
    if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // Разрешаем конкретный домен из переменной окружения
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // По умолчанию разрешаем (можно изменить на callback(new Error('Not allowed by CORS'), false) для строгой проверки)
    callback(null, true);
  },
  credentials: true
};

// Trust proxy - необходимо для работы за прокси (Vercel, nginx и т.д.)
// Это позволяет express-rate-limit правильно определять IP адреса клиентов
// Указываем количество прокси-серверов (1 для большинства случаев)
app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// BigInt serialization middleware - должен быть перед rate limiting
app.use(bigIntSerializerMiddleware);

// Rate limiting - применяется ко всем запросам
app.use(generalLimiter);

// Health check (без rate limiting)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/bot-settings', botSettingsRouter);
app.use('/api/chefs', chefsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/restaurant-admins', restaurantAdminsRouter);
app.use('/api/super-admins', superAdminsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/users', usersRouter);
app.use('/api/stats', statsRouter);
app.use('/api/auth', authRouter);
app.use('/api/cleanup', cleanupRouter);
app.use('/api/pharmacies-stores', pharmaciesStoresRouter);
app.use('/api/pharmacy-store-category-relations', pharmacyStoreCategoryRelationsRouter);
app.use('/api/couriers', couriersRouter);
app.use('/api/menu-views', menuViewsRouter);
app.use('/api/store-categories', storeCategoriesRouter);
app.use('/api/store-carousels', storeCarouselsRouter);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

