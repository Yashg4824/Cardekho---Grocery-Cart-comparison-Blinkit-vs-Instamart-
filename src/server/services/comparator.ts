/**
 * @file comparator.ts
 * @description Price comparison and entity alignment aggregator.
 * 
 * Responsibilities:
 * 1. Execute optimal 1-to-1 greedy bipartite matching between Blinkit and Instamart product sets.
 * 2. Calculate absolute price differences, percentage savings, and unit rate comparisons.
 * 3. Partition results into confirmed Matched Pairs and single-platform Unmatched Listings.
 */

import { MatchedProductPair, NormalizedProduct, PriceComparisonSummary } from '../../shared/types.js';
import { ProductMatcher } from './matcher.js';

export class PriceComparator {

  /**
   * Aligns two lists of products into matched pairs and unmatched items.
   */
  public static compareCatalogs(
    blinkitProducts: NormalizedProduct[],
    instamartProducts: NormalizedProduct[]
  ): {
    matchedPairs: MatchedProductPair[];
    unmatchedBlinkit: NormalizedProduct[];
    unmatchedInstamart: NormalizedProduct[];
  } {
    const matchedPairs: MatchedProductPair[] = [];
    const usedInstamartIndices = new Set<number>();
    const usedBlinkitIndices = new Set<number>();

    // For each Blinkit product, find the highest-scoring compatible Instamart candidate
    for (let bIdx = 0; bIdx < blinkitProducts.length; bIdx++) {
      const bProd = blinkitProducts[bIdx];
      let bestCandidateIdx = -1;
      let bestMatchDetails = { score: 0, reason: '', brandMatched: false, quantityMatched: false, tokenSimilarity: 0 };

      for (let iIdx = 0; iIdx < instamartProducts.length; iIdx++) {
        if (usedInstamartIndices.has(iIdx)) continue; // Already paired

        const iProd = instamartProducts[iIdx];
        const matchResult = ProductMatcher.evaluateMatch(bProd, iProd);

        if (matchResult.score >= 0.65 && matchResult.score > bestMatchDetails.score) {
          bestMatchDetails = matchResult;
          bestCandidateIdx = iIdx;
        }
      }

      if (bestCandidateIdx !== -1) {
        const matchedInstamartProd = instamartProducts[bestCandidateIdx];
        usedInstamartIndices.add(bestCandidateIdx);
        usedBlinkitIndices.add(bIdx);

        const comparison = this.calculatePriceSummary(bProd, matchedInstamartProd);

        matchedPairs.push({
          id: `pair_${bProd.id}_${matchedInstamartProd.id}`,
          blinkit: bProd,
          instamart: matchedInstamartProd,
          matchDetails: bestMatchDetails,
          comparison
        });
      }
    }

    // Filter out remaining unmatched products
    const unmatchedBlinkit = blinkitProducts.filter((_, idx) => !usedBlinkitIndices.has(idx));
    const unmatchedInstamart = instamartProducts.filter((_, idx) => !usedInstamartIndices.has(idx));

    return {
      matchedPairs,
      unmatchedBlinkit,
      unmatchedInstamart
    };
  }

  /**
   * Computes selling price difference, percentage savings, and unit rate comparisons.
   */
  public static calculatePriceSummary(
    blinkit: NormalizedProduct,
    instamart: NormalizedProduct
  ): PriceComparisonSummary {
    const bPrice = blinkit.price;
    const iPrice = instamart.price;

    let cheaperPlatform: 'blinkit' | 'instamart' | 'equal' = 'equal';
    let priceDiff = 0;
    let percentageSavings = 0;

    if (bPrice < iPrice) {
      cheaperPlatform = 'blinkit';
      priceDiff = iPrice - bPrice;
      percentageSavings = iPrice > 0 ? (priceDiff / iPrice) * 100 : 0;
    } else if (iPrice < bPrice) {
      cheaperPlatform = 'instamart';
      priceDiff = bPrice - iPrice;
      percentageSavings = bPrice > 0 ? (priceDiff / bPrice) * 100 : 0;
    }

    // Unit rate comparison
    let unitCheaper: 'blinkit' | 'instamart' | 'equal' = 'equal';
    if (blinkit.unitPrice < instamart.unitPrice) {
      unitCheaper = 'blinkit';
    } else if (instamart.unitPrice < blinkit.unitPrice) {
      unitCheaper = 'instamart';
    }

    return {
      cheaperPlatform,
      priceDifference: Math.round(priceDiff * 100) / 100,
      percentageSavings: Math.round(percentageSavings * 10) / 10,
      blinkitPrice: bPrice,
      instamartPrice: iPrice,
      blinkitUnitPriceLabel: blinkit.unitPriceDisplay,
      instamartUnitPriceLabel: instamart.unitPriceDisplay,
      unitPriceCheaperPlatform: unitCheaper
    };
  }
}
