import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PoultryPro Backend Server Running with MySQL Connection' });
});

// API Routes
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 PoultryPro Express Backend running on http://localhost:${PORT}`);
});
