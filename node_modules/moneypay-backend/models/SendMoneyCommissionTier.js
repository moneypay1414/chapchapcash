import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const SendMoneyCommissionTier = sequelize.define('SendMoneyCommissionTier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  maxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  companyPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  userPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default SendMoneyCommissionTier;