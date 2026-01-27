// ============================================
// Upload Routes
// ============================================

import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload';

const router = Router();

// Настройка multer для обработки файлов в памяти
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем только изображения
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  },
});

router.post('/image', upload.single('image'), uploadImage);

export default router;



