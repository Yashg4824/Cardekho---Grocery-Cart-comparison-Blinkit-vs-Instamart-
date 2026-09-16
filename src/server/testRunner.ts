/**
 * @file testRunner.ts
 * @description End-to-end verification script for normalization, matching, and price comparison.
 */

import { PRESET_LOCATIONS } from './config/locations.js';
import { BlinkitAdapter } from './adapters/blinkit.js';
import { InstamartAdapter } from './adapters/instamart.js';
import { ProductNormalizer } from './services/normalizer.js';
import { PriceComparator } from './services/comparator.js';

async function runTests() {
  console.log('====================================================');
  console.log('Running End-to-End Grocery Price Comparison Test');
  console.log('====================================================\n');

  const location = PRESET_LOCATIONS['bengaluru_indiranagar'];
  const testQueries = ['Amul Butter', 'Maggi', 'Coca Cola', 'Amul Milk'];

  for (const q of testQueries) {
    console.log(`\n🔍 Testing Query: "${q}" (Location: ${location.name})`);
    
    // 1. Parallel Fetch
    const [bkResult, imResult] = await Promise.all([
      BlinkitAdapter.search(q, location),
      InstamartAdapter.search(q, location)
    ]);

    console.log(`   - Blinkit Raw Found: ${bkResult.products.length} (Source: ${bkResult.source})`);
    console.log(`   - Instamart Raw Found: ${imResult.products.length} (Source: ${imResult.source})`);

    // 2. Normalization
    const bkNorm = bkResult.products.map(p => ProductNormalizer.normalize(p, 'blinkit'));
    const imNorm = imResult.products.map(p => ProductNormalizer.normalize(p, 'instamart'));

    // 3. Match & Compare
    const { matchedPairs, unmatchedBlinkit, unmatchedInstamart } = PriceComparator.compareCatalogs(bkNorm, imNorm);

    console.log(`   ✅ Matched Pairs: ${matchedPairs.length}`);
    console.log(`   ℹ️ Unmatched (Blinkit: ${unmatchedBlinkit.length}, Instamart: ${unmatchedInstamart.length})`);

    matchedPairs.forEach((pair, idx) => {
      console.log(`\n   [Pair #${idx + 1}]`);
      console.log(`     Blinkit:   ${pair.blinkit.title} | Net: ${pair.blinkit.quantity.standardAmount}${pair.blinkit.quantity.standardBaseUnit} | Price: ₹${pair.blinkit.price} (${pair.blinkit.unitPriceDisplay})`);
      console.log(`     Instamart: ${pair.instamart.title} | Net: ${pair.instamart.quantity.standardAmount}${pair.instamart.quantity.standardBaseUnit} | Price: ₹${pair.instamart.price} (${pair.instamart.unitPriceDisplay})`);
      console.log(`     Match Score: ${(pair.matchDetails.score * 100).toFixed(0)}% -> ${pair.matchDetails.reason}`);
      console.log(`     Outcome: ${pair.comparison.cheaperPlatform === 'equal' ? 'Equal Price' : `${pair.comparison.cheaperPlatform.toUpperCase()} is cheaper by ₹${pair.comparison.priceDifference} (${pair.comparison.percentageSavings}%)`}`);
    });
  }

  console.log('\n====================================================');
  console.log('All Pipeline Tests Completed Successfully!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
