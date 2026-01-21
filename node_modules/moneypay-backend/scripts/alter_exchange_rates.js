// Alter ExchangeRates table to support higher precision decimals
// Run with: node scripts/alter_exchange_rates.js

import sequelize from '../config/database.js';
import ExchangeRate from '../models/ExchangeRate.js';

async function alterTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Alter the table columns
    await sequelize.query(`
      ALTER TABLE ExchangeRates
      MODIFY COLUMN buyingPrice DECIMAL(15,10),
      MODIFY COLUMN sellingPrice DECIMAL(15,10)
    `);

    console.log('ExchangeRates table altered successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error altering table:', error);
    process.exit(1);
  }
}

alterTable();