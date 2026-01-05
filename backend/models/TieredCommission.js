import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TieredCommission = sequelize.define('TieredCommission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tiers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  withdrawalTiers: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  type: {
    type: DataTypes.ENUM('send-money', 'withdraw'),
    defaultValue: 'send-money'
  }
}, {
  timestamps: true
});

export default TieredCommission;
