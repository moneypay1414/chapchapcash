import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function testLogin() {
  console.log('🔐 Testing Login Functionality\n');

  const testCases = [
    {
      name: 'Regular User Login',
      email: 'test@example.com',
      password: 'test123'
    },
    {
      name: 'Admin Login',
      email: 'admin@example.com',
      password: 'admin123'
    },
    {
      name: 'Invalid Credentials',
      email: 'test@example.com',
      password: 'wrongpassword'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: testCase.email,
        password: testCase.password
      });

      if (response.status === 200) {
        console.log(`✅ ${testCase.name} - SUCCESS`);
        console.log(`   Token: ${response.data.token.substring(0, 20)}...`);
        console.log(`   User: ${response.data.user.email}\n`);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log(`❌ ${testCase.name} - FAILED (Invalid Credentials)\n`);
      } else {
        console.log(`❌ ${testCase.name} - ERROR: ${error.message}\n`);
      }
    }
  }

  console.log('🧪 Login tests completed');
}

testLogin();
