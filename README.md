# 🚀 User Management System - RESTful API

A full-featured RESTful API for user management built with **Node.js**, **Express**, **MongoDB**, and **Mongoose**. Features standard **CRUD operations**, **Basic Authentication** security, **Bcrypt password hashing**, **Postman Collection integration**, and a **Visual Interactive Dashboard & API Tester Console**.

---

## 🌟 Key Features

- **Full RESTful CRUD Operations**: Create (`POST`), Read (`GET`), Update (`PUT`), and Delete (`DELETE`) users.
- **Mongoose Data Modeling**: Schema definitions with built-in validation, custom regex, unique indexes, and pre-save password hashing.
- **HTTP Basic Authentication**: Secure API endpoints requiring valid `Authorization: Basic <base64>` header credentials.
- **In-Memory & Standalone MongoDB Support**: Automatically runs out-of-the-box using `mongodb-memory-server` if local MongoDB is unavailable.
- **Postman Collection Included**: Complete `User_Management_API.postman_collection.json` file ready for instant Postman import and testing.
- **Interactive Visual Dashboard & Postman API Console**: Web interface accessible at `http://localhost:5000` to visually manage users and execute real-time API requests.
- **Automated Integration Test Suite**: Programmatic Jest & Supertest integration tests verifying all routes and security requirements.

---

## 🛠️ Technology Stack

- **Backend Runtime**: Node.js v26+
- **Web Framework**: Express.js
- **Database**: MongoDB & Mongoose ODM (with `mongodb-memory-server` fallback)
- **Security & Auth**: Basic Auth, `bcryptjs` password hashing, `helmet`, `cors`, `express-rate-limit`
- **Testing**: Jest & Supertest
- **Frontend / Console**: HTML5, Vanilla CSS (Glassmorphism UI), JavaScript (ES6+)

---

## 📁 Project Structure

```
User Management System/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & memory fallback logic
│   ├── middleware/
│   │   ├── auth.js               # Basic Authentication middleware
│   │   └── errorHandler.js       # Centralized error handler
│   ├── models/
│   │   └── User.js               # Mongoose User Schema & methods
│   ├── controllers/
│   │   └── user.controller.js    # CRUD controller implementations
│   ├── routes/
│   │   └── user.routes.js        # Express API endpoints mapping
│   └── app.js                    # Express app configuration & middleware
├── public/                       # Visual Interactive Dashboard & Postman API Tester
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── tests/
│   └── api.test.js               # Automated integration tests
├── User_Management_API.postman_collection.json # Official Postman Collection
├── server.js                     # Main entry point
├── .env                          # Environment configuration
└── README.md                     # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Environment Setup
The `.env` file is preconfigured:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/usermanagement
USE_MEMORY_DB=auto
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=admin123
```

### 3. Run the Server
Start the development server:
```bash
npm start
```
- 🌐 **Web Dashboard & API Console**: `http://localhost:5000`
- 📡 **REST API Base URL**: `http://localhost:5000/api/users`
- 🔐 **Default Basic Auth**: User: `admin` | Password: `admin123`

### 4. Run Automated Integration Tests
Execute all integration tests for CRUD operations and Basic Auth:
```bash
npm test
```

---

## 🔐 Basic Authentication Details

All `/api/users` endpoints are protected by HTTP Basic Authentication.

- **Header Format**: `Authorization: Basic <Base64(username:password)>`
- **Default Credentials**: `admin` : `admin123` (Base64: `YWRtaW46YWRtaW4xMjM=`)
- **Database User Credentials**: Any created user email and password can also be used as credentials!

If the header is omitted or invalid, the API returns:
```json
HTTP 401 Unauthorized
Header: WWW-Authenticate: Basic realm="User Management System API"
{
  "success": false,
  "error": "Authentication Required",
  "message": "Missing or invalid Authorization header. Provide HTTP Basic Auth credentials."
}
```

---

## 📡 REST API Endpoint Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users` | Create a new user record | Yes (Basic Auth) |
| `GET` | `/api/users` | Fetch all users (supports `?page=`, `?search=`, `?role=`, `?status=`) | Yes (Basic Auth) |
| `GET` | `/api/users/:id` | Get single user by MongoDB ID | Yes (Basic Auth) |
| `PUT` | `/api/users/:id` | Update user record by ID | Yes (Basic Auth) |
| `DELETE` | `/api/users/:id` | Delete user record by ID | Yes (Basic Auth) |
| `POST` | `/api/users/seed` | Populate 5 sample user records for testing | Yes (Basic Auth) |
| `GET` | `/api/users/stats/summary` | Get aggregated database statistics | Yes (Basic Auth) |

---

## 🧪 Testing with Postman

1. Open **Postman**.
2. Click **Import** (top left).
3. Select `User_Management_API.postman_collection.json` located in the root directory.
4. The collection will automatically populate with all endpoints preconfigured with Basic Auth!
5. Execute requests directly against `http://localhost:5000/api/users`.

---

## 🗄️ Mongoose User Schema Definition

```javascript
{
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false }, // Hashed with Bcrypt
  role: { type: String, enum: ['user', 'admin', 'manager'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  department: { type: String, default: 'Engineering' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  timestamps: true // createdAt, updatedAt
}
```
