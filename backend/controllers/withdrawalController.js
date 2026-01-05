import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import WithdrawalCommissionTier from '../models/WithdrawalCommissionTier.js';
import { generateTransactionId } from '../utils/helpers.js';
import { sendSMS } from '../utils/sms.js';
import { getIO } from '../utils/socket.js';

export const requestWithdrawalFromUser = async (req, res) => {
  try {
    const { userPhone, amount } = req.body;
    const agentId = req.userId;

    const agent = await User.findByPk(agentId);
    if (!agent || agent.role !== 'agent') {
      return res.status(400).json({ message: 'Only agents can request withdrawals' });
    }

    const user = await User.findOne({ where: { phone: userPhone } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    if (user.balance < parsedAmount) {
      return res.status(400).json({ message: 'User has insufficient balance' });
    }

    // Get commission — use tiered commission
    let agentCommissionPercent = 0;
    let companyCommissionPercent = 0;

    try {
      const applicableTier = await WithdrawalCommissionTier.findOne({
        where: {
          minAmount: { [Op.lte]: parsedAmount },
          maxAmount: { [Op.gte]: parsedAmount }
        },
        order: [['minAmount', 'ASC']]
      });

      if (applicableTier) {
        agentCommissionPercent = parseFloat(applicableTier.agentPercent) || 0;
        companyCommissionPercent = parseFloat(applicableTier.companyPercent) || 0;
      } else {
        // Only use defaults if no tiered commission record exists at all
        // Default tiered commission for withdrawals: ranges
        const defaultTiers = [
          { minAmount: 0, maxAmount: 99, agentPercent: 0, companyPercent: 0 },
          { minAmount: 100, maxAmount: 499, agentPercent: 1, companyPercent: 0.5 },
          { minAmount: 500, maxAmount: 999, agentPercent: 1.5, companyPercent: 0.5 },
          { minAmount: 1000, maxAmount: Infinity, agentPercent: 2, companyPercent: 1 }
        ];
        const applicableTier = defaultTiers
          .find(t => (parseFloat(t.minAmount) || 0) <= parsedAmount && parsedAmount <= (parseFloat(t.maxAmount) || Infinity));
        
        if (applicableTier) {
          agentCommissionPercent = applicableTier.agentPercent || 0;
          companyCommissionPercent = applicableTier.companyPercent || 0;
        }
      }
      // If tieredDoc exists but has empty withdrawalTiers array, commission remains 0 (no commission)
    } catch (err) {
      console.error('Failed to fetch tiered commission for withdrawal:', err);
    }

    const agentCommissionAmount = parseFloat(((parsedAmount * agentCommissionPercent) / 100).toFixed(2)) || 0;
    const companyCommissionAmount = parseFloat(((parsedAmount * companyCommissionPercent) / 100).toFixed(2)) || 0;

    // Create withdrawal request (pending user approval)
    const request = await WithdrawalRequest.create({
      agentId: agentId,
      userId: user.id,
      amount: parsedAmount,
      agentCommission: agentCommissionAmount,
      agentCommissionPercent: agentCommissionPercent,
      companyCommission: companyCommissionAmount,
      companyCommissionPercent: companyCommissionPercent,
      status: 'pending'
    });

    // Notify user of withdrawal request
    const totalCost = parsedAmount + agentCommissionAmount + companyCommissionAmount;
    const notification = await Notification.create({
      recipientId: user.id,
      title: 'Withdrawal Request',
      message: `Agent ${agent.name} requested SSP ${parsedAmount} withdrawal. Total cost: SSP ${totalCost.toFixed(2)} (includes SSP ${agentCommissionAmount.toFixed(2)} agent fee + SSP ${companyCommissionAmount.toFixed(2)} service fee)`,
      type: 'withdrawal_request',
      relatedTransactionId: request.id
    });

    try {
      await sendSMS(user.phone, `MoneyPay: Agent ${agent.name} requested SSP ${parsedAmount} withdrawal. Total cost: SSP ${totalCost.toFixed(2)}. Please approve or reject.`);
    } catch (err) {
      console.error('SMS failed:', err);
    }

    res.json({
      message: 'Withdrawal request created',
      request: {
        _id: request._id,
        amount: request.amount,
        agentCommission: request.agentCommission,
        agentCommissionPercent: request.agentCommissionPercent,
        companyCommission: request.companyCommission,
        companyCommissionPercent: request.companyCommissionPercent,
        status: request.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveWithdrawalRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.userId;

    const request = await WithdrawalRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId !== parseInt(userId)) {
      return res.status(403).json({ message: 'Only the user can approve their withdrawal' });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({ 
        message: `Request has already been ${request.status}`,
        currentStatus: request.status
      });
    }

    // Get user and agent
    const user = await User.findByPk(userId);
    const agent = await User.findByPk(request.agentId);

    if (!user || !agent) {
      return res.status(404).json({ message: 'User or agent not found' });
    }

    // Check balance again (coerce DECIMAL strings to numbers)
    const parsedAmount = parseFloat(request.amount) || 0;
    const parsedAgentCommission = parseFloat(request.agentCommission) || 0;
    const parsedCompanyCommission = parseFloat(request.companyCommission) || 0;
    const userBalance = parseFloat(user.balance) || 0;
    const agentBalance = parseFloat(agent.balance) || 0;

    // User pays withdrawal amount + agent commission + company commission
    // Agent receives: amount + agentCommission (full commission)
    // Company gets: companyCommission
    const totalDebit = parsedAmount + parsedAgentCommission + parsedCompanyCommission;
    if (userBalance < totalDebit) {
      await request.update({
        status: 'rejected',
        rejectedAt: new Date()
      });
      return res.status(409).json({ message: 'User no longer has sufficient balance', currentBalance: userBalance, required: totalDebit });
    }

    // Process withdrawal: deduct from user (amount + commissions), credit agent with amount + agent commission
    user.balance = (userBalance - totalDebit).toFixed(2);
    agent.balance = (agentBalance + parsedAmount + parsedAgentCommission).toFixed(2);

    await user.save();
    await agent.save();

    // Create transaction record
    const transactionId = generateTransactionId();
    const transaction = await Transaction.create({
      transactionId,
      senderId: userId,
      receiverId: request.agentId,
      amount: request.amount,
      type: 'user_withdraw',
      status: 'completed',
      // legacy commission fields
      commission: request.commission || request.agentCommission || 0,
      commissionPercent: request.commissionPercent || request.agentCommissionPercent || 0,
      // agent-specific fields
      agentCommission: request.agentCommission || request.commission || 0,
      agentCommissionPercent: request.agentCommissionPercent || request.commissionPercent || 0,
      companyCommission: request.companyCommission || 0,
      companyCommissionPercent: request.companyCommissionPercent || 0,
      senderBalance: user.balance,
      receiverBalance: agent.balance
    });

    // Update request status
    request.status = 'approved';
    request.approvedAt = new Date();
    await request.save();

    // Create notifications
    const userNotif = await Notification.create({
      recipientId: userId,
      title: 'Withdrawal Approved',
      message: `Your withdrawal of SSP ${request.amount} to ${agent.name} has been approved`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    const agentNotif = await Notification.create({
      recipientId: request.agentId,
      title: 'Withdrawal Approved',
      message: `${user.name} approved your withdrawal request of SSP ${request.amount}`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    // Emit socket events
    try {
      const io = getIO();
      if (io) {
        io.to(`user-${userId}`).emit('balance-updated', {
          userId,
          balance: parseFloat(user.balance)
        });

        io.to(`user-${request.agentId}`).emit('balance-updated', {
          userId: request.agentId,
          balance: parseFloat(agent.balance)
        });

        io.to(`user-${userId}`).emit('new-notification', {
          recipientId: userId,
          title: userNotif.title,
          message: userNotif.message,
          type: userNotif.type
        });

        io.to(`user-${request.agentId}`).emit('new-notification', {
          recipientId: request.agentId,
          title: agentNotif.title,
          message: agentNotif.message,
          type: agentNotif.type
        });
      }
    } catch (err) {
      console.error('Socket emit failed:', err);
    }

    res.json({
      message: 'Withdrawal request approved',
      transaction: { id: transaction.id, transactionId, amount: request.amount }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectWithdrawalRequest = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const userId = req.userId;

    const request = await WithdrawalRequest.findByPk(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.userId !== parseInt(userId)) {
      return res.status(403).json({ message: 'Only the user can reject their withdrawal' });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({ 
        message: `Request has already been ${request.status}`,
        currentStatus: request.status
      });
    }

    await request.update({
      status: 'rejected',
      rejectedAt: new Date(),
      reason: reason
    });

    // Get user and agent for notification
    const user = await User.findByPk(userId);
    const agent = await User.findByPk(request.agentId);

    // Create notifications
    const userNotif = await Notification.create({
      recipientId: userId,
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request has been rejected`,
      type: 'system'
    });

    const agentNotif = await Notification.create({
      recipientId: request.agentId,
      title: 'Withdrawal Rejected',
      message: `${user.name} rejected your withdrawal request of SSP ${request.amount}`,
      type: 'system'
    });

    // Emit socket events
    try {
      const io = getIO();
      if (io) {
        io.to(`user-${userId}`).emit('new-notification', {
          recipient: userId,
          title: userNotif.title,
          message: userNotif.message,
          type: userNotif.type
        });

        io.to(`user-${request.agentId}`).emit('new-notification', {
          recipientId: request.agentId,
          title: agentNotif.title,
          message: agentNotif.message,
          type: agentNotif.type
        });
      }
    } catch (err) {
      console.error('Socket emit failed:', err);
    }

    res.json({ message: 'Withdrawal request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPendingWithdrawalRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const requests = await WithdrawalRequest.findAll({
      where: {
        userId: userId,
        status: 'pending'
      },
      include: [
        { model: User, as: 'agent', attributes: ['name', 'phone', 'agentId'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
