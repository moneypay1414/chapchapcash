import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const StateSetting = sequelize.define('StateSetting', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  commissionPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['name'] }
  ]
});

export default StateSetting;
