import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import geminiSearchRouter from './routes/geminiSearch.js';
import flightsRouter from './routes/flights.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:1234';

// Minimal middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// API routes
app.use('/api', geminiSearchRouter);
app.use('/api', flightsRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Valyux API running on http://localhost:${PORT}`);
});
