const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const userRoutes = require('./routes/user.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security headers (configured to allow inline scripts/styles for interactive dashboard)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Enable CORS
app.use(cors());

// Express rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard & API tester
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/users', userRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'User Management REST API',
  });
});

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  }
  next();
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
