import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WithdrawalCommissionTier = sequelize.define('WithdrawalCommissionTier', {
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
  agentPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  companyPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  timestamps: true
});

export default WithdrawalCommissionTier;