import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { Application, NextFunction, Request, Response } from 'express';

/** Behind a reverse proxy (Railway, Render, Fly, nginx): set TRUST_PROXY=1 so rate limits use client IP from X-Forwarded-For. */
export function configureTrustProxy(app: Application): void {
  const t = process.env.TRUST_PROXY?.trim();
  if (t === '1' || t === 'true') {
    const hops = Math.min(5, Math.max(1, Number(process.env.TRUST_PROXY_HOPS || 1)));
    app.set('trust proxy', hops);
  }
}

export function securityHeaders() {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    frameguard: { action: 'deny' },
    hsts:
      process.env.NODE_ENV === 'production'
        ? { maxAge: 15552000, includeSubDomains: true }
        : false,
    noSniff: true,
    xssFilter: true,
    hidePoweredBy: true,
  });
}

/** Reduce log-stuffing and abuse via huge query strings. */
export function uriLengthGuard(maxLen = 4096) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.originalUrl.length > maxLen) {
      res.status(414).json({ error: 'URI too long' });
      return;
    }
    next();
  };
}

const MS_15M = 15 * 60 * 1000;
const MS_1M = 60 * 1000;

/** Ceiling for all /api traffic per IP. `/api/health` is skipped so uptime monitors are not throttled. */
export const globalApiLimiter = rateLimit({
  windowMs: MS_15M,
  max: Math.max(60, Number(process.env.RATE_LIMIT_GLOBAL_MAX || 400)),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP', code: 'RATE_LIMIT' },
  skip: (req) => {
    const path = (req.originalUrl || '').split('?')[0];
    return path === '/api/health' || path.endsWith('/api/health');
  },
});

export const qcLimiter = rateLimit({
  windowMs: MS_1M,
  max: Math.max(10, Number(process.env.RATE_LIMIT_QC_PER_MIN || 50)),
  message: { error: 'Too many commerce API requests', code: 'RATE_LIMIT_QC' },
});

export const grocerySearchLimiter = rateLimit({
  windowMs: MS_1M,
  max: Math.max(10, Number(process.env.RATE_LIMIT_GROCERY_PER_MIN || 45)),
  message: { error: 'Too many grocery search requests', code: 'RATE_LIMIT_GROCERY' },
});

export const locationLimiter = rateLimit({
  windowMs: MS_1M,
  max: Math.max(20, Number(process.env.RATE_LIMIT_LOCATION_PER_MIN || 100)),
  message: { error: 'Too many location requests', code: 'RATE_LIMIT_LOCATION' },
});

export const geminiLimiter = rateLimit({
  windowMs: MS_1M,
  max: Math.max(5, Number(process.env.RATE_LIMIT_GEMINI_PER_MIN || 30)),
  message: { error: 'Too many AI search requests', code: 'RATE_LIMIT_GEMINI' },
});

export const flightsLimiter = rateLimit({
  windowMs: MS_1M,
  max: Math.max(15, Number(process.env.RATE_LIMIT_FLIGHTS_PER_MIN || 80)),
  message: { error: 'Too many flight requests', code: 'RATE_LIMIT_FLIGHTS' },
});
