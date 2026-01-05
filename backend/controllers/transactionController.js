import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { generateTransactionId } from '../utils/helpers.js';
import { sendSMS, sendTransactionSMS } from '../utils/sms.js';
import { getIO } from '../utils/socket.js';
import SendMoneyCommissionTier from '../models/SendMoneyCommissionTier.js';
import WithdrawalCommissionTier from '../models/WithdrawalCommissionTier.js';

export const sendMoney = async (req, res) => {
  try {
    const { recipientPhone, description } = req.body;
    const amount = parseFloat(req.body.amount);
    const sender = await User.findByPk(req.userId);

    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // fetch company commission percent for send — use tiered commission
    let companyPercent = 0;
    const applicableTier = await SendMoneyCommissionTier.findOne({
      where: {
        minAmount: { [Op.lte]: amount },
        maxAmount: { [Op.gte]: amount }
      },
      order: [['minAmount', 'ASC']]
    });

    if (applicableTier) {
      companyPercent = parseFloat(applicableTier.companyPercent) || 0;
    } else {
      // Default tiered commission: ranges for send-money
      const defaultTiers = [
        { minAmount: 0, maxAmount: 99, companyPercent: 0 },
        { minAmount: 100, maxAmount: 499, companyPercent: 1 },
        { minAmount: 500, maxAmount: 999, companyPercent: 2 },
        { minAmount: 1000, maxAmount: Infinity, companyPercent: 3 }
      ];
      const defaultTier = defaultTiers
        .find(t => (parseFloat(t.minAmount) || 0) <= amount && amount <= (parseFloat(t.maxAmount) || Infinity));
      companyPercent = defaultTier ? defaultTier.companyPercent : 0;
    }
    // If tieredDoc exists but has empty tiers array, companyPercent remains 0 (no commission)
    const companyCommission = parseFloat(((amount * companyPercent) / 100).toFixed(2)) || 0;

    if (parseFloat(sender.balance) < amount + companyCommission) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const recipient = await User.findOne({ where: { phone: recipientPhone } });
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Restrict normal users from sending to agents or admins
    if (sender.role === 'user' && recipient.role && recipient.role !== 'user') {
      return res.status(400).json({ message: "You can't send money to this person" });
    }

    const transactionId = generateTransactionId();
    const senderPreviousBalance = parseFloat(sender.balance);
    const receiverPreviousBalance = parseFloat(recipient.balance);

    // Update balances (sender pays company fee in addition to amount)
    sender.balance = senderPreviousBalance - (amount + companyCommission);
    recipient.balance = receiverPreviousBalance + amount;

    await sender.save();
    await recipient.save();

    // Create transaction record
    const transaction = await Transaction.create({
      transactionId,
      senderId: req.userId,
      receiverId: recipient.id,
      amount,
      type: 'transfer',
      status: 'completed',
      description,
      senderBalance: sender.balance,
      receiverBalance: recipient.balance,
      senderLocation: sender.currentLocation || null,
      receiverLocation: recipient.currentLocation || null,
      companyCommission,
      companyCommissionPercent: companyPercent
    });

    // Create notifications
    const senderNotif = await Notification.create({
      recipientId: req.userId,
      title: 'Money Sent',
      message: `You sent SSP ${amount} to ${recipient.phone}`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    const receiverNotif = await Notification.create({
      recipientId: recipient.id,
      title: 'Money Received',
      message: `You received SSP ${amount} from ${sender.phone}`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    // Send SMS
    try {
      await sendSMS(sender.phone, `MoneyPay: You sent SSP ${amount} to ${recipient.phone}. TX: ${transactionId}`);
      await sendSMS(recipient.phone, `MoneyPay: You received SSP ${amount} from ${sender.phone}. TX: ${transactionId}`);
    } catch (error) {
      console.error('SMS failed:', error);
    }

    // Emit real-time events: notifications and balance updates for sender and recipient
    try {
      const io = getIO();
      if (io) {
        // Sender notification + balance update
        io.to(`user-${req.userId}`).emit('new-notification', {
          recipient: req.userId,
          title: 'Money Sent',
          message: `You sent SSP ${amount} to ${recipient.phone}`,
          type: 'transaction',
          relatedTransaction: transaction._id
        });

        io.to(`user-${req.userId}`).emit('balance-updated', {
          userId: req.userId,
          balance: parseFloat(sender.balance)
        });

        // Recipient notification + balance update
        io.to(`user-${recipient.id}`).emit('new-notification', {
          recipientId: recipient.id,
          title: 'Money Received',
          message: `You received SSP ${amount} from ${sender.phone}`,
          type: 'transaction',
          relatedTransactionId: transaction.id
        });

        io.to(`user-${recipient.id}`).emit('balance-updated', {
          userId: recipient.id,
          balance: parseFloat(recipient.balance)
        });
      } else {
        console.error('IO instance not available for sendMoney emits');
      }
    } catch (err) {
      console.error('Socket emit failed for sendMoney:', err);
    }

    res.json({
      message: 'Money sent successfully',
      transaction: {
        id: transaction.id,
        transactionId,
        amount,
        recipient: recipient.phone,
        status: 'completed'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const withdrawMoney = async (req, res) => {
  try {
    const { agentId } = req.body;
    const amount = parseFloat(req.body.amount);
    const user = await User.findByPk(req.userId);
    
    // Find agent by agentId field (6-digit string), not MongoDB _id
    const agent = await User.findOne({ where: { agentId } });

    if (!user || !agent) {
      return res.status(404).json({ message: 'User or agent not found' });
    }

    if (agent.role !== 'agent') {
      return res.status(400).json({ message: 'Invalid agent' });
    }

    // Get tiered withdrawal commission
    let commissionPercent = 0;
    let companyCommissionPercent = 0;

    try {
      const applicableTier = await WithdrawalCommissionTier.findOne({
        where: {
          minAmount: { [Op.lte]: amount },
          maxAmount: { [Op.gte]: amount }
        },
        order: [['minAmount', 'ASC']]
      });

      if (applicableTier) {
        commissionPercent = parseFloat(applicableTier.agentPercent) || 0;
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
          .find(t => (parseFloat(t.minAmount) || 0) <= amount && amount <= (parseFloat(t.maxAmount) || Infinity));

        if (applicableTier) {
          commissionPercent = applicableTier.agentPercent || 0;
          companyCommissionPercent = applicableTier.companyPercent || 0;
        }
      }
      // If tieredDoc exists but has empty withdrawalTiers array, commission remains 0 (no commission)
    } catch (err) {
      console.error('Failed to fetch tiered commission for withdrawal:', err);
    }

    const commissionAmount = parseFloat(((amount * commissionPercent) / 100).toFixed(2)) || 0;
    const companyCommissionAmount = parseFloat(((amount * companyCommissionPercent) / 100).toFixed(2)) || 0;

    const transactionId = generateTransactionId();

    // Deduct from user (amount + agent commission + company commission)
    const totalDebit = amount + commissionAmount + companyCommissionAmount;
    if (parseFloat(user.balance) < totalDebit) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance = parseFloat(user.balance) - totalDebit;
    // Agent receives the withdrawn amount plus their commission (company commission is separate)
    agent.balance = (parseFloat(agent.balance) || 0) + amount + commissionAmount;

    console.log(`Withdrawal: User ${user._id} withdrawing ${amount} to Agent ${agent._id}`);
    console.log(`User balance before save: ${user.balance}`);
    console.log(`Agent balance before save: ${agent.balance}`);

    // Save both documents
    await user.save();
    await agent.save();

    console.log(`User saved with balance: ${user.balance}`);
    console.log(`Agent saved with balance: ${agent.balance}`);

    const transaction = await Transaction.create({
      transactionId,
      senderId: req.userId,
      receiverId: agent.id,
      amount,
      type: 'user_withdraw',
      // legacy commission fields
      commission: commissionAmount,
      commissionPercent,
      // new agent-specific commission fields (for UI and receipts)
      agentCommission: commissionAmount,
      agentCommissionPercent: commissionPercent,
      companyCommission: companyCommissionAmount,
      companyCommissionPercent: companyCommissionPercent,
      status: 'completed',
      senderBalance: user.balance,
      receiverBalance: agent.balance,
      senderLocation: user.currentLocation || null,
      receiverLocation: agent.currentLocation || null
    });

    // Notifications
    const userNotif = await Notification.create({
      recipientId: req.userId,
      title: 'Withdrawal Initiated',
      message: `Withdrawal of SSP ${amount} initiated. Meet agent ${agent.name}`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    const agentNotif = await Notification.create({
      recipientId: agent.id,
      title: 'Withdrawal Request',
      message: `${user.name} requested withdrawal of SSP ${amount}`,
      type: 'transaction',
      relatedTransactionId: transaction.id
    });

    // Emit real-time events to both user and agent
    try {
      const io = getIO();
      if (io) {
        console.log(`Emitting balance-updated to user-${req.userId} with balance ${user.balance}`);
        console.log(`Emitting balance-updated to user-${agent._id} with balance ${agent.balance}`);

        // Notify user of withdrawal and update balance
        io.to(`user-${req.userId}`).emit('new-notification', {
          recipient: req.userId,
          title: userNotif.title,
          message: userNotif.message,
          type: userNotif.type,
          relatedTransaction: userNotif.relatedTransaction
        });

        io.to(`user-${req.userId}`).emit('balance-updated', {
          userId: req.userId,
          balance: parseFloat(user.balance)
        });

        // Notify agent of withdrawal request and update balance
        io.to(`user-${agent.id}`).emit('new-notification', {
          recipientId: agent.id,
          title: agentNotif.title,
          message: agentNotif.message,
          type: agentNotif.type,
          relatedTransactionId: agentNotif.relatedTransactionId
        });

        io.to(`user-${agent.id}`).emit('balance-updated', {
          userId: agent.id,
          balance: parseFloat(agent.balance)
        });
      } else {
        console.error('IO instance not available');
      }
    } catch (err) {
      console.error('Socket emit failed:', err);
    }

    res.json({
      message: 'Withdrawal initiated',
      transaction: { id: transaction.id, transactionId, amount }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { senderId: req.userId },
          { receiverId: req.userId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['name', 'phone'] },
        { model: User, as: 'receiver', attributes: ['name', 'phone'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTransactionStats = async (req, res) => {
  try {
    const userId = req.userId;

    // Calculate pending commissions from pending withdrawal requests
    const pendingAgentCommission = await WithdrawalRequest.sum('agentCommission', {
      where: {
        agentId: userId,
        status: 'pending'
      }
    }) || 0;

    const pendingCompanyCommission = await WithdrawalRequest.sum('companyCommission', {
      where: {
        agentId: userId,
        status: 'pending'
      }
    }) || 0;

    // Get transaction statistics using separate queries
    const totalTransactions = await Transaction.count({
      where: {
        [Op.or]: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    });

    const totalSent = await Transaction.sum('amount', {
      where: { senderId: userId }
    }) || 0;

    const totalReceived = await Transaction.sum('amount', {
      where: { receiverId: userId }
    }) || 0;

    // Calculate commission earned by agent from transactions where they received commission
    const commissionEarned = await Transaction.sum('agentCommission', {
      where: {
        receiverId: userId,
        status: 'completed',
        agentCommission: { [Op.gt]: 0 }
      }
    }) || 0;

    res.json({
      totalTransactions,
      totalSent: parseFloat(totalSent),
      totalReceived: parseFloat(totalReceived),
      withdrawalsCompletedCount: 0,
      withdrawalsCompletedAmount: 0,
      transfersCompletedCount: 0,
      transfersCompletedAmount: 0,
      transfersSentCount: 0,
      transfersSentAmount: 0,
      commissionEarned: parseFloat(commissionEarned),
      pullsReceivedAmount: 0,
      transfersReceivedAmount: 0,
      pendingAgentCommission,
      pendingCompanyCommission
    });
  } catch (error) {
    console.error('Transaction stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserInfo = async (req, res) => {
  try {
    const { phoneNumber } = req.params;

    const user = await User.findOne({ where: { phone: phoneNumber } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.name,
        phoneNumber: user.phone,
        balance: parseFloat(user.balance) || 0,
        email: user.email,
        userType: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
