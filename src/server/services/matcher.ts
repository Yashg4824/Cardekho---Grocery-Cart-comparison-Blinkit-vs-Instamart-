/**
 * @file matcher.ts
 * @description Explainable Deterministic Product Matching Engine.
 * 
 * Resolves the entity alignment problem: Deciding whether Blinkit Listing A and Instamart Listing B
 * represent the exact same physical consumer packaged good (SKU).
 * 
 * Pipeline:
 * 1. Hard Brand Gate (Different brands -> Reject)
 * 2. Hard Unit & Quantity Gate (Different pack sizes -> Reject pair)
 * 3. Variant Conflict Check (Diet vs Regular, Toned vs Gold -> Reject)
 * 4. Token Set Jaccard Similarity Calculation
 * 5. Explainable Rationale Generation
 */

import { MatchDetails, NormalizedProduct } from '../../shared/types.js';

const DISCRIMINATIVE_VARIANTS = [
  'diet', 'zero sugar', 'sugar free',
  'garlic', 'unsalted', 'double toned', 'full cream', 'cow milk',
  'brown bread', 'white bread', 'multigrain', 'atta noodles', 'oats noodles'
];

export class ProductMatcher {
  private static readonly MATCH_THRESHOLD = 0.65;

  /**
   * Computes match confidence and detailed rationale between two normalized products.
   */
  public static evaluateMatch(prodA: NormalizedProduct, prodB: NormalizedProduct): MatchDetails {
    // 1. BRAND GATE: If both have brands and they don't match, reject immediately
    const brandMatched = this.checkBrandCompatibility(prodA.brand, prodB.brand);
    if (prodA.brand && prodB.brand && !brandMatched) {
      return {
        score: 0,
        reason: `Brand mismatch: '${prodA.brand}' vs '${prodB.brand}'`,
        brandMatched: false,
        quantityMatched: false,
        tokenSimilarity: 0
      };
    }

    // 2. QUANTITY GATE: Base unit and net weight/volume must match within 5% tolerance
    const quantityMatched = this.checkQuantityCompatibility(prodA.quantity, prodB.quantity);
    if (!quantityMatched) {
      return {
        score: 0.2, // Small baseline for same brand/item, but not a direct pair
        reason: `Quantity mismatch: ${prodA.quantity.standardAmount}${prodA.quantity.standardBaseUnit} vs ${prodB.quantity.standardAmount}${prodB.quantity.standardBaseUnit}`,
        brandMatched,
        quantityMatched: false,
        tokenSimilarity: 0
      };
    }

    // 3. VARIANT CONFLICT CHECK: e.g., "Diet Coke" vs "Coca-Cola Regular" or "Garlic Butter" vs "Pasteurised Butter"
    const variantConflict = this.findVariantConflict(prodA.title, prodB.title);
    if (variantConflict) {
      return {
        score: 0.3,
        reason: `Variant conflict: ${variantConflict}`,
        brandMatched,
        quantityMatched: true,
        tokenSimilarity: 0.3
      };
    }

    // 4. JACCARD TOKEN SIMILARITY
    const tokenSimilarity = this.calculateJaccardSimilarity(prodA.tokens, prodB.tokens);

    // 5. WEIGHTED CONFIDENCE SCORE
    // Brand match (0.35) + Quantity match (0.35) + Token similarity (0.30)
    let score = (brandMatched ? 0.35 : 0.15) + (quantityMatched ? 0.35 : 0) + (tokenSimilarity * 0.30);
    score = Math.min(1.0, Math.round(score * 100) / 100);

    const isMatch = score >= this.MATCH_THRESHOLD;
    const reason = isMatch
      ? `High confidence match: ${prodA.brand ? `Brand (${prodA.brand}), ` : ''}identical size (${prodA.quantity.standardAmount}${prodA.quantity.standardBaseUnit}), ${(tokenSimilarity * 100).toFixed(0)}% title token overlap.`
      : `Insufficient similarity (${(score * 100).toFixed(0)}% score).`;

    return {
      score,
      reason,
      brandMatched,
      quantityMatched,
      tokenSimilarity: Math.round(tokenSimilarity * 100) / 100
    };
  }

  /**
   * Checks if brands are identical or synonymous (e.g. 'coke' == 'coca-cola').
   */
  private static checkBrandCompatibility(brandA: string | null, brandB: string | null): boolean {
    if (!brandA || !brandB) return true; // Give benefit of doubt if brand is missing
    const a = brandA.toLowerCase().replace(/[^a-z0-9]/g, '');
    const b = brandB.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (a === b) return true;
    if ((a.includes('coke') || a.includes('cocacola')) && (b.includes('coke') || b.includes('cocacola'))) return true;
    if (a.includes('tata') && b.includes('tata')) return true;
    return false;
  }

  /**
   * Checks if standardized weight or volume matches within 5% tolerance.
   */
  private static checkQuantityCompatibility(qtyA: any, qtyB: any): boolean {
    if (qtyA.standardBaseUnit !== qtyB.standardBaseUnit) {
      return false;
    }
    const diff = Math.abs(qtyA.standardAmount - qtyB.standardAmount);
    const max = Math.max(qtyA.standardAmount, qtyB.standardAmount);
    return max > 0 && (diff / max) <= 0.05;
  }

  /**
   * Identifies if one product has a discriminative keyword that the other specifically lacks.
   */
  private static findVariantConflict(titleA: string, titleB: string): string | null {
    const a = titleA.toLowerCase();
    const b = titleB.toLowerCase();

    for (const variant of DISCRIMINATIVE_VARIANTS) {
      const inA = a.includes(variant);
      const inB = b.includes(variant);
      if (inA !== inB) {
        return `'${variant}' present in one listing but not the other`;
      }
    }
    return null;
  }

  /**
   * Computes standard Jaccard token set intersection over union.
   * J(A, B) = |A ∩ B| / |A ∪ B|
   */
  private static calculateJaccardSimilarity(tokensA: string[], tokensB: string[]): number {
    const setA = new Set(tokensA);
    const setB = new Set(tokensB);

    if (setA.size === 0 && setB.size === 0) return 1.0;
    if (setA.size === 0 || setB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const token of setA) {
      if (setB.has(token)) {
        intersectionCount++;
      }
    }

    const unionCount = new Set([...tokensA, ...tokensB]).size;
    return unionCount > 0 ? intersectionCount / unionCount : 0;
  }
}
