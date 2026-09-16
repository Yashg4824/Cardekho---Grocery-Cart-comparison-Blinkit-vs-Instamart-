/**
 * @file types.ts
 * @description Core Data Models & Type Contracts for the Grocery Price Comparison Engine.
 * 
 * Data Flow Architecture:
 * 1. Raw Scraped Data (BlinkitRawItem / InstamartRawItem)
 *    ⬇ (Platform Adapters extract & clean)
 * 2. NormalizedProduct (Canonical format with standardized quantities & unit rates)
 *    ⬇ (Product Matcher pairs candidates)
 * 3. MatchedProductPair / UnmatchedListings
 *    ⬇ (Price Comparator computes deltas & unit economics)
 * 4. ComparisonResponse (Delivered to React Frontend)
 */

// ============================================================================
// 1. LOCATION CONTRACTS
// ============================================================================

/**
 * Represents a geographical delivery point supported by quick-commerce dark stores.
 * 
 * Quick-commerce stores serve limited ~3-5km radiuses from localized warehouses.
 * Latitude and Longitude are mandatory for inventory lookup.
 */
export interface DeliveryLocation {
  /** Unique key identifier for preset locations (e.g., 'bengaluru_indiranagar') */
  id: string;
  /** Human-readable display name (e.g., 'Indiranagar, Bengaluru') */
  name: string;
  /** Latitude coordinate required by Blinkit/Instamart location headers */
  lat: number;
  /** Longitude coordinate required by Blinkit/Instamart location headers */
  lng: number;
  /** 6-digit Indian postal code */
  pincode: string;
  /** State and city label for UI grouping */
  city: string;
}

// ============================================================================
// 2. NORMALIZED PRODUCT CONTRACT
// ============================================================================

/**
 * Standard units of measurement supported by the normalization engine.
 */
export type StandardUnit = 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'pack' | 'unit';

/**
 * Standardized quantity specification extracted from messy product titles.
 * 
 * Examples:
 * - "500 g" -> { value: 500, unit: 'g', standardAmount: 500, standardBaseUnit: 'g', multiplier: 1 }
 * - "1 kg" -> { value: 1, unit: 'kg', standardAmount: 1000, standardBaseUnit: 'g', multiplier: 1 }
 * - "Pack of 4 x 70g" -> { value: 70, unit: 'g', standardAmount: 280, standardBaseUnit: 'g', multiplier: 4 }
 */
export interface NormalizedQuantity {
  /** The extracted numeric value of a single unit */
  value: number;
  /** The unit as parsed from the listing string */
  unit: StandardUnit;
  /** Total standardized base quantity (grams for weight, milliliters for volume, count for pieces) */
  standardAmount: number;
  /** Standard base unit used for normalization comparisons ('g', 'ml', 'pcs') */
  standardBaseUnit: 'g' | 'ml' | 'pcs' | 'unit';
  /** Number of individual units in a multipack (defaults to 1) */
  multiplier: number;
  /** Raw unparsed quantity text from the source website */
  rawText: string;
}

/**
 * Platform origin tag for a product listing.
 */
export type PlatformSource = 'blinkit' | 'instamart';

/**
 * Canonical product representation produced by platform-specific adapters.
 * Both Blinkit and Instamart raw listings are converted into this single shape.
 */
export interface NormalizedProduct {
  /** Unique identifier composed of platform + external ID (e.g., 'blinkit_102948') */
  id: string;
  /** Platform where this item was listed */
  platform: PlatformSource;
  /** Cleaned product display title */
  title: string;
  /** Extracted brand name in lowercase (e.g., 'amul', 'maggi', 'britannia') or null if generic */
  brand: string | null;
  /** Parsed and standardized quantity details */
  quantity: NormalizedQuantity;
  /** Current selling price in INR (₹) */
  price: number;
  /** Maximum Retail Price in INR (₹) if available; used to calculate discounts */
  mrp: number | null;
  /** Calculated price per 100g, 100ml, or single piece in INR */
  unitPrice: number;
  /** Human-readable unit price label (e.g., '₹54.00 / 100g') */
  unitPriceDisplay: string;
  /** Inventory availability flag */
  inStock: boolean;
  /** High-resolution image CDN URL */
  imageUrl: string;
  /** Direct link to the product page on the source platform */
  productUrl: string;
  /** Cleaned token set used by the matching engine */
  tokens: string[];
}

// ============================================================================
// 3. MATCHING & COMPARISON CONTRACTS
// ============================================================================

/**
 * Explanation breakdown for why two listings were considered a match.
 */
export interface MatchDetails {
  /** Confidence score between 0.0 and 1.0 */
  score: number;
  /** Human-readable rationale (e.g., 'Exact brand (Amul), matched quantity (500g), high token similarity') */
  reason: string;
  /** Whether the brand matched exactly */
  brandMatched: boolean;
  /** Whether the net standardized quantity matched within tolerance */
  quantityMatched: boolean;
  /** Jaccard token similarity score between cleaned titles */
  tokenSimilarity: number;
}

/**
 * Price delta and savings analysis between two matched product listings.
 */
export interface PriceComparisonSummary {
  /** Identifies which platform offers the lower price, or if they are equal */
  cheaperPlatform: 'blinkit' | 'instamart' | 'equal';
  /** Absolute difference in selling price in INR (₹) */
  priceDifference: number;
  /** Percentage savings achieved by buying on the cheaper platform */
  percentageSavings: number;
  /** Selling price on Blinkit */
  blinkitPrice: number;
  /** Selling price on Instamart */
  instamartPrice: number;
  /** Price per 100g / 100ml on Blinkit */
  blinkitUnitPriceLabel: string;
  /** Price per 100g / 100ml on Instamart */
  instamartUnitPriceLabel: string;
  /** Comparison of unit economics if pack sizes differ */
  unitPriceCheaperPlatform: 'blinkit' | 'instamart' | 'equal';
}

/**
 * A confirmed matched pair of listings representing the same physical item across both platforms.
 */
export interface MatchedProductPair {
  /** Unique composite ID for the comparison pair */
  id: string;
  /** Blinkit listing details */
  blinkit: NormalizedProduct;
  /** Swiggy Instamart listing details */
  instamart: NormalizedProduct;
  /** Matching metrics and explanation */
  matchDetails: MatchDetails;
  /** Price comparison and unit economics */
  comparison: PriceComparisonSummary;
}

// ============================================================================
// 4. API RESPONSE CONTRACT (DELIVERED TO CLIENT)
// ============================================================================

/**
 * Search response metadata and performance metrics.
 */
export interface SearchExecutionStats {
  /** Total products found on Blinkit */
  blinkitCount: number;
  /** Total products found on Instamart */
  instamartCount: number;
  /** Number of successfully matched pairs */
  matchedPairsCount: number;
  /** Number of items only available on one platform */
  unmatchedCount: number;
  /** Total search & matching execution time in milliseconds */
  executionTimeMs: number;
  /** Whether live data was fetched or fallback fixture was used */
  dataSource: 'live' | 'fixture' | 'hybrid';
  /** Warnings or diagnostic messages (e.g. if one platform timed out) */
  warnings: string[];
}

/**
 * The final top-level JSON response payload returned by GET /api/compare.
 */
export interface ComparisonResponse {
  /** The user's original search keyword (e.g., 'butter') */
  query: string;
  /** Delivery location context used for warehouse catalog lookup */
  location: DeliveryLocation;
  /** Execution diagnostics and result counts */
  stats: SearchExecutionStats;
  /** List of products matched across both platforms with price comparisons */
  matchedPairs: MatchedProductPair[];
  /** Products available only on a single platform (no equivalent match found) */
  unmatched: {
    blinkit: NormalizedProduct[];
    instamart: NormalizedProduct[];
  };
}
