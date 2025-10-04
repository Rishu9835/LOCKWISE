# API Documentation

## Base URL
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com`

## Authentication
Most endpoints require admin authentication through OTP verification. Include the admin email in request headers or body as specified.

---

## 🔐 Authentication Endpoints

### Verify Admin
**POST** `/verifyAdmin`

Verify admin credentials and send OTP for authentication.

**Request Body:**
```json
{
  "adminEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent to admin email"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Admin not found"
}
```

---

## 👥 Member Management Endpoints

### Add Member
**POST** `/addMember`

Add a new member to the system with auto-generated 8-digit password.

**Request Body:**
```json
{
  "name": "John Doe",
  "regNo": "2021BCE123",
  "email": "john@example.com",
  "adminEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member added successfully",
  "password": "21238765"
}
```

**Password Format:** Last 4 digits of registration number + 4 random digits

### Change Member Password
**POST** `/changeMemberPassword`

Change password for an existing member.

**Request Body:**
```json
{
  "email": "john@example.com",
  "adminEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "newPassword": "21234567"
}
```

---

## 🚪 Door Access Endpoints

### Generate Door OTP
**POST** `/generateDoorOTP`

Generate OTP for door access (valid for 5 minutes).

**Request Body:**
```json
{
  "adminEmail": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Door OTP generated",
  "otp": "987654",
  "expiryTime": "2024-01-15T10:35:00Z"
}
```

### Verify Door Access
**POST** `/verifyDoorAccess`

Verify member credentials for door access.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "21238765"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access granted",
  "memberName": "John Doe"
}
```

---

## 📊 Admin Data Endpoints

### Get Member Logs
**GET** `/admin/getMemberLogs`

Retrieve historical member data (requires admin authentication).

**Query Parameters:**
- `adminEmail` (required): Admin email address

**Example Request:**
```
GET /admin/getMemberLogs?adminEmail=admin@example.com
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "regNo": "2021BCE123",
      "email": "john@example.com",
      "password": "21238765",
      "timestamp": "2024-01-15T09:30:00Z"
    }
  ]
}
```

---

## 📄 Static File Endpoints

### Serve Frontend
**GET** `/`

Serves the React frontend application.

**Response:** HTML page with the complete admin dashboard

### Health Check
**GET** `/health`

Simple health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600
}
```

---

## 🔧 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (admin verification failed)
- `404` - Not Found (member/resource not found)
- `500` - Internal Server Error

---

## 📧 Email Notifications

The system automatically sends emails for:
- **Admin OTP:** When admin requests verification
- **Welcome Email:** When new member is added
- **Password Change:** When member password is updated
- **Door OTP:** When door OTP is generated

---

## 🔒 Security Features

### Rate Limiting
- OTP generation: Limited to prevent spam
- Failed login attempts: Tracked and limited

### Data Protection
- Passwords are stored in plain text for member access cards
- Admin verification required for all sensitive operations
- Google Sheets integration with service account authentication

### Input Validation
- Email format validation
- Registration number format validation
- Required field validation

---

## 📊 Google Sheets Integration

### Column Mapping (0-based indexing)
- **Column A (0):** Name
- **Column B (1):** Registration Number
- **Column C (2):** Email
- **Column D (3):** Password
- **Column E (4):** Admin Status
- **Column F (5):** Door OTP
- **Column G (6):** Timestamp

### Environment Variables
```env
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@account.email
GOOGLE_PRIVATE_KEY=your_private_key
```

---

## 🚀 Deployment Notes

### Environment Setup
1. Copy `.env.example` to `.env`
2. Configure all required environment variables
3. Set up Google Service Account
4. Configure Brevo email service

### Production Considerations
- Set `NODE_ENV=production`
- Enable `IS_PRODUCTION=true`
- Configure proper logging
- Set up monitoring and health checks

---

## 📞 Support

For technical support or questions:
- Create an issue on GitHub
- Contact Robotics Club NIT Allahabad
- Check the troubleshooting section in README.md