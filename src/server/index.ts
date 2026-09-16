/**
 * @file index.ts
 * @description Express API Server for Grocery Price Comparison Engine.
 * 
 * Orchestrates:
 * 1. Parallel data acquisition from Blinkit & Swiggy Instamart.
 * 2. Attribute normalization and unit calculation.
 * 3. Deterministic product matching.
 * 4. Price delta and unit economics aggregation.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { PRESET_LOCATIONS, resolveLocation } from './config/locations.js';
import { BlinkitAdapter } from './adapters/blinkit.js';
import { InstamartAdapter } from './adapters/instamart.js';
import { ProductNormalizer } from './services/normalizer.js';
import { PriceComparator } from './services/comparator.js';
import { ComparisonResponse, NormalizedProduct } from '../shared/types.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

/**
 * GET /api/locations
 * Returns the list of curated quick-commerce delivery locations.
 */
app.get('/api/locations', (req: Request, res: Response) => {
  res.json({
    locations: Object.values(PRESET_LOCATIONS)
  });
});

/**
 * GET /api/compare
 * Main search and price comparison orchestration endpoint.
 * 
 * Query Parameters:
 * - q / query: Search term (e.g. "Amul Butter", "Maggi")
 * - location / locationId: Location preset ID (e.g. "bengaluru_indiranagar")
 * - lat, lng, pincode: Optional custom coordinate overrides
 */
app.get('/api/compare', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const query = (req.query.q as string || req.query.query as string || '').trim();
  const locationId = req.query.location as string || req.query.locationId as string;
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;
  const pincode = req.query.pincode as string;
  const locationName = req.query.name as string || req.query.locationName as string;

  if (!query) {
    return res.status(400).json({ error: 'Search query parameter (q) is required.' });
  }

  const location = resolveLocation(locationId, lat, lng, pincode, locationName);
  const warnings: string[] = [];

  // Step 1: Parallel Data Acquisition with Promise.allSettled
  const [blinkitResult, instamartResult] = await Promise.allSettled([
    BlinkitAdapter.search(query, location),
    InstamartAdapter.search(query, location)
  ]);

  let rawBlinkitItems: any[] = [];
  let rawInstamartItems: any[] = [];
  let blinkitSource: 'live' | 'fixture' = 'live';
  let instamartSource: 'live' | 'fixture' = 'live';

  if (blinkitResult.status === 'fulfilled') {
    rawBlinkitItems = blinkitResult.value.products;
    blinkitSource = blinkitResult.value.source;
    if (blinkitResult.value.warning) warnings.push(blinkitResult.value.warning);
  } else {
    warnings.push(`Blinkit service exception: ${blinkitResult.reason?.message || 'Network error'}`);
  }

  if (instamartResult.status === 'fulfilled') {
    rawInstamartItems = instamartResult.value.products;
    instamartSource = instamartResult.value.source;
    if (instamartResult.value.warning) warnings.push(instamartResult.value.warning);
  } else {
    warnings.push(`Instamart service exception: ${instamartResult.reason?.message || 'Network error'}`);
  }

  // Step 2: Attribute Normalization
  const normalizedBlinkit: NormalizedProduct[] = rawBlinkitItems.map(item =>
    ProductNormalizer.normalize(item, 'blinkit')
  );

  const normalizedInstamart: NormalizedProduct[] = rawInstamartItems.map(item =>
    ProductNormalizer.normalize(item, 'instamart')
  );

  // Step 3: Product Matching & Price Comparison
  const { matchedPairs, unmatchedBlinkit, unmatchedInstamart } = PriceComparator.compareCatalogs(
    normalizedBlinkit,
    normalizedInstamart
  );

  const executionTimeMs = Date.now() - startTime;
  const overallSource = (blinkitSource === 'fixture' || instamartSource === 'fixture')
    ? (blinkitSource === 'fixture' && instamartSource === 'fixture' ? 'fixture' : 'hybrid')
    : 'live';

  const responsePayload: ComparisonResponse = {
    query,
    location,
    stats: {
      blinkitCount: normalizedBlinkit.length,
      instamartCount: normalizedInstamart.length,
      matchedPairsCount: matchedPairs.length,
      unmatchedCount: unmatchedBlinkit.length + unmatchedInstamart.length,
      executionTimeMs,
      dataSource: overallSource,
      warnings
    },
    matchedPairs,
    unmatched: {
      blinkit: unmatchedBlinkit,
      instamart: unmatchedInstamart
    }
  };

  return res.json(responsePayload);
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend static build files if available
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In compiled dist/server/index.js, __dirname is .../dist/server
// Frontend build is located in .../dist/client
const candidatePath1 = path.resolve(__dirname, '../client');
const candidatePath2 = path.resolve(__dirname, '../../dist');
const clientDistPath = fs.existsSync(candidatePath1) ? candidatePath1 : candidatePath2;

app.use(express.static(clientDistPath));

app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Grocery Price Compare API Server is active. Run Vite dev server for client interface.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`[Grocery Price Compare] Server running on http://localhost:${PORT}`);
});
