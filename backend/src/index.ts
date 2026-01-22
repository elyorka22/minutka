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
import categoriesRouter from './routes/categories';
import chefsRouter from './routes/chefs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/banners', bannersRouter);
app.use('/api/bot-settings', botSettingsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/chefs', chefsRouter);

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

