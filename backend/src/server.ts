import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import geminiSearchRouter from './routes/geminiSearch.js';
import flightsRouter from './routes/flights.js';
import grocerySearchRouter from './routes/grocerySearch.js';
import locationRouter from './routes/location.js';
import quickcommerceRouter from './routes/quickcommerce.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL_RAW = process.env.FRONTEND_URL || 'http://localhost:1234';
const FRONTEND_URL = FRONTEND_URL_RAW.replace(/\/$/, '');

// Minimal middleware
app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Allow same-origin / tools without `Origin` header.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, '');
      return normalized === FRONTEND_URL ? cb(null, true) : cb(null, false);
    },
  })
);
app.use(express.json());

// API routes
app.use('/api', geminiSearchRouter);
app.use('/api', flightsRouter);
app.use('/api', grocerySearchRouter);
app.use('/api', locationRouter);
app.use('/api', quickcommerceRouter);

// 404 catch-all
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Valyux API running on http://localhost:${PORT}`);
  const qc = process.env.QUICKCOMMERCE_API_KEY?.trim();
  console.log(`QuickCommerce API key: ${qc ? 'loaded (set in backend/.env)' : 'missing — add QUICKCOMMERCE_API_KEY'}`);
});
