# 🤖 Robotics Club Door Lock Management System

A comprehensive web-based door lock management system for Robotics Club NIT Allahabad. This full-stack application provides secure admin authentication, member management, password generation, and real-time door access control.

![System Architecture](https://img.shields.io/badge/Stack-Node.js%20%2B%20React%20%2B%20javaScript-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

## 🚀 Features

### 🔐 **Admin Authentication**
- **OTP-based Login**: Secure 2-factor authentication for admins
- **Email Verification**: Only pre-approved admin emails can access the system
- **Session Management**: Secure admin sessions with automatic logout
- **Timer Display**: Real-time OTP expiry countdown

### 👥 **Member Management**
- **Member Registration**: Add new members with name, registration number, and email
- **Password Generation**: Auto-generate 8-digit access passwords (regNo last 4 + random 4)
- **Email Notifications**: Automatic welcome emails with access credentials
- **Member Logs**: Complete historical data of all member entries with timestamps

### 🚪 **Door Access Control**
- **Door OTP Generation**: Generate temporary OTPs for door unlocking (15-minute validity)
- **Real-time Timers**: Visual countdown for OTP expiry
- **Admin Notifications**: Door OTPs sent to all authorized admin emails
- **Auto-cleanup**: Expired OTPs automatically removed from system

### 📊 **Data Management**
- **Google Sheets Integration**: All data stored in Google Sheets for easy access
- **Real-time Dashboard**: Live statistics and recent entries
- **Export Functionality**: Download member data as CSV
- **Search & Filter**: Find members by name, registration number, or email
- **Data Validation**: Comprehensive form validation and error handling

### 🔑 **Password Management**
- **Bulk Password Reset**: Change all member passwords with OTP verification
- **Email Distribution**: New passwords automatically sent to all members
- **Secure Generation**: Cryptographically secure password generation
- **Audit Trail**: Complete logs of all password changes

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  Express Backend │◄──►│  Google Sheets  │
│                 │    │                 │    │                 │
│ • Admin Dashboard│    │ • Authentication │    │ • Member Data   │
│ • Member Forms  │    │ • API Endpoints │    │ • Admin Emails  │
│ • OTP Timers    │    │ • Email Service │    │ • Door OTPs     │
│ • Data Tables   │    │ • Data Processing│    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Browser  │    │  Brevo Email    │    │  Service Account│
│                 │    │                 │    │                 │
│ • Responsive UI │    │ • OTP Delivery  │    │ • Sheet Access  │
│ • Real-time     │    │ • Notifications │    │ • Secure Auth   │
│ • Mobile Ready  │    │ • Welcome Msgs  │    │ • API Quotas    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **Google Cloud Service Account** (for Google Sheets API)
- **Brevo Account** (for email service)
- **Google Sheets** (for data storage)

## ⚡ Quick Setup

### 1. **Clone the Repository**
```bash
git clone https://github.com/aryan-1709/RoboticsClubDoorLock.git
cd RoboticsClubDoorLock
```

### 2. **Backend Setup**
```bash
# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. **Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Build for production (optional)
npm run build
```

## 🔧 Configuration

### **Environment Variables (.env)**

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Email Service (Brevo)
EMAIL_USER=your-verified-brevo-email@domain.com
BREVO_API_KEY=xkeysib-your-brevo-api-key-here

# Google Sheets Configuration
SPREADSHEET_ID=your-google-sheets-id-here
GOOGLE_KEY_JSON=base64-encoded-service-account-json

# Google Sheets Column Mapping
MEMBER_REG_NO_COL=1      # Column A (0-based indexing)
MEMBER_EMAIL_COL=2       # Column B  
MEMBER_PASSWORD_COL=3    # Column C
ADMIN_COL=4              # Column D
DOOR_OTP_COL=5           # Column E

# Security
CRON_JOB_PASSWROD=your-secure-cron-password

# Deployment (for production)
RENDER=false
```

### **Google Sheets Setup**

1. **Create Google Sheets Document** with columns:
   ```
   A: Name | B: Registration No | C: Email | D: Password | E: Admin | F: Door OTP | G: Timestamp
   ```

2. **Set up Service Account:**
   ```bash
   # Go to Google Cloud Console
   # Create new project or select existing
   # Enable Google Sheets API
   # Create Service Account
   # Generate JSON key file
   # Share your Google Sheet with service account email
   ```

3. **Encode Service Account JSON:**
   ```bash
   # Convert JSON to base64
   base64 -i path/to/service-account.json
   # Copy output to GOOGLE_KEY_JSON in .env
   ```

### **Brevo Email Setup**

1. **Create Brevo Account** at [brevo.com](https://brevo.com)
2. **Verify your sender email**
3. **Get API key** from Settings > SMTP & API
4. **Add API key** to `.env` as `BREVO_API_KEY`

## 🚀 Running the Application

### **Development Mode**

```bash
# Terminal 1: Start Backend
npm run dev
# or
node server.js

# Terminal 2: Start Frontend (in new terminal)
cd frontend
npm run dev
```

**Access URLs:**
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000

### **Production Mode**

```bash
# Build frontend
cd frontend && npm run build

# Start production server
npm start
```

## 📡 API Documentation

### **Authentication Endpoints**

#### `POST /verifyAdmin`
```json
// Step 1: Request OTP
{
  "email": "admin@example.com"
}

// Step 2: Verify OTP
{
  "email": "admin@example.com",
  "otp": "123456"
}
```

### **Member Management Endpoints**

#### `POST /enter`
```json
{
  "name": "John Doe",
  "regNo": "20245001",
  "email": "john@student.edu"
}
```

#### `POST /admin/getMemberLogs`
```json
{
  "email": "admin@example.com"
}
```

### **Admin Action Endpoints**

#### `POST /changepassword`
```json
{
  "email": "admin@example.com",
  "otp": "123456",
  "confirm": true
}
```

#### `POST /admin/generateDoorOtp`
```json
{
  "email": "admin@example.com"
}
```

## 🌐 Deployment Guide

### **Option 1: Render (Recommended)**

1. **Create `render.yaml`:**
```yaml
services:
  - type: web
    name: robotics-door-lock
    env: node
    plan: free
    buildCommand: cd frontend && npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

2. **Deploy Steps:**
   - Push code to GitHub
   - Connect GitHub to Render
   - Set environment variables in Render dashboard
   - Deploy automatically

### **Option 2: Vercel + Railway**

**Frontend (Vercel):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

**Backend (Railway):**
- Connect GitHub repo to Railway
- Set environment variables
- Deploy with automatic builds

### **Option 3: Docker Deployment**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

## 🔒 Security Features

- **OTP Authentication**: Time-based one-time passwords for admin access
- **Email Verification**: Only pre-approved emails can access admin functions
- **Session Management**: Secure login sessions with automatic cleanup
- **Input Validation**: Comprehensive validation for all user inputs
- **Environment Isolation**: Sensitive data stored in environment variables
- **API Rate Limiting**: Built-in protection against abuse
- **Secure Headers**: CORS and security headers configured

## 📊 Data Structure

### **Google Sheets Schema**
```
Column A (0): Name           - Member's full name
Column B (1): Registration   - Unique registration number
Column C (2): Email          - Member's email address
Column D (3): Password       - 8-digit access password
Column E (4): Admin          - Admin email (if applicable)
Column F (5): Door OTP       - Temporary door access OTP
Column G (6): Timestamp      - Entry timestamp (ISO format)
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **Google Sheets API Errors**
   ```bash
   # Check service account permissions
   # Verify sheet is shared with service account email
   # Ensure API is enabled in Google Cloud Console
   ```

2. **Email Delivery Issues**
   ```bash
   # Verify Brevo API key is correct
   # Check sender email is verified in Brevo
   # Ensure email quota is not exceeded
   ```

3. **Frontend Build Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf frontend/node_modules
   cd frontend && npm install
   ```

4. **Environment Variable Issues**
   ```bash
   # Check .env file exists and has correct format
   # Verify all required variables are set
   # Ensure no trailing spaces in values
   ```

## 📈 Monitoring & Logs

### **Backend Logs**
```bash
# View server logs
tail -f server.log

# Debug mode
DEBUG=* npm run dev
```

### **Performance Monitoring**
- API response times logged
- Database query performance tracked
- Email delivery status monitored
- OTP generation and validation metrics



### **Development Guidelines**
- Follow TypeScript/JavaScript best practices
- Add comprehensive error handling
- Include proper logging for debugging
- Write clear commit messages
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


### **v1.0.0** (Current)
- ✅ Complete admin dashboard with OTP authentication
- ✅ Member management system with email notifications
- ✅ Door OTP generation with timer functionality
- ✅ Google Sheets integration for data persistence
- ✅ Responsive React frontend with TypeScript
- ✅ Comprehensive member logs and export functionality
- ✅ Production-ready deployment configuration

---

**Made with ❤️ **
