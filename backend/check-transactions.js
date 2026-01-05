import sequelize from './config/database.js';
import { Op } from 'sequelize';
import Transaction from './models/Transaction.js';
import User from './models/User.js';

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'name', 'phone', 'role', 'balance']
    });

    console.log('All users:');
    for (const user of users) {
      console.log(`ID: ${user.id}, Name: ${user.name}, Phone: ${user.phone}, Role: ${user.role}, Balance: ${user.balance}`);

      // Get transaction stats for this user
      const totalTransactions = await Transaction.count({
        where: {
          [Op.or]: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      });

      const totalSent = await Transaction.sum('amount', {
        where: { senderId: user.id }
      }) || 0;

      const totalReceived = await Transaction.sum('amount', {
        where: { receiverId: user.id }
      }) || 0;

      console.log(`  Transactions: ${totalTransactions}, Sent: ${totalSent}, Received: ${totalReceived}`);
    }

    console.log('\nTotal transactions in database:', await Transaction.count());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkData();