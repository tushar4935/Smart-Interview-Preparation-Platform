const logger = require('../config/logger');

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// single place that turns thrown errors into our standard { success, message } json
const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server Error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    status = 400;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`;
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File too large (max 5MB)';
  }

  if (status >= 500) {
    logger.error(`${req.method} ${req.originalUrl} - ${message}`, { stack: err.stack });
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${message}`);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
