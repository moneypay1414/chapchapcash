import express from 'express';
import {
  requestWithdrawalFromUser,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  getPendingWithdrawalRequests
} from '../controllers/withdrawalController.js';
import { authMiddleware, notSuspended } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);
// Prevent suspended users/agents from using withdrawal endpoints
router.use(notSuspended);

router.post('/request', requestWithdrawalFromUser);
router.post('/approve', approveWithdrawalRequest);
router.post('/reject', rejectWithdrawalRequest);
router.get('/pending', getPendingWithdrawalRequests);

export default router;
