import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  currentQuery: string;
}

const SAMPLE_QUERIES = [
  'Amul Butter',
  'Maggi',
  'Amul Milk',
  'Coca Cola',
  'Britannia Bread',
  'Tata Salt'
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, currentQuery }) => {
  const [input, setInput] = useState(currentQuery || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const handlePillClick = (query: string) => {
    setInput(query);
    onSearch(query);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search for grocery items (e.g. Amul Butter, Maggi, Milk, Coke)..."
          disabled={isLoading}
          className="w-full pl-12 pr-28 py-3.5 bg-white border border-slate-300 rounded-2xl shadow-sm text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Comparing...</span>
            </>
          ) : (
            <span>Compare</span>
          )}
        </button>
      </form>

      {/* Quick Search Suggestions */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400">Try searching:</span>
        {SAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handlePillClick(q)}
            disabled={isLoading}
            className="text-xs font-medium px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg transition-colors shadow-2xs"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
