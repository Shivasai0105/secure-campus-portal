# 🎓 Secure Campus Portal

A comprehensive web-based portal for managing campus services, student requests, and administrative tasks with enterprise-grade security features.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.4%2B-green)](https://www.mongodb.com/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🌟 Overview

The Secure Campus Portal is a full-stack web application designed to streamline campus operations by providing students, faculty, and administrators with a centralized platform for managing various campus services. The system emphasizes security, user experience, and scalability.

### Key Highlights

- 🔐 **Enterprise Security**: Implements CSRF protection, rate limiting, XSS prevention, and secure session management
- 👥 **Role-Based Access**: Separate dashboards for students, faculty, and administrators
- 📄 **Document Management**: Request and track bonafide certificates, fee receipts, and other documents
- 📢 **Notice Board**: Real-time campus announcements and circulars
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS

## ✨ Features

### For Students
- ✅ Secure authentication with password strength validation
- ✅ Request bonafide certificates and other documents
- ✅ Track request status in real-time
- ✅ Download fee receipts
- ✅ View campus notices and circulars
- ✅ Update profile information

### For Faculty
- ✅ Manage student requests
- ✅ Post announcements
- ✅ Access student records (authorized)

### For Administrators
- ✅ Complete system oversight
- ✅ User management
- ✅ System configuration
- ✅ Analytics and reporting

### Security Features
- 🛡️ CSRF token protection
- 🚦 Rate limiting on all endpoints
- 🔒 Secure password hashing with bcrypt
- 🍪 HTTP-only, secure cookies
- 🔐 Session management with MongoDB store
- 🧹 Input sanitization and validation
- 🚫 XSS and injection attack prevention
- 📏 Request size limits
- 🔑 Helmet.js security headers

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Express Session with bcryptjs
- **Security**: Helmet, CSRF, express-rate-limit, HPP
- **Validation**: express-validator

### Frontend
- **Core**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Tailwind CSS v3
- **Build Tools**: PostCSS, Autoprefixer

## 📦 Prerequisites

Before installing the Secure Campus Portal, ensure you have the following installed on your system:

- **Node.js**: v14.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v6.0.0 or higher (comes with Node.js)
- **MongoDB**: v4.4 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MongoDB installation
mongod --version

# Check Git installation
git --version
```

## 🚀 Installation

### Step 1: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/Shivasai0105/secure-campus-portal.git

# Or clone via SSH
git clone git@github.com:Shivasai0105/secure-campus-portal.git

# Navigate to project directory
cd secure-campus-portal
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend directory
cd backend

# Install all dependencies
npm install

# Return to root directory
cd ..
```

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install all dependencies
npm install

# Return to root directory
cd ..
```

### Step 4: Set Up MongoDB

#### Option A: Local MongoDB Installation

```bash
# Start MongoDB service (Windows)
net start MongoDB

# Start MongoDB service (macOS/Linux)
sudo systemctl start mongod

# Or run MongoDB manually
mongod --dbpath /path/to/your/data/directory
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Use it in the `.env` file (see Configuration section)

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```bash
cd backend
```

Create `.env` file with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/secure-campus-portal
# For MongoDB Atlas, use:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/secure-campus-portal

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
SESSION_MAX_AGE=86400000

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=10
```

### Frontend Configuration

The frontend uses Tailwind CSS. Configuration is already set up in `tailwind.config.js`.

### Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Backend server port | 5000 | Yes |
| `NODE_ENV` | Environment mode | development | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `SESSION_SECRET` | Secret key for session encryption | - | Yes |
| `SESSION_MAX_AGE` | Session duration in milliseconds | 86400000 (24h) | No |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 | Yes |
| `BCRYPT_ROUNDS` | Password hashing rounds | 10 | No |

## 🏃 Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Start development server with auto-reload
npm run dev

# Or start production server
npm start
```

The backend server will start at `http://localhost:5000`

#### Terminal 2: Start Frontend Server

```bash
# Navigate to frontend directory
cd frontend

# Build Tailwind CSS (one-time)
npm run build

# Start HTTP server
npx http-server . -p 3000

# Or for auto-reload during development
npm run watch
```

The frontend will be available at `http://localhost:3000`

### Production Mode

#### Backend

```bash
cd backend
NODE_ENV=production npm start
```

#### Frontend

```bash
cd frontend
npm run build
# Serve the built files using your preferred web server (nginx, Apache, etc.)
```

### Quick Start Script (Optional)

Create a `start.sh` (Linux/Mac) or `start.bat` (Windows) file in the root directory:

**start.bat (Windows):**
```batch
@echo off
start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && npx http-server . -p 3000"
```

**start.sh (Linux/Mac):**
```bash
#!/bin/bash
cd backend && npm run dev &
cd frontend && npx http-server . -p 3000 &
```

Then run:
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

## 📁 Project Structure

```
secure-campus-portal/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Custom middleware
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── validators/      # Input validation schemas
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Server entry point
│   ├── .env                 # Environment variables (not in git)
│   ├── package.json         # Backend dependencies
│   └── package-lock.json
│
├── frontend/
│   ├── src/
│   │   ├── input.css        # Tailwind source
│   │   └── *.js             # JavaScript modules
│   ├── dist/
│   │   └── output.css       # Compiled Tailwind CSS
│   ├── *.html               # HTML pages
│   ├── *.css                # Custom styles
│   ├── *.js                 # Page scripts
│   ├── tailwind.config.js   # Tailwind configuration
│   ├── package.json         # Frontend dependencies
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register Student
```http
POST /api/auth/register/student
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "rollNumber": "2024CS001",
  "department": "Computer Science"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

#### Logout
```http
POST /api/auth/logout
```

### Student Endpoints

#### Get Profile
```http
GET /api/students/profile
Authorization: Session Cookie
```

#### Request Bonafide Certificate
```http
POST /api/students/requests/bonafide
Content-Type: application/json

{
  "purpose": "Internship Application",
  "additionalDetails": "Required for summer internship"
}
```

#### Get Request Status
```http
GET /api/students/requests
Authorization: Session Cookie
```

### Rate Limits

- **Authentication endpoints**: 5 requests per 15 minutes
- **General API**: 100 requests per 15 minutes
- **Document requests**: 10 requests per hour

## 🔒 Security Features

### Implemented Security Measures

1. **CSRF Protection**: All state-changing requests require valid CSRF tokens
2. **Rate Limiting**: Prevents brute-force and DoS attacks
3. **Password Security**: 
   - Minimum 8 characters
   - Requires uppercase, lowercase, number, and special character
   - Hashed using bcrypt with 10 rounds
4. **Session Security**:
   - HTTP-only cookies
   - Secure flag in production
   - MongoDB session store
5. **Input Validation**: All inputs sanitized and validated
6. **XSS Prevention**: Content Security Policy headers
7. **SQL Injection Prevention**: Mongoose ODM with parameterized queries
8. **HTTP Parameter Pollution**: HPP middleware
9. **Security Headers**: Helmet.js implementation

### Security Best Practices

- Never commit `.env` files
- Use strong, unique session secrets
- Enable HTTPS in production
- Regularly update dependencies
- Monitor security advisories
- Implement proper logging and monitoring

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed
- Test your changes thoroughly

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port or change the port in `.env`
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

#### CORS Errors
**Solution**: Verify `FRONTEND_URL` in `.env` matches your frontend URL

#### Session Not Persisting
**Solution**: Check MongoDB connection and session configuration in `.env`

#### Tailwind CSS Not Working
**Solution**: Rebuild Tailwind CSS
```bash
cd frontend
npm run build
```

### Getting Help

- 📧 Email: support@securecampusportal.com
- 🐛 Issues: [GitHub Issues](https://github.com/Shivasai0105/secure-campus-portal/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Shivasai0105/secure-campus-portal/discussions)

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Shivasai0105** - *Initial work* - [GitHub](https://github.com/Shivasai0105)

## 🙏 Acknowledgments

- Express.js community for excellent documentation
- MongoDB team for the robust database
- Tailwind CSS for the utility-first CSS framework
- All contributors who help improve this project

---

**Made with ❤️ for campus communities**

*Last Updated: February 2026*
