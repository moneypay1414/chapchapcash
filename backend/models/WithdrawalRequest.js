import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WithdrawalRequest = sequelize.define('WithdrawalRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  agentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  agentCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  agentCommissionPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  companyCommission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  companyCommissionPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  commission: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
    defaultValue: 'pending'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['agentId'] },
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

// Define associations
WithdrawalRequest.associate = (models) => {
  WithdrawalRequest.belongsTo(models.User, { foreignKey: 'agentId', as: 'agent' });
  WithdrawalRequest.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

export default WithdrawalRequest;
