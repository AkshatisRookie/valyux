import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import geminiSearchRouter from './routes/geminiSearch.js';
import flightsRouter from './routes/flights.js';
import grocerySearchRouter from './routes/grocerySearch.js';
import locationRouter from './routes/location.js';
import quickcommerceRouter from './routes/quickcommerce.js';
import { sendApiIndex } from './apiIndex.js';
import {
  configureTrustProxy,
  flightsLimiter,
  geminiLimiter,
  globalApiLimiter,
  grocerySearchLimiter,
  locationLimiter,
  qcLimiter,
  securityHeaders,
  uriLengthGuard,
} from './middleware/security.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const FRONTEND_URL_RAW = process.env.FRONTEND_URL || 'http://localhost:1234';
let ALLOWED_ORIGINS = FRONTEND_URL_RAW.split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
if (ALLOWED_ORIGINS.length === 0) ALLOWED_ORIGINS = ['http://localhost:1234'];

configureTrustProxy(app);
app.disable('x-powered-by');
app.use(securityHeaders());
app.use(uriLengthGuard());

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/$/, '');
      const ok = ALLOWED_ORIGINS.some((a) => a === normalized);
      return cb(null, ok);
    },
  })
);

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '48kb' }));

app.use('/api', globalApiLimiter);
app.use('/api/qc', qcLimiter);
app.use('/api/grocery', grocerySearchLimiter);
app.use('/api/location', locationLimiter);
app.use('/api/gemini', geminiLimiter);
app.use('/api/flights', flightsLimiter);

app.get('/api', sendApiIndex);
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api', geminiSearchRouter);
app.use('/api', flightsRouter);
app.use('/api', grocerySearchRouter);
app.use('/api', locationRouter);
app.use('/api', quickcommerceRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Valyux API running on http://localhost:${PORT}`);
  const qc = process.env.QUICKCOMMERCE_API_KEY?.trim();
  console.log(`QuickCommerce API key: ${qc ? 'loaded (set in backend/.env)' : 'missing — add QUICKCOMMERCE_API_KEY'}`);
});
