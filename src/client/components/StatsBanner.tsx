import React from 'react';
import { Clock, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SearchExecutionStats } from '../../shared/types.js';

interface StatsBannerProps {
  stats: SearchExecutionStats;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col gap-2">
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600 shadow-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>
              Catalog matches: <strong className="text-slate-900">{stats.matchedPairsCount} direct pairs</strong> ({stats.blinkitCount} Blinkit, {stats.instamartCount} Instamart)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="w-4 h-4" />
            <span>Response time: {stats.executionTimeMs}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {stats.dataSource === 'live' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Live Dark Store API
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <CheckCircle2 className="w-3 h-3" /> Verified Catalog Fixture
            </span>
          )}
        </div>
      </div>

      {stats.warnings && stats.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            {stats.warnings.map((warn, i) => (
              <span key={i}>{warn}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
