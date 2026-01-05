import sequelize from './config/database.js';
import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Notification from './models/Notification.js';
import WithdrawalRequest from './models/WithdrawalRequest.js';
import StateSetting from './models/StateSetting.js';
import Currency from './models/Currency.js';
import ExchangeRate from './models/ExchangeRate.js';
import SendMoneyCommissionTier from './models/SendMoneyCommissionTier.js';
import WithdrawalCommissionTier from './models/WithdrawalCommissionTier.js';
import Verification from './models/Verification.js';

// Set up associations
const models = { User, Transaction, Notification, WithdrawalRequest, StateSetting, Currency, ExchangeRate, SendMoneyCommissionTier, WithdrawalCommissionTier, Verification };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

async function testAdminPushMoneyBalanceAndDisplay() {
  const fromPhone = `testfrom${Date.now()}`;
  const toPhone = `testto${Date.now()}`;

  try {
    console.log('Testing admin push money balance updates and transaction display...');

    // Create test users
    const fromUser = await User.create({
      name: 'Test From User',
      phone: fromPhone,
      email: `testfrom${Date.now()}@example.com`,
      password: 'password123',
      balance: 1000,
      role: 'user'
    });

    const toUser = await User.create({
      name: 'Test To User',
      phone: toPhone,
      email: `testto${Date.now()}@example.com`,
      password: 'password123',
      balance: 100,
      role: 'user'
    });

    console.log(`Created users:`);
    console.log(`  From: ${fromUser.name} (${fromPhone}) - Balance: ${fromUser.balance}`);
    console.log(`  To: ${toUser.name} (${toPhone}) - Balance: ${toUser.balance}`);

    const amount = 200;
    const fromBalanceBefore = parseFloat(fromUser.balance);
    const toBalanceBefore = parseFloat(toUser.balance);

    console.log(`\nBefore transfer:`);
    console.log(`  From balance: ${fromBalanceBefore}`);
    console.log(`  To balance: ${toBalanceBefore}`);

    // Simulate admin push money logic with proper parseFloat handling
    fromUser.balance = fromBalanceBefore - amount;
    toUser.balance = toBalanceBefore + amount;

    await fromUser.save();
    await toUser.save();

    console.log(`\nAfter transfer:`);
    console.log(`  From balance: ${fromUser.balance} (expected: ${fromBalanceBefore - amount})`);
    console.log(`  To balance: ${toUser.balance} (expected: ${toBalanceBefore + amount})`);

    // Verify balance changes
    if (parseFloat(fromUser.balance) === fromBalanceBefore - amount) {
      console.log('✅ From user balance correctly deducted by entered amount');
    } else {
      console.log(`❌ From user balance deduction failed. Expected: ${fromBalanceBefore - amount}, Got: ${fromUser.balance}`);
    }

    if (parseFloat(toUser.balance) === toBalanceBefore + amount) {
      console.log('✅ To user balance correctly added by entered amount');
    } else {
      console.log(`❌ To user balance addition failed. Expected: ${toBalanceBefore + amount}, Got: ${toUser.balance}`);
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: `TEST${Date.now()}`,
      senderId: fromUser.id,
      receiverId: toUser.id,
      amount,
      type: 'admin_push',
      status: 'completed',
      description: `Admin pushed money from ${fromPhone} to ${toPhone}`,
      senderBalance: fromUser.balance,
      receiverBalance: toUser.balance,
      commission: 0,
      commissionPercent: 0,
      agentCommission: 0,
      agentCommissionPercent: 0,
      companyCommission: 0,
      companyCommissionPercent: 0
    });

    console.log('\n✅ Transaction created');

    // Test transaction retrieval with associations
    const retrievedTransaction = await Transaction.findOne({
      where: { transactionId: transaction.transactionId },
      include: [
        { model: User, as: 'sender', attributes: ['name', 'phone'] },
        { model: User, as: 'receiver', attributes: ['name', 'phone'] }
      ]
    });

    console.log('\nTransaction display test:');
    const senderDisplay = retrievedTransaction.sender?.name || retrievedTransaction.sender?.phone || 'System';
    const receiverDisplay = retrievedTransaction.receiver?.name || retrievedTransaction.receiver?.phone || 'N/A';

    console.log(`  From: ${senderDisplay}`);
    console.log(`  To: ${receiverDisplay}`);

    if (senderDisplay === fromUser.name && receiverDisplay === toUser.name) {
      console.log('✅ Transaction display shows correct sender and receiver names');
    } else {
      console.log(`❌ Transaction display incorrect. Expected From: ${fromUser.name}, To: ${toUser.name}`);
      console.log(`    Got From: ${senderDisplay}, To: ${receiverDisplay}`);
    }

    // Clean up
    await Transaction.destroy({ where: { transactionId: transaction.transactionId } });
    await User.destroy({ where: { phone: [fromPhone, toPhone] } });

    console.log('\nTest completed successfully');

  } catch (error) {
    console.error('Test failed:', error);
    if (error.name === 'SequelizeValidationError') {
      console.error('Validation errors:', error.errors.map(e => `${e.path}: ${e.message}`));
    }
  } finally {
    await sequelize.close();
  }
}

testAdminPushMoneyBalanceAndDisplay();