const express = require('express');
const routes = require('./routes');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Mount routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(err.errors).map(e => e.message).join(', ')
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'A tenant with this email already exists'
    });
  }

  // Mongoose Cast Error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }

  // Custom validation errors
  if (err.message && (
    err.message.includes('required') ||
    err.message.includes('must be') ||
    err.message.includes('cannot')
  )) {
    return res.status(400).json({
      message: err.message
    });
  }

  console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

module.exports = app;