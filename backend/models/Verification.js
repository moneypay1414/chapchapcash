import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Verification = sequelize.define('Verification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purpose: {
    type: DataTypes.ENUM('registration', 'password_reset', 'transaction'),
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['phone'] },
    { fields: ['purpose'] },
    { fields: ['isVerified'] }
  ]
});

export default Verification;
