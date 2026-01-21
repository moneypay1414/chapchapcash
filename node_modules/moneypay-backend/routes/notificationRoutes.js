import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  sendNotificationToAll,
  sendNotificationToUser,
  deleteNotification
} from '../controllers/notificationController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getNotifications);
router.post('/mark-as-read', authMiddleware, markAsRead);
router.post('/mark-all-as-read', authMiddleware, markAllAsRead);
router.delete('/:notificationId', authMiddleware, deleteNotification);

router.post('/send-to-all', authMiddleware, adminMiddleware, sendNotificationToAll);
router.post('/send-to-user', authMiddleware, adminMiddleware, sendNotificationToUser);

export default router;
