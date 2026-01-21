import sequelize from './config/database.js';
import User from './models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

async function createTestUser() {
  try {
    console.log('Creating test user for Postman testing...');

    // Check if test user already exists
    const existingUser = await User.findOne({
      where: {
        email: 'test@example.com'
      }
    });

    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      console.log('Phone: +211911111111');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('test123', saltRounds);

    // Create test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+211911111111',
      password: hashedPassword,
      balance: 10000,
      role: 'user',
      isVerified: true,
      theme: 'light'
    });

    console.log('✅ Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
    console.log('Phone: +211911111111');
    console.log('Balance: 10000');

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: testUser.id,
        role: testUser.role
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-make-it-long-and-random',
      { expiresIn: '7d' }
    );

    console.log('\n🔑 JWT Token for Postman:');
    console.log(token);
    console.log('\n📋 Copy this token for Authorization header:');
    console.log('Authorization: Bearer ' + token);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await sequelize.close();
  }
}

createTestUser();