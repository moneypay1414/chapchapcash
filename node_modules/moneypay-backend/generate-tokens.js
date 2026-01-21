import sequelize from './config/database.js';
import User from './models/User.js';
import jwt from 'jsonwebtoken';

async function generateTokens() {
  try {
    console.log('Generating JWT tokens for existing users...');

    // Get test user
    const testUser = await User.findOne({
      where: { email: 'test@example.com' }
    });

    if (testUser) {
      const testToken = jwt.sign(
        {
          userId: testUser.id,
          role: testUser.role
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random',
        { expiresIn: '7d' }
      );

      console.log('\n🔑 Regular User Token:');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      console.log('Token:', testToken);
      console.log('Authorization: Bearer ' + testToken);
    }

    // Get admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (adminUser) {
      const adminToken = jwt.sign(
        {
          userId: adminUser.id,
          role: adminUser.role
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random',
        { expiresIn: '7d' }
      );

      console.log('\n🔑 Admin User Token:');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
      console.log('Token:', adminToken);
      console.log('Authorization: Bearer ' + adminToken);
    }

  } catch (error) {
    console.error('Error generating tokens:', error);
  } finally {
    await sequelize.close();
  }
}

generateTokens();