import React from 'react';
import { ExternalLink, Check, AlertCircle, Sparkles } from 'lucide-react';
import { MatchedProductPair, NormalizedProduct } from '../../shared/types.js';

interface ComparisonCardProps {
  pair: MatchedProductPair;
  onInspect?: (pair: MatchedProductPair) => void;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({ pair, onInspect }) => {
  const { blinkit, instamart, comparison, matchDetails } = pair;

  const renderProductSide = (prod: NormalizedProduct, platform: 'blinkit' | 'instamart') => {
    const isCheaper = comparison.cheaperPlatform === platform;
    const isBlinkit = platform === 'blinkit';

    return (
      <div
        className={`flex-1 flex flex-col p-4 rounded-xl transition-all relative ${
          isCheaper
            ? 'bg-emerald-50/70 border-2 border-emerald-500 shadow-sm'
            : 'bg-white border border-slate-200'
        }`}
      >
        {/* Cheaper Best Value Badge */}
        {isCheaper && (
          <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <Check className="w-3 h-3" /> Cheaper by ₹{comparison.priceDifference} ({comparison.percentageSavings}%)
          </div>
        )}

        {/* Platform Origin Badge */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
              isBlinkit
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-orange-100 text-orange-900 border border-orange-300'
            }`}
          >
            {isBlinkit ? 'Blinkit' : 'Instamart'}
          </span>

          {!prod.inStock && (
            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Out of stock
            </span>
          )}
        </div>

        {/* Image & Title */}
        <div className="flex gap-3 mb-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-1 border border-slate-100">
            {prod.imageUrl ? (
              <img
                src={prod.imageUrl}
                alt={prod.title}
                className="w-full h-full object-contain mix-blend-multiply"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-2xl">📦</div>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            {prod.brand && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {prod.brand}
              </span>
            )}
            <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2" title={prod.title}>
              {prod.title}
            </h3>
            <span className="text-xs font-medium text-slate-500 mt-1">
              Net Qty: <strong className="text-slate-700">{prod.quantity.standardAmount}{prod.quantity.standardBaseUnit}</strong> ({prod.quantity.rawText})
            </span>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-black text-slate-900">
                ₹{prod.price}
              </span>
              {prod.mrp && prod.mrp > prod.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{prod.mrp}
                </span>
              )}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Unit rate: <span className="font-semibold text-slate-700">{prod.unitPriceDisplay}</span>
            </div>
          </div>

          {prod.productUrl && (
            <a
              href={prod.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 hover:underline p-1"
            >
              <span>View</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Match Explanation Bar */}
      <div className="mb-4 pb-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 flex-1 min-w-[200px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <span className="font-medium text-slate-500">Match Explanation:</span>
          <span className="font-semibold text-slate-800">{matchDetails.reason}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md">
            Score: {(matchDetails.score * 100).toFixed(0)}%
          </span>
          {onInspect && (
            <button
              onClick={() => onInspect(pair)}
              className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
            >
              Inspect Match
            </button>
          )}
        </div>
      </div>

      {/* Side-by-Side Product Comparison */}
      <div className="flex flex-col md:flex-row gap-4">
        {renderProductSide(blinkit, 'blinkit')}
        {renderProductSide(instamart, 'instamart')}
      </div>
    </div>
  );
};
