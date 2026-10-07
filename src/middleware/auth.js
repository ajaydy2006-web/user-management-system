const User = require('../models/User');
const { getIsInMemoryStore } = require('../config/db');
const MemoryUserStore = require('../services/memoryStore');
const bcrypt = require('bcryptjs');

/**
 * Basic Authentication Middleware
 * Validates 'Authorization: Basic <base64(credentials)>'
 */
const basicAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="User Management System API"');
    return res.status(401).json({
      success: false,
      error: 'Authentication Required',
      message: 'Missing or invalid Authorization header. Provide HTTP Basic Auth credentials.',
    });
  }

  // Extract and decode base64 string
  const base64Credentials = authHeader.split(' ')[1];
  const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [usernameOrEmail, password] = decodedCredentials.split(':');

  if (!usernameOrEmail || !password) {
    res.setHeader('WWW-Authenticate', 'Basic realm="User Management System API"');
    return res.status(401).json({
      success: false,
      error: 'Invalid Credentials Format',
      message: 'Basic authentication string must be in format username:password.',
    });
  }

  // 1. Check System Environment Admin Credentials
  const adminUser = process.env.BASIC_AUTH_USER || 'admin';
  const adminPass = process.env.BASIC_AUTH_PASS || 'admin123';

  if (usernameOrEmail === adminUser && password === adminPass) {
    req.authUser = { username: adminUser, role: 'admin', isSystemAdmin: true };
    return next();
  }

  // 2. Check Database Users (Email/Name + Password)
  try {
    if (getIsInMemoryStore()) {
      const dbUser = await MemoryUserStore.findByEmailWithPassword(usernameOrEmail);
      if (dbUser && (await bcrypt.compare(password, dbUser.password))) {
        req.authUser = {
          id: dbUser._id,
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
        };
        return next();
      }
    } else {
      const user = await User.findOne({
        $or: [{ email: usernameOrEmail.toLowerCase() }, { name: usernameOrEmail }],
      }).select('+password');

      if (user && (await user.comparePassword(password))) {
        req.authUser = {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
        return next();
      }
    }
  } catch (err) {
    console.error('Auth verification error:', err.message);
  }

  // Authentication failure
  res.setHeader('WWW-Authenticate', 'Basic realm="User Management System API"');
  return res.status(401).json({
    success: false,
    error: 'Unauthorized Access',
    message: 'Invalid username/email or password provided.',
  });
};

module.exports = { basicAuth };
