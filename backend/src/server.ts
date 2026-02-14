import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health.js';
import searchRouter from './routes/search.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1234';

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', healthRouter);
app.use('/api', searchRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const apiKey = process.env.FOODSPARK_API_KEY;
app.listen(PORT, () => {
  console.log(`\n  Valyux Backend running on http://localhost:${PORT}`);
  console.log(`  CORS origin: ${FRONTEND_URL}`);
  console.log(`  Health check: http://localhost:${PORT}/api/health`);
  console.log(`  Data source: ${apiKey ? 'FoodSpark API' : 'Mock data (set FOODSPARK_API_KEY to use live data)'}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  process.exit(0);
});
