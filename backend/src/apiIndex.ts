import type { Request, Response } from 'express';

/** GET /api — public route catalog (no secrets). */
export function sendApiIndex(_req: Request, res: Response): void {
  res.json({
    name: 'Valyux API',
    version: '1',
    endpoints: [
      { method: 'GET', path: '/api', description: 'This index' },
      { method: 'GET', path: '/api/health', description: 'Liveness / uptime' },
      { method: 'GET', path: '/api/qc/groupsearch', description: 'QuickCommerce group search', query: ['q', 'lat', 'lon', 'pincode'] },
      { method: 'GET', path: '/api/qc/groupeta', description: 'QuickCommerce group ETA', query: ['lat', 'lon', 'pincode'] },
      { method: 'GET', path: '/api/location/autocomplete', description: 'Place autocomplete', query: ['q'] },
      { method: 'GET', path: '/api/location/reverse', description: 'Reverse geocode', query: ['lat', 'lon'] },
      { method: 'GET', path: '/api/location/pincode-geocode', description: 'Pincode → coordinates', query: ['pincode'] },
    ],
  });
}
