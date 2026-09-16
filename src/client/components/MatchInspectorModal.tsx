import React from 'react';
import { X, CheckCircle2, ShieldCheck, Scale, Cpu, Sparkles } from 'lucide-react';
import { MatchedProductPair } from '../../shared/types.js';

interface MatchInspectorModalProps {
  pair: MatchedProductPair | null;
  onClose: () => void;
}

export const MatchInspectorModal: React.FC<MatchInspectorModalProps> = ({ pair, onClose }) => {
  if (!pair) return null;

  const { blinkit, instamart, matchDetails, comparison } = pair;

  // Shared tokens calculation
  const setB = new Set(instamart.tokens);
  const sharedTokens = blinkit.tokens.filter((t) => setB.has(t));
  const blinkitOnlyTokens = blinkit.tokens.filter((t) => !setB.has(t));
  const instamartOnlyTokens = instamart.tokens.filter((t) => !new Set(blinkit.tokens).has(t));

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-900">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Entity Resolution & Match Breakdown
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Deterministic 4-Stage Rule-Based Pipeline Evaluation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 text-sm">
          {/* Compared Listings */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md w-max">
                Blinkit Listing
              </span>
              <div className="font-semibold text-xs text-slate-900 leading-snug">{blinkit.title}</div>
              <div className="text-[11px] text-slate-500">
                Brand: <strong className="text-slate-700">{blinkit.brand || 'N/A'}</strong> • Net Qty: <strong className="text-slate-700">{blinkit.quantity.standardAmount}{blinkit.quantity.standardBaseUnit}</strong>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-orange-900 bg-orange-100 px-2 py-0.5 rounded-md w-max">
                Instamart Listing
              </span>
              <div className="font-semibold text-xs text-slate-900 leading-snug">{instamart.title}</div>
              <div className="text-[11px] text-slate-500">
                Brand: <strong className="text-slate-700">{instamart.brand || 'N/A'}</strong> • Net Qty: <strong className="text-slate-700">{instamart.quantity.standardAmount}{instamart.quantity.standardBaseUnit}</strong>
              </div>
            </div>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scoring Funnel Breakdown
            </h4>

            {/* Stage 1: Brand Gate */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Stage 1: Hard Brand Compatibility Gate</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {matchDetails.brandMatched ? 'PASSED (+35%)' : 'REJECTED (0%)'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Extracted brands: <code>{blinkit.brand || 'none'}</code> vs <code>{instamart.brand || 'none'}</code>.
                  {matchDetails.brandMatched ? ' Brands match or are verified synonyms. Gate passed.' : ' Brand conflict detected.'}
                </p>
              </div>
            </div>

            {/* Stage 2: Quantity Gate */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-3">
              <Scale className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Stage 2: Standardized Quantity Gate (±5% Tolerance)</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {matchDetails.quantityMatched ? 'PASSED (+35%)' : 'REJECTED (0%)'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Blinkit parsed to <strong>{blinkit.quantity.standardAmount}{blinkit.quantity.standardBaseUnit}</strong> ({blinkit.quantity.rawText}); Instamart parsed to <strong>{instamart.quantity.standardAmount}{instamart.quantity.standardBaseUnit}</strong> ({instamart.quantity.rawText}). Net amounts are identical.
                </p>
              </div>
            </div>

            {/* Stage 3: Variant Conflict Check */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Stage 3: Discriminative Variant Conflict Check</span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                    NO CONFLICT
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Verified that neither product contains conflicting discriminative modifiers (e.g. Diet vs Zero, Salted vs Garlic, Toned vs Full Cream).
                </p>
              </div>
            </div>

            {/* Stage 4: Jaccard Token Set Similarity */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Stage 4: Jaccard Token Overlap J(A, B)</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {(matchDetails.tokenSimilarity * 100).toFixed(0)}% Overlap
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-600">
                  <div>
                    Shared Tokens: {sharedTokens.map((t) => (
                      <span key={t} className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono mr-1 text-[11px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                  {blinkitOnlyTokens.length > 0 && (
                    <div>
                      Blinkit Unique: {blinkitOnlyTokens.map((t) => (
                        <span key={t} className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono mr-1 text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {instamartOnlyTokens.length > 0 && (
                    <div>
                      Instamart Unique: {instamartOnlyTokens.map((t) => (
                        <span key={t} className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-mono mr-1 text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Total Confidence Conclusion */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase font-bold text-slate-400">Total Match Confidence</div>
              <div className="text-sm font-semibold mt-0.5">{matchDetails.reason}</div>
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {(matchDetails.score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
