import React from 'react';
import { ShoppingBag, ArrowRightLeft } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              GroceryPrice<span className="text-emerald-600">Compare</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Live Price Intelligence: Blinkit vs Swiggy Instamart
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Blinkit
          </span>
          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 border border-orange-200">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Instamart
          </span>
        </div>
      </div>
    </header>
  );
};
