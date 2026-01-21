import express from 'express';
import { register, verifyPhone, login, getProfile, updateProfile, checkUserBalance } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify-phone', verifyPhone);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/check-balance', authMiddleware, checkUserBalance);

export default router;
