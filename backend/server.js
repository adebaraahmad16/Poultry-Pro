import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import dailyRecordRoutes from './routes/dailyRecordRoutes.js';
import pool from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PoultryPro backend is running' });
});

// Render must verify MySQL connectivity before declaring a deployment healthy.
app.get('/health/ready', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query({sql: 'SELECT 1', timeout: 5000});
    res.json({status: 'OK', database: 'connected'});
  } catch {
    res.status(503).json({status: 'unavailable', database: 'unavailable'});
  }
});

// API Routes
app.use('/api', subscriptionRoutes);
app.use('/api/daily-records', dailyRecordRoutes);
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 PoultryPro Express Backend running on http://localhost:${PORT}`);
});
