# Grocery Price Compare

A full-stack grocery price intelligence engine that allows users to search for grocery and food items and compare matching listings, prices, and unit economics across **Blinkit** and **Swiggy Instamart** for a chosen hyper-local delivery location.

---

## 1. Problem Statement

Quick-commerce grocery platforms in India (Blinkit, Swiggy Instamart, Zepto) operate on hyper-local dark-store models where pricing, stock availability, and pack sizes fluctuate independently across platforms and geographical coordinates. Consumers looking to find the best deal currently have to open multiple mobile apps, search for items separately, manually inspect differing pack sizes (e.g., a 400g loaf vs. a 500g loaf or a 4-pack vs. single unit), and mentally calculate the true unit cost.

This application provides a unified search and comparison engine that:
1. Queries both platforms for a specific delivery location.
2. Normalizes non-uniform product titles and pack variations into canonical base units (grams, milliliters, pieces).
3. Executes deterministic, explainable entity resolution to pair equivalent physical products.
4. Highlights price deltas, percentage savings, and fair unit rates (₹/100g, ₹/100ml) side by side.

---

## 2. Features

Only features actually implemented in this repository are listed below:

* **Unified Grocery Search**: Search bar with submit handling, active loading state, and 6 sample query shortcut pills.
* **Dual-Platform Data Retrieval**: Programmatic retrieval pipeline targeting Blinkit and Swiggy Instamart search endpoints via parallel execution (`Promise.allSettled`).
* **Resilient Catalog Fallback**: Dual-layer fallback to verified catalog fixtures (30+ categories, 100+ items) and a dynamic query generator when third-party WAF/Cloudflare bot protections block direct HTTP requests.
* **Pack Size & Attribute Normalization**: Regex-driven parser (`ProductNormalizer`) that extracts net quantities, handles multipacks (`"Pack of 4 x 70g"` $\to$ `280g`), standardizes units (`kg` $\to$ `g`, `L` $\to$ `ml`), and computes unit rates (`₹/100g`, `₹/100ml`, `₹/pc`).
* **Deterministic 4-Stage Product Matching**: Multi-attribute candidate pairing (`ProductMatcher`) utilizing a Brand Gate, Quantity Tolerance Gate ($\pm5\%$), Variant Conflict Disambiguation, and Jaccard Token Set Similarity.
* **Side-by-Side Price Comparison**: Computes absolute price delta (₹), percentage savings (%), cheaper platform designation, and standard unit rates.
* **1-Click GPS & Multi-Location Support**: Built-in dark-store presets across Delhi (Connaught Place, South Ex, Lajpat Nagar, Dwarka, Rohini), Gurugram (DLF Phase 3), Bengaluru (Indiranagar), and Mumbai (Bandra West), plus a **1-Click Browser GPS Locator** with reverse geocoding.
* **Single-Platform Listing Partitioning**: Items found on only one platform (or failing size/variant compatibility) are segregated into an expandable "Additional Single-Platform Listings" accordion.
* **Interactive Match Inspector Modal**: Clickable diagnostic modal on every card exposing the exact mathematical score and token breakdown of the 4-stage matching funnel.
* **Filtering & Sorting Controls**: Filter listings by "Cheaper on Blinkit", "Cheaper on Instamart", or "Equal Price"; sort by "Best Match Score", "Highest Savings", or "Lowest Price"; with an aggregate **Max Basket Savings** counter.
* **Diagnostic Performance Banner**: Surfaces real-time execution latency (ms), catalog count, active data source tag (`live` vs `fixture`), and diagnostic warnings.

---

## 3. Demo

[Demo Video](https://chatgpt.com/c/YOUR_LINK_HERE)

*(Screen recording demonstrating location selection, 1-Click GPS, product search, multi-pack normalization, variant conflict protection, filtering, and match inspection).*

---

## 4. Tech Stack

| Layer | Technology | Why it is used in THIS project |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript | Provides declarative UI state management for comparison grids, responsive filter states, loading skeletons, and type-safe consumption of shared backend API contracts. |
| **Styling** | Tailwind CSS | Lightweight utility-first styling for dense, side-by-side product comparison cards, platform badges, and responsive desktop/mobile layouts. |
| **Build Tool** | Vite 6 | Fast compilation, Hot Module Replacement (HMR) during development, and optimized single-bundle production asset output. |
| **Backend** | Node.js + Express 4 | Lightweight, unopinionated asynchronous server layer. Provides native event-driven concurrency for parallel external HTTP requests via `Promise.allSettled`. |
| **Language** | TypeScript 5 (NodeNext) | Strict type contracts across both server and client (`src/shared/types.ts`), guaranteeing that raw third-party payloads conform to the canonical `NormalizedProduct` interface. |
| **HTTP Client** | Axios 1.7 | Programmatic HTTP client used in platform adapters with explicit timeout safeguards (2500ms) and custom desktop browser headers. |
| **Matching Engine**| Custom TypeScript Utility | Pure mathematical and heuristic functions (Jaccard token set similarity, regex unit extractors). Avoids heavyweight, opaque ML libraries to ensure 100% explainability during interviews. |
| **Storage** | None (Stateless In-Memory) | Quick-commerce grocery prices and warehouse inventory are ephemeral. Storing records in an SQL database creates stale cache hazards without adding engineering value to real-time price comparison. |

---

## 5. Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser)"]
        UI["React 18 UI (App.tsx)"]
        Loc["LocationSelector (Presets + 1-Click GPS)"]
        Search["SearchBar + Filters + MatchInspector"]
    end

    subgraph ServerLayer ["Backend Layer (Express on Node.js)"]
        Router["Express Router (GET /api/compare)"]
        LocResolver["Location Resolver (locations.ts)"]
        
        subgraph Acquisition ["Data Acquisition Layer"]
            BKAdapter["Blinkit Adapter (blinkit.ts)"]
            IMAdapter["Instamart Adapter (instamart.ts)"]
            FixtureDB["Catalog Fixtures & Dynamic Generator (sampleData.ts)"]
        end

        subgraph Pipeline ["Processing Pipeline"]
            Normalizer["ProductNormalizer (normalizer.ts)"]
            Matcher["ProductMatcher (matcher.ts)"]
            Comparator["PriceComparator (comparator.ts)"]
        end
    end

    subgraph ExternalSources ["External Quick-Commerce Endpoints"]
        BKLive["Blinkit Web API (Cloudflare Protected)"]
        IMLive["Swiggy Instamart DAPI (Akamai Protected)"]
    end

    UI -->|"GET /api/compare?q=...&location=..."| Router
    Loc -->|"Passes lat, lng, pincode"| Router
    Router --> LocResolver
    LocResolver --> BKAdapter
    LocResolver --> IMAdapter

    BKAdapter -.->|"Live HTTP GET (2.5s timeout)"| BKLive
    IMAdapter -.->|"Live HTTP GET (2.5s timeout)"| IMLive

    BKLive -.->|"403 Forbidden (WAF Block)"| BKAdapter
    IMLive -.->|"403 Forbidden (WAF Block)"| IMAdapter

    BKAdapter -->|"Fallback on WAF block"| FixtureDB
    IMAdapter -->|"Fallback on WAF block"| FixtureDB

    BKAdapter -->|"Raw Listings A"| Normalizer
    IMAdapter -->|"Raw Listings B"| Normalizer

    Normalizer -->|"NormalizedProduct[]"| Matcher
    Matcher -->|"Bipartite 1-to-1 Candidates"| Comparator
    Comparator -->|"ComparisonResponse JSON"| Router
    Router -->|"JSON Payload"| UI
```

### Architectural Boundaries
* **Client / Server Boundary**: Communicates over a strict REST contract (`/api/compare`, `/api/locations`) typed by `src/shared/types.ts`.
* **Acquisition Boundary**: Platform adapters isolate network idiosyncrasies, headers, and Cloudflare/WAF fallback handling from the rest of the application.
* **Business Logic Boundary**: Normalization, Matching, and Comparison are pure, stateless deterministic functions with zero network or framework dependencies.

---

## 6. End-to-End Request Flow

Tracing a concrete search for **`"Amul Butter"`** at **`"Indiranagar, Bengaluru"`**:

```text
User enters "Amul Butter"
         │
         ▼
[SearchBar.tsx / App.tsx]
  • Input: query="Amul Butter", location="bengaluru_indiranagar"
  • Dispatches: GET /api/compare?q=Amul+Butter&location=bengaluru_indiranagar
         │
         ▼
[Express Server: src/server/index.ts]
  • Receives query params, invokes resolveLocation('bengaluru_indiranagar')
  • Output: DeliveryLocation { lat: 12.9784, lng: 77.6408, pincode: '560038' }
         │
         ▼
[Parallel Acquisition via Promise.allSettled]
  ├─► BlinkitAdapter.search("Amul Butter", location)
  │     • Dispatches HTTP GET to https://blinkit.com/v1/search?q=Amul+Butter&lat=12.9784&lon=77.6408
  │     • Cloudflare responds with HTTP 403 Forbidden (WAF bot detection).
  │     • Catches exception, routes to getFixtureData("Amul Butter").
  │     • Returns 4 raw Blinkit listings (500g, 100g, Garlic 100g, Mother Dairy 500g).
  │
  └─► InstamartAdapter.search("Amul Butter", location)
        • Dispatches HTTP GET to https://www.swiggy.com/dapi/instamart/search?query=Amul+Butter&lat=...
        • Blocked / challenged by Akamai WAF.
        • Routes to getFixtureData("Amul Butter").
        • Returns 4 raw Instamart listings (500g, 100g, Garlic 100g, President 200g).
         │
         ▼
[ProductNormalizer.normalize(): src/server/services/normalizer.ts]
  • Parses quantities:
      - "500 g" -> { value: 500, unit: 'g', standardAmount: 500, standardBaseUnit: 'g', multiplier: 1 }
  • Extracts brands: "Amul Pasteurised Butter" -> brand: "amul"
  • Tokenizes titles: strips punctuation & stopwords -> ["amul", "pasteurised", "butter"]
  • Calculates unit rates:
      - ₹275 / 500g -> ₹55.00 / 100g
      - ₹270 / 500g -> ₹54.00 / 100g
  • Returns 8 Canonical NormalizedProduct objects.
         │
         ▼
[PriceComparator.compareCatalogs(): src/server/services/comparator.ts]
  • Initiates greedy 1-to-1 bipartite candidate pairing.
  • Calls ProductMatcher.evaluateMatch(blinkitProd, instamartProd):
      - Pair 1: Blinkit Amul 500g vs Instamart Amul 500g
          * Brand Gate: "amul" == "amul" (PASS, +0.35)
          * Quantity Gate: 500g == 500g (PASS, +0.35)
          * Variant Check: No conflict (PASS)
          * Jaccard Overlap: 1.0 (100% token match, +0.30)
          * Total Score: 1.00 (CONFIRMED MATCH)
      - Pair 2: Amul 100g vs Amul 100g -> Score: 0.90 (CONFIRMED MATCH)
      - Pair 3: Amul Garlic 100g vs Amul Garlic 100g -> Score: 1.00 (CONFIRMED MATCH)
      - Mother Dairy 500g (Blinkit) vs President 200g (Instamart): Brand mismatch -> Score: 0.0 (REJECTED)
  • Computes Price Summary for Pair 1:
      - Blinkit: ₹275, Instamart: ₹270
      - Cheaper: Instamart by ₹5 (1.8% savings)
  • Partitions remaining items into unmatchedBlinkit (1) and unmatchedInstamart (1).
         │
         ▼
[API Response Delivery]
  • Constructs ComparisonResponse JSON with execution stats (latency: ~4ms, matchedPairs: 3, unmatched: 2).
         │
         ▼
[Frontend Rendering: App.tsx / ComparisonCard.tsx]
  • Renders 3 side-by-side comparison cards with green savings tags on Instamart for 500g and Blinkit for 100g.
  • Renders expandable "Additional Single-Platform Listings" showing Mother Dairy and President butter.
```

---

## 7. Data Model

The application defines shared TypeScript models in [`src/shared/types.ts`](file:///Users/yashg4824/Downloads/Cardekho%20Assignment/src/shared/types.ts). No database entities exist.

### 1. `DeliveryLocation`
```typescript
interface DeliveryLocation {
  id: string;        // e.g. 'delhi_connaught_place'
  name: string;      // e.g. 'Connaught Place, Central Delhi'
  lat: number;       // e.g. 28.6315
  lng: number;       // e.g. 77.2167
  pincode: string;   // e.g. '110001'
  city: string;      // e.g. 'Delhi'
}
```
* **Why it exists**: Quick-commerce dark stores are geofenced. Latitude and longitude are mandatory parameters for catalog availability.

### 2. `NormalizedQuantity`
```typescript
interface NormalizedQuantity {
  value: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'pack' | 'unit';
  standardAmount: number;                     // Converted base value (grams, ml, or count)
  standardBaseUnit: 'g' | 'ml' | 'pcs' | 'unit';
  multiplier: number;                         // Detected pack multiplier (defaults to 1)
  rawText: string;                            // Original string: "280 g (Pack of 4 x 70g)"
}
```
* **Why it exists**: Both platforms express volume and weight inconsistently (`500 gm`, `0.5 kg`, `500ml`, `Pack of 4`). Standardizing to base units allows fair mathematical comparison.

### 3. `NormalizedProduct` (Canonical Listing)
```typescript
interface NormalizedProduct {
  id: string;                                 // Prefixed composite ID (e.g. 'bk_butter_1')
  platform: 'blinkit' | 'instamart';
  title: string;
  brand: string | null;
  quantity: NormalizedQuantity;
  price: number;                              // In INR (₹)
  mrp: number | null;
  unitPrice: number;                          // Rate per 100g, 100ml, or pc
  unitPriceDisplay: string;                   // e.g. '₹54.00 / 100g'
  inStock: boolean;
  imageUrl: string;
  productUrl: string;
  tokens: string[];                           // Cleaned token array for Jaccard calculation
}
```
* **Why both sources convert into this**: Decouples the matching and comparison algorithms from third-party JSON schemas.

### 4. `MatchedProductPair` & `MatchDetails`
```typescript
interface MatchedProductPair {
  id: string;
  blinkit: NormalizedProduct;
  instamart: NormalizedProduct;
  matchDetails: {
    score: number;                            // 0.0 to 1.0
    reason: string;                           // Human-readable explanation
    brandMatched: boolean;
    quantityMatched: boolean;
    tokenSimilarity: number;
  };
  comparison: {
    cheaperPlatform: 'blinkit' | 'instamart' | 'equal';
    priceDifference: number;
    percentageSavings: number;
    blinkitPrice: number;
    instamartPrice: number;
    blinkitUnitPriceLabel: string;
    instamartUnitPriceLabel: string;
    unitPriceCheaperPlatform: 'blinkit' | 'instamart' | 'equal';
  };
}
```

---

## 8. Data Acquisition

The data acquisition layer consists of [`src/server/adapters/blinkit.ts`](file:///Users/yashg4824/Downloads/Cardekho%20Assignment/src/server/adapters/blinkit.ts) and [`src/server/adapters/instamart.ts`](file:///Users/yashg4824/Downloads/Cardekho%20Assignment/src/server/adapters/instamart.ts).

### Live Request Attempt
* **Blinkit**: Dispatches an HTTP `GET` to `https://blinkit.com/v1/search` with parameters `q`, `lat`, and `lon`, along with desktop headers:
  * `User-Agent`: Desktop Chrome macOS
  * `app_client`: `consumer_web`
  * `lat`, `lon`: Geolocation coordinates
* **Swiggy Instamart**: Dispatches an HTTP `GET` to `https://www.swiggy.com/dapi/instamart/search` with parameters `query`, `lat`, and `lng`, plus origin headers:
  * `Origin`: `https://www.swiggy.com`
  * `Referer`: `https://www.swiggy.com/instamart/search?query=...`

### The Real-World Bot-Protection Reality
Both platforms use commercial enterprise Web Application Firewalls (**Cloudflare WAF** on Blinkit, **Akamai Bot Manager** on Swiggy). Direct requests from Node.js (or curl/axios) are flagged via TLS client fingerprint inspection (JA3/JA4 mismatch against true browsers) and demand JavaScript-generated challenge cookies (`__cf_bm`, `_device_id`). Both endpoints return `HTTP/2 403 Forbidden` (`"Access Denied: Sorry, you have been blocked!"`).

### Fallback Circuit-Breaker Architecture
Rather than crashing or presenting an empty screen, the adapters catch errors and route through a dual-fallback layer in [`src/server/fixtures/sampleData.ts`](file:///Users/yashg4824/Downloads/Cardekho%20Assignment/src/server/fixtures/sampleData.ts):
1. **Curated Fixture Catalog**: Pre-recorded real-world responses for 30+ top grocery categories (Butter, Maggi, Milk, Atta, Rice, Oil, Paneer, Eggs, Chips, Chocolate, Biscuits, Tea, Coffee, Coke, Bread, Salt, Onion, Potato, Dettol, Colgate, Surf Excel).
2. **Dynamic Query Synthesizer**: If an arbitrary or unknown term is searched (e.g. `"Almonds"`, `"Doritos"`), a deterministic hash generator synthesizes realistic paired Blinkit and Instamart listings with real pack sizes and ₹3–₹15 market price variations.
3. **Transparency**: The backend sets `dataSource: "fixture"` and returns a warning string that surfaces as a blue badge in the UI: *"Verified Catalog Fixture (Protected by WAF)"*.

---

## 9. Product Matching

Implemented in [`src/server/services/matcher.ts`](file:///Users/yashg4824/Downloads/Cardekho%20Assignment/src/server/services/matcher.ts).

```text
Normalized Blinkit Product       Normalized Instamart Product
            │                                 │
            └───────────────┬─────────────────┘
                            ▼
            ┌───────────────────────────────┐
            │   Stage 1: Hard Brand Gate    │
            └───────────────────────────────┘
                            │ (Brands conflict -> Score = 0, REJECT)
                            ▼
            ┌───────────────────────────────┐
            │  Stage 2: Hard Quantity Gate  │
            └───────────────────────────────┘
                            │ (Net base amount diff > 5% -> Score = 0.2, REJECT PAIR)
                            ▼
            ┌───────────────────────────────┐
            │ Stage 3: Variant Conflict Gate│
            └───────────────────────────────┘
                            │ (Diet vs Regular, Garlic vs Plain -> Score = 0.3, REJECT)
                            ▼
            ┌───────────────────────────────┐
            │ Stage 4: Jaccard Token Match  │
            └───────────────────────────────┘
                            │ J(A, B) = |A ∩ B| / |A ∪ B|
                            ▼
            ┌───────────────────────────────┐
            │   Weighted Score Calculation  │
            │  Score = Brand(0.35)          │
            │        + Quantity(0.35)       │
            │        + TokenSimilarity(0.30)│
            └───────────────────────────────┘
                            │
               ┌────────────┴────────────┐
               ▼                         ▼
        Score >= 0.65              Score < 0.65
      CONFIRMED MATCH             UNMATCHED LISTING
```

### Concrete Matching Examples

1. **Exact Multi-Pack Match**:
   * Blinkit: `"Maggi 2-Minute Masala Instant Noodles 280 g (Pack of 4 x 70g)"`
   * Instamart: `"Maggi 2 Minute Masala Noodles - 4 Pack 280g"`
   * *Decision*: **MATCH (Score: 94%)**. Brand matches (`maggi`), standardized quantity matches (`280g` vs `280g`), token overlap is 80%.
2. **Size Mismatch Rejection**:
   * Blinkit: `"Amul Pasteurised Butter 500 g"`
   * Instamart: `"Amul Butter 100 g"`
   * *Decision*: **REJECTED (Score: 20%)**. Quantity gate fails (500g vs 100g, delta > 5%). Prevents comparing a ₹275 product against a ₹58 product.
3. **Variant Conflict Disambiguation**:
   * Blinkit: `"Coca-Cola Diet Coke Can 300 ml"`
   * Instamart: `"Coca-Cola Soft Drink Can 300 ml"`
   * *Decision*: **REJECTED (Score: 30%)**. Even though brand (`coca-cola`) and quantity (`300ml`) match, Stage 3 detects that `"diet"` is present in one listing and absent in the other.

### Where Matching Breaks Down (Known Limitations)
* **Unspecified Multi-Packs**: Titles like `"Special Value Saver Combo"` where the raw text omits the individual SKU grammage.
* **Fluid vs Solid Density**: Items sold interchangeably in volume or weight (e.g. Honey sold as `500 g` on Blinkit vs `500 ml` on Instamart).
* **Missing Brand Tags**: Obscure regional products where the brand is embedded in an unstandardized manner within marketing jargon.

---

## 10. Location Handling

Quick-commerce catalogs are bound to localized dark stores servicing a 3–5 km radius.

### How Location Enters the System
1. **Curated Presets**: The user selects from 8 verified dark-store coverage zones via the dropdown:
   * `delhi_connaught_place` (`lat: 28.6315`, `lng: 77.2167`, `pincode: 110001`)
   * `delhi_south_ext` (`lat: 28.5728`, `lng: 77.2215`, `pincode: 110049`)
   * `delhi_dwarka` (`lat: 28.5823`, `lng: 77.0500`, `pincode: 110075`)
   * `delhi_rohini` (`lat: 28.7041`, `lng: 77.1025`, `pincode: 110085`)
   * `delhi_lajpat_nagar` (`lat: 28.5677`, `lng: 77.2433`, `pincode: 110024`)
   * `gurugram_dlf_phase3` (`lat: 28.4947`, `lng: 77.0894`, `pincode: 122002`)
   * `bengaluru_indiranagar` (`lat: 12.9784`, `lng: 77.6408`, `pincode: 560038`)
   * `mumbai_bandra_west` (`lat: 19.0596`, `lng: 72.8295`, `pincode: 400050`)
2. **1-Click Browser GPS**: Clicking **"1-Click GPS"** triggers `navigator.geolocation.getCurrentPosition()`. The client captures exact device coordinates, performs client-side reverse geocoding via OpenStreetMap Nominatim, labels the location (e.g., *"GPS: Hauz Khas, Delhi"*), and passes `lat` and `lng` directly to the backend.
3. **Custom Coordinate Override**: The backend route `/api/compare?lat=...&lng=...` accepts arbitrary coordinates.

### Out of Stock Behavior
If an item is out of stock in a warehouse (`inStock: false`), the application retains the listing but renders a red badge: **"Out of stock on [Platform]"** and omits it from the best-value recommendation.

---

## 11. API Contract

### 1. `GET /api/locations`
Returns the curated list of preset delivery dark stores.

* **Response (200 OK)**:
```json
{
  "locations": [
    {
      "id": "delhi_connaught_place",
      "name": "Connaught Place, Central Delhi",
      "lat": 28.6315,
      "lng": 77.2167,
      "pincode": "110001",
      "city": "Delhi"
    }
  ]
}
```

---

### 2. `GET /api/compare`
Core search and comparison orchestration endpoint.

* **Query Parameters**:
  * `q` (required): Product search query (e.g. `Amul Butter`)
  * `location` (optional): Preset location ID (e.g. `delhi_connaught_place`)
  * `lat`, `lng` (optional): Custom GPS latitude and longitude
  * `name` (optional): Custom display name for GPS coordinates
* **Response (200 OK)**:
```json
{
  "query": "Amul Butter",
  "location": {
    "id": "delhi_connaught_place",
    "name": "Connaught Place, Central Delhi",
    "lat": 28.6315,
    "lng": 77.2167,
    "pincode": "110001",
    "city": "Delhi"
  },
  "stats": {
    "blinkitCount": 4,
    "instamartCount": 4,
    "matchedPairsCount": 3,
    "unmatchedCount": 2,
    "executionTimeMs": 4,
    "dataSource": "fixture",
    "warnings": [
      "Blinkit live API endpoint protected by Cloudflare/WAF; utilizing verified catalog fixture for evaluation."
    ]
  },
  "matchedPairs": [
    {
      "id": "pair_bk_butter_1_im_butter_1",
      "blinkit": {
        "id": "bk_butter_1",
        "platform": "blinkit",
        "title": "Amul Pasteurised Butter",
        "brand": "amul",
        "quantity": {
          "value": 500,
          "unit": "g",
          "standardAmount": 500,
          "standardBaseUnit": "g",
          "multiplier": 1,
          "rawText": "500 g"
        },
        "price": 275,
        "mrp": 275,
        "unitPrice": 55,
        "unitPriceDisplay": "₹55.00 / 100g",
        "inStock": true,
        "imageUrl": "https://cdn.grofers.com/...",
        "productUrl": "https://blinkit.com/prn/...",
        "tokens": ["amul", "pasteurised", "butter"]
      },
      "instamart": {
        "id": "im_butter_1",
        "platform": "instamart",
        "title": "Amul Butter - Pasteurised",
        "brand": "amul",
        "quantity": {
          "value": 500,
          "unit": "g",
          "standardAmount": 500,
          "standardBaseUnit": "g",
          "multiplier": 1,
          "rawText": "500g"
        },
        "price": 270,
        "mrp": 275,
        "unitPrice": 54,
        "unitPriceDisplay": "₹54.00 / 100g",
        "inStock": true,
        "imageUrl": "https://instamart-media-assets.swiggy.com/...",
        "productUrl": "https://www.swiggy.com/instamart/...",
        "tokens": ["amul", "pasteurised", "butter"]
      },
      "matchDetails": {
        "score": 1,
        "reason": "High confidence match: Brand (amul), identical size (500g), 100% title token overlap.",
        "brandMatched": true,
        "quantityMatched": true,
        "tokenSimilarity": 1
      },
      "comparison": {
        "cheaperPlatform": "instamart",
        "priceDifference": 5,
        "percentageSavings": 1.8,
        "blinkitPrice": 275,
        "instamartPrice": 270,
        "blinkitUnitPriceLabel": "₹55.00 / 100g",
        "instamartUnitPriceLabel": "₹54.00 / 100g",
        "unitPriceCheaperPlatform": "instamart"
      }
    }
  ],
  "unmatched": {
    "blinkit": [],
    "instamart": []
  }
}
```
* **Error Responses**:
  * `400 Bad Request`: `{"error": "Search query parameter (q) is required."}`

---

### 3. `GET /api/health`
Health check route returning `{ "status": "ok", "timestamp": "..." }`.

---

## 12. Error Handling

| Scenario | System Behavior | User Interface Indication |
| :--- | :--- | :--- |
| **Empty Search Input** | Backend returns `400 Bad Request`. | Frontend disables search submit button; shows input validation banner. |
| **Third-Party API Block / Timeout** | Caught via `Promise.allSettled`; falls back to curated fixtures. | Yellow diagnostic warning banner displayed; data source marked as `Verified Catalog Fixture`. |
| **One Platform Fails Entirely** | Other platform proceeds normally; unmatched items populate single-platform list. | Stats banner highlights single-platform retrieval count. |
| **No Products Found** | Backend returns 200 OK with empty arrays. | Clean empty state with shopping basket icon: *"No 1-to-1 Matched Pairs Found for '[query]'."* |
| **Out of Stock Item** | Product retained in catalog with `inStock: false`. | Out of stock badge rendered; item excluded from price savings recommendations. |
| **Geolocation Permission Denied** | `navigator.geolocation` error callback captured. | Friendly inline alert: *"Location permission was denied in your browser settings."* |

---

## 13. Key Design Decisions

### Decision 1: Rule-Based Deterministic Matching vs. Machine Learning / Embeddings
* **Choice**: A 4-stage deterministic funnel (Brand $\to$ Quantity $\to$ Variant $\to$ Jaccard).
* **Why**: Grocery comparison requires strict quantity and variant equivalence. Vector embeddings often incorrectly cluster "Amul Butter 100g" and "Amul Butter 500g" as semantically identical (high cosine similarity), creating false price comparisons.
* **Alternative Considered**: Sentence-BERT / OpenAI embeddings or LLM prompting.
* **Trade-off Gained**: 100% explainability in an interview, sub-millisecond execution, zero API costs, zero hallucinated matches.
* **Trade-off Sacrificed**: Cannot resolve highly colloquial slang terms not captured in the synonym dictionary.

### Decision 2: Dual-Adapter Architecture with Circuit-Breaker Fallback
* **Choice**: Attempt live HTTP search calls; fall back to verified catalog fixtures on Cloudflare/WAF block.
* **Why**: Third-party commercial quick-commerce sites actively block non-browser IPs. Relying solely on live scraping would cause the app to crash or show blank pages during evaluator reviews.
* **Alternative Considered**: Headless browser automation (Puppeteer/Playwright) in the request loop.
* **Trade-off Gained**: Guaranteed 100% demo uptime, zero test flakiness, sub-5ms response time during reviews.
* **Trade-off Sacrificed**: Real-time live prices require rotating residential proxy networks not feasible for a standalone local project.

### Decision 3: Stateless In-Memory Architecture (No Database)
* **Choice**: Ephemeral in-memory aggregation per request.
* **Why**: Dark-store inventories change by the hour. Persisting items in MongoDB or PostgreSQL creates stale cache hazards without adding value.
* **Alternative Considered**: SQLite or PostgreSQL caching layer.
* **Trade-off Gained**: Zero setup friction (`npm install && npm start`), no schema migrations, instant startup.
* **Trade-off Sacrificed**: Historical price tracking over time is not supported.

---

## 14. Database / Storage Decision

### Why No Database for the MVP?
A database was deliberately omitted from this project because **the core application problem is real-time catalog alignment, not CRUD persistence**.

* **The Stale Cache Problem**: Quick-commerce stock and prices are hyper-local and volatile. Persisting product records in a database leads to displaying outdated prices that no longer match what is on Blinkit or Instamart dark stores at that minute.
* **Zero Infrastructure Barrier**: Evaluators can clone the repository and run it with one command without installing Docker, configuring PostgreSQL, or seeding database tables.

### What Would Change at Production Scale?
* **Redis In-Memory Cache**: High-volume queries (e.g. "milk", "bread", "maggi") cached with a 3–5 minute TTL to reduce external dark-store request volume by ~80%.
* **PostgreSQL / TimescaleDB**: Only for **historical price trend analytics** (e.g., "Is Amul Butter cheaper on weekends?"), never for the primary live search pipeline.

---

## 15. Design Challenges

### Challenge 1: Non-Standardized Pack Formats
* **Problem**: Blinkit may list `"Maggi 280 g (Pack of 4 x 70g)"` while Instamart lists `"Maggi 4 Pack 280g"`. A naive parser multiplying 280 by 4 computes 1120g.
* **Approach**: `ProductNormalizer.parseQuantity` detects leading net weights (`^280 g`) and avoids double-multiplying when total weight is already stated.
* **Remaining Limitation**: Multi-item promotional combos (e.g. "Buy 1 Shampoo get 1 Conditioner free") lack uniform single-unit net weights.

### Challenge 2: Brand & Variant Overlap False Positives
* **Problem**: "Coca Cola Diet Coke 300ml" and "Coca Cola Soft Drink 300ml" share brand, quantity, and 70% of words, but are different products.
* **Approach**: Stage 3 Variant Conflict check specifically flags discriminative keywords (`diet`, `zero sugar`, `garlic`, `unsalted`, `toned`, `gold`).
* **Remaining Limitation**: Requires maintaining the discriminative variant dictionary as brands launch new sub-products.

### Challenge 3: Third-Party Anti-Bot Systems
* **Problem**: Commercial platforms block non-browser requests with Cloudflare/Akamai challenges.
* **Approach**: Graceful degradation with clear UI disclosure flags and verified fallback fixtures.

---

## 16. Scalability

### Current Implementation
```text
User Search ──► Express API ──► Parallel Platform Adapters ──► Normalizer & Matcher ──► Response
```

### Future Architecture for 100+ Locations & 100,000+ Users
```mermaid
flowchart LR
    Client["Clients (Web / App)"] --> CDN["Cloudflare CDN / API Gateway"]
    CDN --> RateLimiter["Token Bucket Rate Limiter"]
    RateLimiter --> LoadBalancer["Horizontal Load Balancers"]
    
    subgraph AppCluster ["Stateless Node.js App Cluster"]
        App1["App Instance 1"]
        App2["App Instance 2"]
        AppN["App Instance N"]
    end
    LoadBalancer --> AppCluster

    AppCluster --> L1Cache["Redis Cluster (5-min TTL Query Cache)"]
    
    subgraph ScrapingCluster ["Distributed Egress Proxy Worker Fleet"]
        WorkerQueue["RabbitMQ / BullMQ Work Queue"]
        Worker1["Residential Proxy Worker (Blinkit)"]
        Worker2["Residential Proxy Worker (Instamart)"]
    end
    
    L1Cache -.->|"Cache Miss"| WorkerQueue
    WorkerQueue --> Worker1
    WorkerQueue --> Worker2
```

### Necessary Changes at Scale:
1. **Dark-Store ID Geohash Mapping**: Pre-resolve latitude/longitude coordinates into regional Geohash-6 tiles (~1.2km) to share catalog results across nearby users.
2. **Dedicated Residential Proxy Pools**: Enterprise scraping services (BrightData, ScraperAPI) rotating residential IPs with full TLS fingerprint impersonation to bypass Cloudflare.
3. **Asynchronous Stream Ingestion (SSE / WebSockets)**: Return results incrementally as each platform responds rather than waiting for the slowest platform.

---

## 17. Known Limitations

* **No Real-Time Live Scraping in Production**: Due to Cloudflare/Akamai bot blocking on home/cloud IPs, live data requests fallback to catalog fixtures.
* **No Dynamic Cart / Checkout**: You cannot purchase items directly; outbound links take users to the respective platform.
* **Single-Unit Density Assumption**: The normalizer assumes 1g $\approx$ 1ml for density calculations when units are mixed across liquid/solid categories.
* **Catalog Size**: While the dynamic generator handles arbitrary terms, full multi-pack variants are deepest for the 30+ pre-seeded grocery categories.

---

## 18. Project Structure

```
.
├── src/
│   ├── shared/
│   │   └── types.ts                 # Canonical data models & TypeScript interfaces
│   ├── server/
│   │   ├── index.ts                 # Express server & REST endpoint orchestration
│   │   ├── config/
│   │   │   └── locations.ts         # Preset delivery dark stores & coordinate resolver
│   │   ├── adapters/
│   │   │   ├── blinkit.ts           # Blinkit HTTP client & fallback handler
│   │   │   └── instamart.ts         # Swiggy Instamart HTTP client & fallback handler
│   │   ├── fixtures/
│   │   │   └── sampleData.ts        # 30+ category fixtures & dynamic query synthesizer
│   │   ├── services/
│   │   │   ├── normalizer.ts        # Quantity parser, unit converter & brand extractor
│   │   │   ├── matcher.ts           # 4-Stage deterministic entity resolution engine
│   │   │   └── comparator.ts        # Bipartite 1-to-1 matching & price delta calculator
│   │   └── testRunner.ts            # CLI automated test suite
│   └── client/
│       ├── main.tsx                 # React DOM mount point
│       ├── App.tsx                  # Root state management & comparison view
│       ├── index.css                # Tailwind CSS base imports
│       └── components/
│           ├── Header.tsx           # Application bar & platform status tags
│           ├── SearchBar.tsx        # Search input with quick-query recommendation pills
│           ├── LocationSelector.tsx # Preset dropdown & 1-Click GPS locator
│           ├── StatsBanner.tsx      # Performance metrics & active data source badge
│           ├── FilterBar.tsx        # Platform filters, sorting dropdown & basket savings
│           ├── ComparisonCard.tsx   # Side-by-side product card & savings badges
│           ├── MatchInspectorModal.tsx # 4-stage matching math inspection modal
│           └── UnmatchedList.tsx    # Single-platform listings accordion
├── DESIGN_NOTE.md                   # 1-Page Architectural Design Note for submission
├── package.json                     # NPM dependencies & scripts
├── tsconfig.json                    # Strict TypeScript compiler options
├── vite.config.ts                   # Vite bundler & backend API proxy configuration
├── tailwind.config.js               # Tailwind CSS theme extension
└── README.md                        # Primary project documentation
```

---

## 19. Setup & Installation

### Prerequisites
* **Node.js**: v18.0.0 or higher (v20.x recommended)
* **npm**: v9.0.0 or higher

### 1. Clone Repository
```bash
git clone YOUR_REPOSITORY_URL
cd "Cardekho Assignment"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
No environment variables or API keys are required. The system runs out of the box. An optional port override can be passed:
```bash
PORT=3001
```

### 4. Run the Application

#### Option A: Production Single Process (Recommended)
```bash
npm run build
npm start
```
Open **[http://localhost:3001](http://localhost:3001)** in your browser.

#### Option B: Development Mode (Concurrent Vite & Server Watcher)
```bash
npm run dev
```
* Client Interface: **[http://localhost:5173](http://localhost:5173)**
* Server API: **[http://localhost:3001](http://localhost:3001)**

---

## 20. Testing & Verification

### Automated Pipeline Verification
Run the automated CLI test runner verifying normalization, brand gating, size matching, and price deltas:
```bash
npx tsx src/server/testRunner.ts
```
*Tests `Amul Butter`, `Maggi`, `Coca Cola`, and `Amul Milk` across Bengaluru Indiranagar dark store.*

### Automated Type Check
```bash
npm run test:types
```

### Manual Verification Checklist
1. **Start Server**: Run `npm run build && npm start` and open `http://localhost:3001`.
2. **Test 1-Click GPS**: Click the **"1-Click GPS"** button; confirm browser prompts for location and resolves your local coordinates.
3. **Test Search (`Amul Butter`)**:
   * Verify that both 500g and 100g packs appear as separate matched pairs.
   * Verify Instamart is marked cheaper on 500g (₹270 vs ₹275); Blinkit cheaper on 100g (₹56 vs ₹58).
   * Verify unit rate displays `₹54.00 / 100g` vs `₹55.00 / 100g`.
4. **Test Multi-Pack Normalization (`Maggi`)**:
   * Verify `"Pack of 4 x 70g"` on Blinkit correctly matches `"4 Pack 280g"` on Instamart.
5. **Test Variant Conflict Protection (`Coca Cola`)**:
   * Confirm standard 300ml Cans match.
   * Confirm *Diet Coke* and *Zero Sugar* are NOT falsely matched together.
6. **Test Match Inspector**:
   * Click **"Inspect Match"** on any card; verify the modal displays the 4-stage funnel and token breakdown.
7. **Test Single-Platform Listings**:
   * Expand the bottom accordion to verify unmatched single-platform items are preserved.

---

## 21. AI-Assisted Development

AI coding tools were utilized during the development of this project for:
* Accelerating boilerplate setup (TypeScript configurations, Tailwind setup, Vite proxies).
* Generating initial regex patterns for unit conversions.
* Rapidly generating UI component shells.

**Engineering Responsibility & Defense**:
All architectural design decisions—including the **dual-adapter fallback pattern**, **stateless in-memory design**, **the 4-stage deterministic matching algorithm**, **unit economics standardization**, and **location coordinate handling**—were deliberately reviewed, engineered, and verified against the CarDekho assignment requirements.

---

## 22. What I Would Improve With More Time

1. **Headless Browser Worker Pool with Residential Proxies**: Integrate Puppeteer with rotating residential proxies (e.g. BrightData) to bypass Cloudflare/Akamai WAF challenges for real-time live dark-store extraction.
2. **Reverse Pincode Geocoding Service**: Add a direct 6-digit Pincode lookup input using the India Post Pincode API to resolve coordinates without relying on browser GPS.
3. **Split-Basket Cart Optimizer**: A feature calculating optimal mixed-platform ordering (e.g., buying 3 items on Blinkit and 2 on Instamart) factoring in delivery fees.
4. **Fluid / Solid Specific Density Mapping**: Introduce category-specific density tables (e.g. 1 liter of Cooking Oil $\approx$ 910 grams) for enhanced unit conversions.
5. **Persistent Redis Query Cache**: Add an in-memory Redis cluster with 5-minute TTL to reduce redundant external requests.
6. **Unit & Integration Test Coverage**: Add Jest / Vitest test suites with 90%+ code coverage for edge-case unit parsing strings.
