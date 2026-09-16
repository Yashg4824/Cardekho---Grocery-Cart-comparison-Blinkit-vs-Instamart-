import React from 'react';
import { Filter, ArrowUpDown, PiggyBank } from 'lucide-react';
import { MatchedProductPair } from '../../shared/types.js';

export type FilterOption = 'all' | 'blinkit_cheaper' | 'instamart_cheaper' | 'equal';
export type SortOption = 'confidence' | 'savings_desc' | 'price_asc';

interface FilterBarProps {
  pairs: MatchedProductPair[];
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  activeSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  pairs,
  activeFilter,
  onFilterChange,
  activeSort,
  onSortChange
}) => {
  const blinkitCheaperCount = pairs.filter((p) => p.comparison.cheaperPlatform === 'blinkit').length;
  const instamartCheaperCount = pairs.filter((p) => p.comparison.cheaperPlatform === 'instamart').length;
  const equalCount = pairs.filter((p) => p.comparison.cheaperPlatform === 'equal').length;

  // Calculate total basket savings if user buys each item on the cheaper platform
  const totalBasketSavings = pairs.reduce((sum, p) => sum + p.comparison.priceDifference, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>

        <button
          onClick={() => onFilterChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({pairs.length})
        </button>

        <button
          onClick={() => onFilterChange('blinkit_cheaper')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === 'blinkit_cheaper'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          Cheaper on Blinkit ({blinkitCheaperCount})
        </button>

        <button
          onClick={() => onFilterChange('instamart_cheaper')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === 'instamart_cheaper'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
          }`}
        >
          Cheaper on Instamart ({instamartCheaperCount})
        </button>

        {equalCount > 0 && (
          <button
            onClick={() => onFilterChange('equal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'equal'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Equal Price ({equalCount})
          </button>
        )}
      </div>

      {/* Right Controls: Sort & Basket Savings */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        {totalBasketSavings > 0 && (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <PiggyBank className="w-4 h-4 text-emerald-600" />
            <span>Max Savings: ₹{totalBasketSavings}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border-none outline-none cursor-pointer"
          >
            <option value="confidence">Best Match Score</option>
            <option value="savings_desc">Highest Savings First</option>
            <option value="price_asc">Lowest Price First</option>
          </select>
        </div>
      </div>
    </div>
  );
};
