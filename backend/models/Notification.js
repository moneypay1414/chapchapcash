import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('transaction', 'system', 'alert', 'offer', 'withdrawal_request'),
    defaultValue: 'system'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  relatedTransactionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Transactions',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['recipientId'] },
    { fields: ['isRead'] },
    { fields: ['type'] },
    { fields: ['relatedTransactionId'] }
  ]
});

// Define associations
Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: 'recipientId', as: 'recipient' });
  Notification.belongsTo(models.Transaction, { foreignKey: 'relatedTransactionId', as: 'relatedTransaction' });
};

export default Notification;
