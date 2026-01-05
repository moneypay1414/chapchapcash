import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Currency = sequelize.define('Currency', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  symbol: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  countries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 4),
    allowNull: true
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  buyingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  priceType: {
    type: DataTypes.ENUM('fixed', 'percentage'),
    defaultValue: 'fixed'
  },
  tier: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { unique: true, fields: ['code'] },
    { fields: ['tier'] }
  ]
});

export default Currency;
