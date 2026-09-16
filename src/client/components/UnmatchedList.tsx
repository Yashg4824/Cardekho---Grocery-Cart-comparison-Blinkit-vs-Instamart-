import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { NormalizedProduct } from '../../shared/types.js';

interface UnmatchedListProps {
  blinkit: NormalizedProduct[];
  instamart: NormalizedProduct[];
}

export const UnmatchedList: React.FC<UnmatchedListProps> = ({ blinkit, instamart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalUnmatched = blinkit.length + instamart.length;

  if (totalUnmatched === 0) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-800">
            Additional Single-Platform Listings ({totalUnmatched})
          </span>
          <span className="text-xs text-slate-500">
            (Items found on only one service without a 1-to-1 equivalent size/brand match)
          </span>
        </div>
        <div className="text-slate-500">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/40">
          {/* Blinkit Only */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-200 px-3 py-1 rounded-md inline-block mb-3">
              Only on Blinkit ({blinkit.length})
            </h4>
            <div className="flex flex-col gap-3">
              {blinkit.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No extra single-platform items.</p>
              ) : (
                blinkit.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <div className="text-slate-500">{item.quantity.rawText} • {item.unitPriceDisplay}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">₹{item.price}</span>
                      {item.productUrl && (
                        <a href={item.productUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instamart Only */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-900 bg-orange-100 border border-orange-200 px-3 py-1 rounded-md inline-block mb-3">
              Only on Instamart ({instamart.length})
            </h4>
            <div className="flex flex-col gap-3">
              {instamart.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No extra single-platform items.</p>
              ) : (
                instamart.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{item.title}</div>
                      <div className="text-slate-500">{item.quantity.rawText} • {item.unitPriceDisplay}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">₹{item.price}</span>
                      {item.productUrl && (
                        <a href={item.productUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
