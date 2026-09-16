/**
 * @file normalizer.ts
 * @description Attribute extraction and standardization engine for messy grocery listings.
 * 
 * Core Functions:
 * 1. Parse complex pack formats (e.g. "Pack of 4 x 70g" -> 280 grams).
 * 2. Convert different units (kg -> g, L -> ml) into canonical base units.
 * 3. Extract and normalize brand names.
 * 4. Tokenize titles for explainable set similarity.
 * 5. Compute fair unit economics (₹/100g, ₹/100ml, ₹/unit).
 */

import { NormalizedProduct, NormalizedQuantity, PlatformSource, StandardUnit } from '../../shared/types.js';
import { RawProductListing } from '../fixtures/sampleData.js';

const KNOWN_BRANDS = [
  'amul', 'maggi', 'coca-cola', 'coca cola', 'coke', 'mother dairy',
  'britannia', 'nandini', 'tata salt', 'tata', 'fortune', 'lays', "lay's",
  'nestle', 'cadbury', 'pepsi', 'sprite', 'thums up', 'haldiram', "haldiram's",
  'english oven', 'president', 'parle', 'saffola', 'dettol', 'colgate'
];

const STOP_WORDS = new Set([
  'and', 'with', 'the', 'in', 'of', 'for', 'pack', 'combo', 'special',
  'fresh', 'daily', 'new', 'pure', 'original', 'tasty', 'premium', 'best'
]);

export class ProductNormalizer {

  /**
   * Transforms a raw scraped product into a standardized Canonical Product.
   */
  public static normalize(raw: RawProductListing, platform: PlatformSource): NormalizedProduct {
    const title = raw.title.trim();
    const quantity = this.parseQuantity(raw.quantityString || title);
    const brand = this.extractBrand(title, raw.brand);
    const tokens = this.tokenize(title, brand);

    // Calculate price per standard unit (e.g., per 100g or 100ml or 1 pc)
    const { unitPrice, unitPriceDisplay } = this.calculateUnitPrice(raw.price, quantity);

    return {
      id: raw.id,
      platform,
      title,
      brand,
      quantity,
      price: raw.price,
      mrp: raw.mrp || null,
      unitPrice,
      unitPriceDisplay,
      inStock: raw.inStock,
      imageUrl: raw.imageUrl,
      productUrl: raw.productUrl,
      tokens
    };
  }

  /**
   * Extracts numeric value, unit, pack multipliers, and canonical base amount.
   */
  public static parseQuantity(text: string): NormalizedQuantity {
    const rawText = text.trim();
    const lower = rawText.toLowerCase();

    let multiplier = 1;
    let singleValue = 0;
    let unit: StandardUnit = 'unit';

    // 1. Check if total net weight is explicitly given first (e.g. "280 g (Pack of 4 x 70g)" or "560 g (Pack of 8)")
    const leadingNetMatch = lower.match(/^(\d+(?:\.\d+)?)\s*(g|gm|grams?|kg|ml|l|ltr|litres?|liters?)\b/i);
    if (leadingNetMatch) {
      const netVal = parseFloat(leadingNetMatch[1]);
      const netUnit = leadingNetMatch[2].toLowerCase();

      if (netUnit.startsWith('k')) {
        return {
          value: netVal,
          unit: 'kg',
          standardAmount: netVal * 1000,
          standardBaseUnit: 'g',
          multiplier: 1,
          rawText
        };
      }
      if (netUnit.startsWith('g')) {
        return {
          value: netVal,
          unit: 'g',
          standardAmount: netVal,
          standardBaseUnit: 'g',
          multiplier: 1,
          rawText
        };
      }
      if (netUnit.startsWith('l') && !netUnit.startsWith('m')) {
        return {
          value: netVal,
          unit: 'l',
          standardAmount: netVal * 1000,
          standardBaseUnit: 'ml',
          multiplier: 1,
          rawText
        };
      }
      if (netUnit.startsWith('m')) {
        return {
          value: netVal,
          unit: 'ml',
          standardAmount: netVal,
          standardBaseUnit: 'ml',
          multiplier: 1,
          rawText
        };
      }
    }

    // 2. Detect Multi-Packs like "Pack of 4 x 70g" or "4 x 70 g"
    const multiPackMatch = lower.match(/(?:pack\s*of\s*(\d+)|\b(\d+)\s*x\s*(\d+(?:\.\d+)?))/i);
    if (multiPackMatch) {
      if (multiPackMatch[1]) {
        multiplier = parseInt(multiPackMatch[1], 10);
      } else if (multiPackMatch[2] && multiPackMatch[3]) {
        multiplier = parseInt(multiPackMatch[2], 10);
        singleValue = parseFloat(multiPackMatch[3]);
      }
    }

    // 3. Weight in Kilograms (e.g., "1.5 kg", "1kg", "0.5 kg")
    const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|k\.g)/i);
    if (kgMatch) {
      singleValue = parseFloat(kgMatch[1]);
      unit = 'kg';
      const standardAmount = singleValue * 1000 * (singleValue === parseFloat(multiPackMatch?.[3] || '') ? multiplier : 1);
      return {
        value: singleValue,
        unit: 'kg',
        standardAmount,
        standardBaseUnit: 'g',
        multiplier,
        rawText
      };
    }

    // 4. Weight in Grams (e.g., "500 g", "500g", "500gm", "500 grams")
    const gMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:gm|grams?|g)\b/i);
    if (gMatch) {
      singleValue = parseFloat(gMatch[1]);
      unit = 'g';
      const standardAmount = singleValue * (singleValue === parseFloat(multiPackMatch?.[3] || '') ? multiplier : 1);
      return {
        value: singleValue,
        unit: 'g',
        standardAmount,
        standardBaseUnit: 'g',
        multiplier,
        rawText
      };
    }

    // 5. Volume in Litres (e.g., "1 L", "1.5 l", "1 litre", "1 liter")
    const lMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|ltr|litres?|liters?)\b/i);
    if (lMatch) {
      singleValue = parseFloat(lMatch[1]);
      unit = 'l';
      const standardAmount = singleValue * 1000 * (singleValue === parseFloat(multiPackMatch?.[3] || '') ? multiplier : 1);
      return {
        value: singleValue,
        unit: 'l',
        standardAmount,
        standardBaseUnit: 'ml',
        multiplier,
        rawText
      };
    }

    // 6. Volume in Millilitres (e.g., "300 ml", "300ml", "750 ml")
    const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:ml|millilitres?|milliliters?)\b/i);
    if (mlMatch) {
      singleValue = parseFloat(mlMatch[1]);
      unit = 'ml';
      const standardAmount = singleValue * (singleValue === parseFloat(multiPackMatch?.[3] || '') ? multiplier : 1);
      return {
        value: singleValue,
        unit: 'ml',
        standardAmount,
        standardBaseUnit: 'ml',
        multiplier,
        rawText
      };
    }

    // 7. Pieces / Count (e.g., "6 pcs", "10 slices", "12 units", "6 eggs")
    const pcsMatch = lower.match(/(\d+)\s*(?:pcs|pieces|units|slices|eggs|sheets)\b/i);
    if (pcsMatch) {
      singleValue = parseInt(pcsMatch[1], 10);
      unit = 'pcs';
      const standardAmount = singleValue * multiplier;
      return {
        value: singleValue,
        unit: 'pcs',
        standardAmount,
        standardBaseUnit: 'pcs',
        multiplier,
        rawText
      };
    }

    // Default Fallback
    return {
      value: singleValue || 1,
      unit: 'unit',
      standardAmount: (singleValue || 1) * multiplier,
      standardBaseUnit: 'unit',
      multiplier,
      rawText
    };
  }

  /**
   * Identifies the brand name from catalog metadata or known brand dictionaries.
   */
  public static extractBrand(title: string, rawBrand?: string): string | null {
    if (rawBrand && rawBrand.trim().length > 0) {
      return rawBrand.toLowerCase().trim();
    }

    const lowerTitle = title.toLowerCase();
    for (const brand of KNOWN_BRANDS) {
      if (lowerTitle.includes(brand)) {
        return brand;
      }
    }

    // Heuristic fallback: First word if alphabetic
    const firstWord = title.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    if (firstWord && firstWord.length > 2) {
      return firstWord;
    }

    return null;
  }

  /**
   * Cleans title string into a unique array of searchable lowercase tokens.
   */
  public static tokenize(title: string, brand: string | null): string[] {
    const cleaned = title
      .toLowerCase()
      .replace(/[\(\)\-\_\,\.\+\/\&\:\;]/g, ' ')
      .replace(/\b\d+\s*(?:g|gm|kg|ml|l|ltr|pcs|pack)\b/g, ' ') // strip unit markers from tokens
      .replace(/\s+/g, ' ')
      .trim();

    const rawTokens = cleaned.split(' ');
    const result = new Set<string>();

    for (const token of rawTokens) {
      if (token.length > 1 && !STOP_WORDS.has(token)) {
        result.add(token);
      }
    }

    if (brand) {
      result.add(brand.toLowerCase());
    }

    return Array.from(result);
  }

  /**
   * Computes normalized price per 100g, 100ml, or individual piece.
   */
  private static calculateUnitPrice(price: number, qty: NormalizedQuantity): { unitPrice: number; unitPriceDisplay: string } {
    if (!price || price <= 0 || !qty.standardAmount || qty.standardAmount <= 0) {
      return { unitPrice: price || 0, unitPriceDisplay: `₹${price}` };
    }

    if (qty.standardBaseUnit === 'g') {
      const pricePer100g = (price / qty.standardAmount) * 100;
      return {
        unitPrice: Math.round(pricePer100g * 100) / 100,
        unitPriceDisplay: `₹${pricePer100g.toFixed(2)} / 100g`
      };
    }

    if (qty.standardBaseUnit === 'ml') {
      const pricePer100ml = (price / qty.standardAmount) * 100;
      return {
        unitPrice: Math.round(pricePer100ml * 100) / 100,
        unitPriceDisplay: `₹${pricePer100ml.toFixed(2)} / 100ml`
      };
    }

    if (qty.standardBaseUnit === 'pcs') {
      const pricePerPiece = price / qty.standardAmount;
      return {
        unitPrice: Math.round(pricePerPiece * 100) / 100,
        unitPriceDisplay: `₹${pricePerPiece.toFixed(2)} / pc`
      };
    }

    return {
      unitPrice: price,
      unitPriceDisplay: `₹${price}`
    };
  }
}
