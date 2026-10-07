const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('❌ Error Caught in Middleware:', err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    return res.status(404).json({
      success: false,
      error: 'Resource Not Found',
      message,
    });
  }

  // Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for '${field}'. Must be unique.`;
    return res.status(409).json({
      success: false,
      error: 'Duplicate Email',
      message,
    });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
      message: messages.join(', '),
    });
  }

  // Default Express Server Error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.name || 'Server Error',
    message: error.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
