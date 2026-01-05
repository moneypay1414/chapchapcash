// ExchangeRate model converted to Sequelize
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ExchangeRate = sequelize.define('ExchangeRate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fromCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  toCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  buyingPrice: {
    type: DataTypes.DECIMAL(15, 10),
    allowNull: true
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(15, 10),
    allowNull: true
  },
  priceType: {
    type: DataTypes.ENUM('fixed', 'percentage'),
    defaultValue: 'fixed'
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['fromCode'] },
    { fields: ['toCode'] },
    { unique: true, fields: ['fromCode', 'toCode'] }
  ]
});

export default ExchangeRate;
