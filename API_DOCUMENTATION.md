# MoneyPay API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": {},
  "transaction": {},
  "user": {},
  "users": [],
  "transactions": []
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+211912345678",
  "password": "securepassword",
  "role": "user",  // "user", "agent", or "admin"
  "agentId": "123456"  // optional, auto-generated for agents
}

Response:
{
  "message": "User registered. Please verify your phone number.",
  "userId": 1,
  "phone": "+211912345678",
  "agentId": null,
  "adminId": null
}
```

### Verify Phone
```
POST /auth/verify-phone
Content-Type: application/json

{
  "phone": "+211912345678",
  "code": "123456"
}

Response:
{
  "message": "Phone verified successfully"
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword",
  "latitude": 4.85,  // optional
  "longitude": 31.6  // optional
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+211912345678",
    "role": "user",
    "balance": 5000,
    "isVerified": true,
    "agentId": null,
    "adminId": null,
    "autoAdminCashout": false,
    "adminLocationConsent": false,
    "theme": "light",
    "currentLocation": null
  }
}
```

### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+211912345678",
  "balance": 5000,
  "role": "user",
  "isVerified": true,
  "isSuspended": false,
  "agentId": null,
  "adminId": null,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "profileImage": "base64_image_data",
  "idNumber": "ID123456"
}

Response:
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "profileImage": "url_to_image"
}
```

### Check Balance
```
GET /auth/check-balance
Authorization: Bearer <token>

Response:
{
  "balance": 5000
}
```

---

## 💳 Transaction Endpoints

### Send Money
```
POST /transactions/send-money
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientPhone": "+211987654321",
  "amount": 1000,
  "description": "Payment for service"
}

Response:
{
  "message": "Money sent successfully",
  "transaction": {
    "id": 1,
    "transactionId": "TXN202401001",
    "amount": 1000,
    "recipient": "+211987654321",
    "status": "completed"
  }
}

Error Cases:
- 400: "Insufficient balance"
- 404: "Recipient not found"
- 400: "You can't send money to this person" (sending to agent/admin as user)
```

### Withdraw Money
```
POST /transactions/withdraw
Authorization: Bearer <token>
Content-Type: application/json

{
  "agentId": "123456",
  "amount": 5000
}

Response:
{
  "message": "Withdrawal initiated",
  "transaction": {
    "id": 2,
    "transactionId": "TXN202401002",
    "amount": 5000
  }
}

Error Cases:
- 400: "Insufficient balance"
- 404: "Agent not found"
```

### Get Transactions
```
GET /transactions/transactions
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "transactionId": "TXN202401001",
    "senderId": 1,
    "receiverId": 2,
    "amount": 1000,
    "type": "transfer",
    "status": "completed",
    "description": "Payment for service",
    "senderBalance": 4000,
    "receiverBalance": 6000,
    "companyCommission": 30,
    "companyCommissionPercent": 3,
    "createdAt": "2024-01-15T10:30:00Z",
    "sender": {
      "name": "John Doe",
      "phone": "+211912345678"
    },
    "receiver": {
      "name": "Jane Smith",
      "phone": "+211987654321"
    }
  }
]
```

### Get Transaction Stats
```
GET /transactions/stats
Authorization: Bearer <token>

Response:
{
  "totalTransactions": 25,
  "totalSent": 15000,
  "totalReceived": 8000,
  "pendingAgentCommission": 150,
  "pendingCompanyCommission": 450
}
```

### Get User Info
```
GET /transactions/user-info/:phoneNumber
Authorization: Bearer <token>

Response:
{
  "id": 2,
  "name": "Jane Smith",
  "phone": "+211987654321"
}
```

---

## 🔐 Admin Endpoints

All admin endpoints require `Authorization: Bearer <token>` and admin role.

### Commission Management

#### Get Commission
```
GET /admin/commission
Authorization: Bearer <admin_token>

Response:
{
  "commission": 5
}
```

#### Set Commission
```
POST /admin/commission
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "commission": 5
}

Response:
{
  "message": "Commission updated successfully"
}
```

### User Management

#### Get All Users
```
GET /admin/users
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+211912345678",
    "role": "user",
    "balance": 5000,
    "isVerified": true,
    "isSuspended": false,
    "agentId": null,
    "adminId": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Suspend User
```
POST /admin/suspend-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1
}

Response:
{
  "message": "User suspended"
}
```

#### Unsuspend User
```
POST /admin/unsuspend-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1
}

Response:
{
  "message": "User unsuspended"
}
```

### Transaction Management

#### Get All Transactions
```
GET /admin/transactions
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "transactionId": "TXN202401001",
    "senderId": 1,
    "receiverId": 2,
    "amount": 1000,
    "type": "transfer",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00Z",
    "sender": {
      "name": "John Doe",
      "phone": "+211912345678",
      "role": "user"
    },
    "receiver": {
      "name": "Jane Smith",
      "phone": "+211987654321",
      "role": "user"
    }
  }
]
```

### Balance Management

#### Topup User Account
```
POST /admin/topup-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1,
  "amount": 10000,
  "description": "Admin topup"
}

Response:
{
  "message": "Topup successful",
  "transaction": {
    "id": 3,
    "transactionId": "TXN202401003",
    "amount": 10000
  }
}
```

#### Withdraw from User
```
POST /admin/withdraw-from-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1,
  "amount": 5000,
  "description": "Admin withdrawal"
}

Response:
{
  "message": "Withdrawal successful",
  "transaction": {
    "id": 4,
    "transactionId": "TXN202401004",
    "amount": 5000
  }
}
```

#### Push Money Between Users
```
POST /admin/push-money
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromUserId": 1,
  "toUserId": 2,
  "amount": 1000,
  "description": "Admin transfer"
}

Response:
{
  "message": "Money pushed successfully"
}
```

### Agent Management

#### Find Agent by Agent ID
```
GET /admin/find-agent?agentId=123456
Authorization: Bearer <admin_token>

Response:
{
  "id": 2,
  "name": "Agent Name",
  "phone": "+211987654321",
  "agentId": "123456"
}
```

#### Withdraw from Agent
```
POST /admin/withdraw-from-agent
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "agentId": "123456",
  "amount": 5000
}

Response:
{
  "message": "Withdrawal from agent successful"
}
```

#### Request Agent Withdrawal
```
POST /admin/request-agent-withdrawal
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "agentId": "123456",
  "amount": 5000
}

Response:
{
  "message": "Agent withdrawal request created"
}
```

### Commission Management

#### Get Tiered Commission
```
GET /admin/tiered-commission
Authorization: Bearer <admin_token>

Response:
{
  "sendMoneyTiers": [
    {
      "id": 1,
      "minAmount": 0,
      "maxAmount": 99,
      "companyPercent": 0
    }
  ],
  "withdrawalTiers": [
    {
      "id": 1,
      "minAmount": 0,
      "maxAmount": 499,
      "agentPercent": 5,
      "companyPercent": 2
    }
  ]
}
```

#### Set Send Money Tiers
```
POST /admin/tiered-commission/send-money
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tiers": [
    {
      "minAmount": 0,
      "maxAmount": 99,
      "companyPercent": 0
    },
    {
      "minAmount": 100,
      "maxAmount": 499,
      "companyPercent": 1
    }
  ]
}

Response:
{
  "message": "Send money commission tiers updated"
}
```

#### Set Withdrawal Tiers
```
POST /admin/tiered-commission/withdrawal
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "tiers": [
    {
      "minAmount": 0,
      "maxAmount": 499,
      "agentPercent": 5,
      "companyPercent": 2
    }
  ]
}

Response:
{
  "message": "Withdrawal commission tiers updated"
}
```

### Admin Stats

#### Get Admin Stats
```
GET /admin/stats
Authorization: Bearer <admin_token>

Response:
{
  "totalUsers": 250,
  "totalTransactions": 1500,
  "totalVolume": 5000000,
  "completedTransactions": 1450,
  "pendingTransactions": 50,
  "usersByRole": [
    { "role": "user", "count": 200 },
    { "role": "agent", "count": 40 },
    { "role": "admin", "count": 10 }
  ],
  "totalAdminCashOut": 100000,
  "companyBenefits": 15000
}
```

#### Get My Admin Cash Out
```
GET /admin/stats/my-cashed-out
Authorization: Bearer <admin_token>

Response:
{
  "totalCashedOut": 50000
}
```

#### Get My Admin Commission
```
GET /admin/stats/my-commission
Authorization: Bearer <admin_token>

Response:
{
  "totalCommission": 2500
}
```

### Location Management

#### Grant Location Permission to All Users
```
POST /admin/grant-location
Authorization: Bearer <admin_token>

Response:
{
  "message": "Location permission granted to all users"
}
```

### State Settings (Admin-to-Admin Transfers)

#### Get State Settings
```
GET /admin/state-settings
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "state": "Central Equatoria",
    "adminId": "123456",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Create State Setting
```
POST /admin/state-settings
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "state": "Central Equatoria",
  "adminId": "123456"
}

Response:
{
  "message": "State setting created"
}
```

#### Update State Setting
```
PUT /admin/state-settings/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "state": "Central Equatoria",
  "adminId": "123456"
}

Response:
{
  "message": "State setting updated"
}
```

#### Delete State Setting
```
DELETE /admin/state-settings/:id
Authorization: Bearer <admin_token>

Response:
{
  "message": "State setting deleted"
}
```

#### Send Money Between Admins by State
```
POST /admin/send-state
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "toState": "Central Equatoria",
  "amount": 10000,
  "description": "State transfer"
}

Response:
{
  "message": "Money sent to state admin"
}
```

#### Get Pending Send by State
```
GET /admin/send-state/pending
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "fromAdminId": "123456",
    "toState": "Central Equatoria",
    "amount": 10000,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Get Pending Send by State Count
```
GET /admin/send-state/pending/count
Authorization: Bearer <admin_token>

Response:
{
  "count": 5
}
```

#### Receive Send by State
```
POST /admin/send-state/:id/receive
Authorization: Bearer <admin_token>

Response:
{
  "message": "State transfer received"
}
```

#### Cancel Send by State
```
POST /admin/send-state/:id/cancel
Authorization: Bearer <admin_token>

Response:
{
  "message": "State transfer cancelled"
}
```

#### Edit Send by State
```
POST /admin/send-state/:id/edit
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "amount": 15000,
  "description": "Updated transfer"
}

Response:
{
  "message": "State transfer updated"
}
```

### Currency Management

#### Get Currencies
```
GET /admin/currencies
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "code": "SSP",
    "name": "South Sudanese Pound",
    "symbol": "SSP",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Currency
```
POST /admin/currencies
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "USD",
  "name": "US Dollar",
  "symbol": "$"
}

Response:
{
  "message": "Currency created"
}
```

#### Update Currency
```
PUT /admin/currencies/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "code": "USD",
  "name": "US Dollar",
  "symbol": "$"
}

Response:
{
  "message": "Currency updated"
}
```

#### Delete Currency
```
DELETE /admin/currencies/:id
Authorization: Bearer <admin_token>

Response:
{
  "message": "Currency deleted"
}
```

### Exchange Rate Management

#### Get Exchange Rates
```
GET /admin/exchange-rates
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "fromCurrencyId": 1,
    "toCurrencyId": 2,
    "buyingPrice": 5800,
    "sellingPrice": 5700,
    "createdAt": "2024-01-15T10:30:00Z",
    "fromCurrency": {
      "code": "USD",
      "name": "US Dollar"
    },
    "toCurrency": {
      "code": "SSP",
      "name": "South Sudanese Pound"
    }
  }
]
```

#### Create Exchange Rate
```
POST /admin/exchange-rates
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "buyingPrice": 5800,
  "sellingPrice": 5700
}

Response:
{
  "message": "Exchange rate created"
}
```

#### Update Exchange Rate
```
PUT /admin/exchange-rates/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "buyingPrice": 5900,
  "sellingPrice": 5800
}

Response:
{
  "message": "Exchange rate updated"
}
```

#### Delete Exchange Rate
```
DELETE /admin/exchange-rates/:id
Authorization: Bearer <admin_token>

Response:
{
  "message": "Exchange rate deleted"
}
```

### Money Exchange

#### Create Money Exchange Transaction
```
POST /admin/money-exchange
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "amount": 100,
  "exchangeRateId": 1
}

Response:
{
  "message": "Money exchange transaction created",
  "transaction": {
    "id": 1,
    "amount": 100,
    "convertedAmount": 580000,
    "exchangeRate": 5800
  }
}
```

#### Convert Money Exchange
```
POST /admin/convert-money-exchange
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "amount": 100
}

Response:
{
  "convertedAmount": 580000,
  "exchangeRate": 5800
}
```

### Agent Withdrawal Management

#### Approve Withdrawal Request
```
POST /admin/approve-withdrawal-request
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "requestId": 1
}

Response:
{
  "message": "Withdrawal request approved"
}
```

#### Reject Withdrawal Request
```
POST /admin/reject-withdrawal-request
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "requestId": 1
}

Response:
{
  "message": "Withdrawal request rejected"
}
```

#### Get Agent Withdrawal Requests
```
GET /admin/agent-withdrawal-requests
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1,
    "agentId": "123456",
    "amount": 5000,
    "status": "pending",
    "agentCommission": 250,
    "companyCommission": 100,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🔔 Notification Endpoints

### Get Notifications
```
GET /notifications
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "title": "Money Received",
    "message": "You received SSP 1000 from +211912345678",
    "type": "transaction",
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### Mark as Read
```
POST /notifications/mark-as-read
Authorization: Bearer <token>
Content-Type: application/json

{
  "notificationId": 1
}

Response:
{
  "id": 1,
  "isRead": true
}
```

### Mark All as Read
```
POST /notifications/mark-all-as-read
Authorization: Bearer <token>

Response:
{
  "message": "All notifications marked as read"
}
```

### Delete Notification
```
DELETE /notifications/:notificationId
Authorization: Bearer <token>

Response:
{
  "message": "Notification deleted"
}
```

### Send to All Users (Admin Only)
```
POST /notifications/send-to-all
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "System will be down for maintenance tonight",
  "type": "system"
}

Response:
{
  "message": "Notification sent to all users"
}
```

### Send to Specific User (Admin Only)
```
POST /notifications/send-to-user
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "userId": 1,
  "title": "Account Warning",
  "message": "Unusual activity detected on your account",
  "type": "alert"
}

Response:
{
  "message": "Notification sent"
}
```

---

## 💰 Withdrawal Endpoints

### Request Withdrawal
```
POST /withdrawals/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "agentId": "123456",
  "amount": 5000
}

Response:
{
  "message": "Withdrawal request submitted"
}
```

### Approve Withdrawal
```
POST /withdrawals/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": 1
}

Response:
{
  "message": "Withdrawal approved"
}
```

### Reject Withdrawal
```
POST /withdrawals/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "requestId": 1
}

Response:
{
  "message": "Withdrawal rejected"
}
```

### Get Pending Withdrawals
```
GET /withdrawals/pending
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "userId": 1,
    "agentId": "123456",
    "amount": 5000,
    "status": "pending",
    "agentCommission": 250,
    "companyCommission": 100,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

## 🏥 Health Check

### Health Check
```
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Token invalid/expired |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Internal error |

---

## 🔍 Error Codes

| Error | Meaning |
|-------|---------|
| User already exists | Email or phone already registered |
| Invalid credentials | Email or password incorrect |
| Insufficient balance | Not enough funds |
| Recipient not found | Phone number not found |
| Agent ID already exists | Agent ID taken |
| You can't send money to this person | User trying to send to agent/admin |

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+211912345678",
    "password": "password123",
    "role": "user"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Send Money
```bash
curl -X POST http://localhost:5000/api/transactions/send-money \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "recipientPhone": "+211987654321",
    "amount": 1000,
    "description": "Payment"
  }'
```

### Get Admin Stats
```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer <admin_token>"
```

---

## 📝 Rate Limiting

To prevent abuse, implement rate limiting:

```javascript
// Add to your Express app
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🔒 Security Best Practices

1. **Always use HTTPS** in production
2. **Never expose JWT secrets** in logs or code
3. **Validate all inputs** on the backend
4. **Use CORS** properly configured
5. **Implement rate limiting** to prevent abuse
6. **Hash passwords** with bcrypt
7. **Use environment variables** for sensitive data
8. **Log all admin actions** for auditing
9. **Implement 2FA** for admin accounts
10. **Regular security audits** and penetration testing

---

## 📞 API Support

For API issues or questions:
- Check the logs for error messages
- Review request/response format
- Verify authentication token validity
- Ensure all required fields are provided
- Contact support: support@moneypay.com

---

**API Documentation v2.0** - Last Updated: January 2025 ✅
