import sequelize from './config/database.js';

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful!');

    // Sync database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();