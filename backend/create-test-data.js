import sequelize from './config/database.js';
import { Op } from 'sequelize';
import Transaction from './models/Transaction.js';
import User from './models/User.js';

async function createTestData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Create test users if they don't exist
    const [user1, created1] = await User.findOrCreate({
      where: { phone: '1234567890' },
      defaults: {
        name: 'Test User 1',
        email: 'user1@test.com',
        phone: '1234567890',
        password: 'hashedpassword',
        balance: 1000,
        role: 'user'
      }
    });

    const [user2, created2] = await User.findOrCreate({
      where: { phone: '0987654321' },
      defaults: {
        name: 'Test User 2',
        email: 'user2@test.com',
        phone: '0987654321',
        password: 'hashedpassword',
        balance: 500,
        role: 'user'
      }
    });

    const [admin, createdAdmin] = await User.findOrCreate({
      where: { phone: '1111111111' },
      defaults: {
        name: 'Test Admin',
        email: 'admin@test.com',
        phone: '1111111111',
        password: 'hashedpassword',
        balance: 0,
        role: 'admin'
      }
    });

    console.log('Users created/found:', { user1: user1.id, user2: user2.id, admin: admin.id });

    // Create test transactions
    const transactions = [
      {
        transactionId: 'TXN001',
        senderId: user1.id,
        receiverId: user2.id,
        amount: 100,
        type: 'transfer',
        status: 'completed',
        description: 'Test transfer 1'
      },
      {
        transactionId: 'TXN002',
        senderId: user2.id,
        receiverId: user1.id,
        amount: 50,
        type: 'transfer',
        status: 'completed',
        description: 'Test transfer 2'
      },
      {
        transactionId: 'TXN003',
        senderId: user1.id,
        receiverId: user2.id,
        amount: 75,
        type: 'transfer',
        status: 'completed',
        description: 'Test transfer 3'
      }
    ];

    for (const txn of transactions) {
      await Transaction.findOrCreate({
        where: { transactionId: txn.transactionId },
        defaults: txn
      });
    }

    console.log('Test transactions created');

    // Test the stats calculation
    const totalTransactions = await Transaction.count({
      where: {
        [Op.or]: [
          { senderId: user1.id },
          { receiverId: user1.id }
        ]
      }
    });

    const totalSent = await Transaction.sum('amount', {
      where: { senderId: user1.id }
    }) || 0;

    const totalReceived = await Transaction.sum('amount', {
      where: { receiverId: user1.id }
    }) || 0;

    console.log('Stats for user1:', { totalTransactions, totalSent, totalReceived });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestData();