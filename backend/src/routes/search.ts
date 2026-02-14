import { Router, type Request, type Response } from 'express';
import { searchAllPlatforms } from '../services/search.js';
import { getCacheStats } from '../cache/cacheManager.js';

const router = Router();

/**
 * GET /api/search?q=<query>&location=<location>
 *
 * Searches all quick commerce platforms via the data provider API,
 * matches products across platforms, and returns unified results.
 * Results are cached for 10 minutes.
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const query = (req.query.q as string || '').trim();
  const location = (req.query.location as string || process.env.DEFAULT_LOCATION || 'Delhi').trim();

  if (!query) {
    res.status(400).json({ error: 'Missing required query parameter: q' });
    return;
  }

  if (query.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' });
    return;
  }

  if (query.length > 100) {
    res.status(400).json({ error: 'Query must be 100 characters or fewer' });
    return;
  }

  try {
    console.log(`[Search] Query: "${query}", Location: "${location}"`);
    const startTime = Date.now();

    const response = await searchAllPlatforms(query, location);

    const elapsed = Date.now() - startTime;
    console.log(`[Search] Completed in ${elapsed}ms: ${response.results.length} matched products`);

    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Search] Error: ${message}`);
    res.status(500).json({ error: 'Search failed', message });
  }
});

/**
 * GET /api/cache-stats
 */
router.get('/cache-stats', (_req: Request, res: Response) => {
  res.json(getCacheStats());
});

export default router;
