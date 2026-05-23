'use strict';

/**
 * Handles 404 Not Found for unmatched routes.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler.
 * Formats all errors into a consistent response shape.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose cast error (e.g., invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    message = `Duplicate value: '${value}' already exists for ${field}.`;
  }

  // JWT errors (shouldn't normally reach here since handled in middleware)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  // CORS error
  if (err.message && err.message.startsWith('CORS:')) {
    statusCode = 403;
    message = err.message;
  }

  // Don't leak internal details in production
  const isDev = process.env.NODE_ENV !== 'production';

  const response = {
    success: false,
    message,
    ...(errors && { errors }),
    ...(isDev && statusCode >= 500 && { stack: err.stack }),
  };

  if (isDev) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
