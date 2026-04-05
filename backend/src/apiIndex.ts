import type { Request, Response } from 'express';

/** GET /api — public route catalog (no secrets). */
export function sendApiIndex(_req: Request, res: Response): void {
  res.json({
    name: 'Valyux API',
    version: '1',
    endpoints: [
      { method: 'GET', path: '/api', description: 'This index' },
      { method: 'GET', path: '/api/health', description: 'Liveness / uptime' },
      { method: 'GET', path: '/api/gemini/search', description: 'Search (Gemini + deeplinks)', query: ['q', 'pincode', 'type'] },
      { method: 'GET', path: '/api/grocery/search', description: 'Grocery live search (QcomPl)', query: ['q', 'pincode'] },
      { method: 'GET', path: '/api/qc/groupsearch', description: 'QuickCommerce group search', query: ['q', 'lat', 'lon', 'pincode'] },
      { method: 'GET', path: '/api/qc/groupeta', description: 'QuickCommerce group ETA', query: ['lat', 'lon', 'pincode'] },
      { method: 'GET', path: '/api/location/autocomplete', description: 'Place autocomplete', query: ['q'] },
      { method: 'GET', path: '/api/location/reverse', description: 'Reverse geocode', query: ['lat', 'lon'] },
      { method: 'GET', path: '/api/location/pincode-geocode', description: 'Pincode → coordinates', query: ['pincode'] },
      {
        method: 'GET',
        path: '/api/flights/search',
        description: 'Flight search (mock provider)',
        query: ['from', 'to', 'departDate', 'returnDate', 'passengers', 'cabinClass', 'tripType'],
      },
      { method: 'GET', path: '/api/flights/airports', description: 'Airport list' },
    ],
  });
}
