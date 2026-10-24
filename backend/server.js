import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import subscriptionRoutes from './routes/subscriptionRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import dailyRecordRoutes from './routes/dailyRecordRoutes.js';
import pool from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PoultryPro backend is running'
  });
});

// Database health check
app.get('/health/ready', async (req, res) => {
  res.set('Cache-Control', 'no-store');

  try {
    await pool.query({
      sql: 'SELECT 1',
      timeout: 5000
    });

    res.json({
      status: 'OK',
      database: 'connected'
    });

  } catch (error) {

    // Retrieve original database error
    const originalError = error.cause || error;

    console.error('Database health check failed:', {
      code: originalError.code,
      message: originalError.message,
      errno: originalError.errno,
      sqlState: originalError.sqlState
    });

    res.status(503).json({
      status: 'unavailable',
      database: 'unavailable'
    });
  }
});
// API Routes
app.use('/api', subscriptionRoutes);
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api', apiRoutes);

// 404 Handler for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start local Express server
const server = app.listen(PORT, () => {
  console.log(
    `🚀 PoultryPro Express Backend running on http://localhost:${PORT}`
  );
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `⚠️ Port ${PORT} is already in use. Another backend instance is already running.`
    );
  } else {
    console.error('Server error:', err);
  }
});

export default app;