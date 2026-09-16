import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Header } from './components/Header.js';
import { LocationSelector } from './components/LocationSelector.js';
import { SearchBar } from './components/SearchBar.js';
import { StatsBanner } from './components/StatsBanner.js';
import { FilterBar, FilterOption, SortOption } from './components/FilterBar.js';
import { ComparisonCard } from './components/ComparisonCard.js';
import { MatchInspectorModal } from './components/MatchInspectorModal.js';
import { UnmatchedList } from './components/UnmatchedList.js';
import { ComparisonResponse, DeliveryLocation, MatchedProductPair } from '../shared/types.js';
import { ShoppingCart, AlertCircle, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('delhi_connaught_place');
  const [query, setQuery] = useState<string>('Amul Butter');
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // P1 Filter, Sort & Modal States
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('confidence');
  const [inspectingPair, setInspectingPair] = useState<MatchedProductPair | null>(null);

  // GPS State
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; label: string } | null>(null);

  // Fetch preset locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get('/api/locations');
        if (res.data?.locations) {
          setLocations(res.data.locations);
          if (res.data.locations[0]) {
            setSelectedLocationId(res.data.locations[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load locations', e);
      }
    };
    fetchLocations();
  }, []);

  // Perform initial search on mount
  useEffect(() => {
    handleSearch('Amul Butter');
  }, []);

  const handleSearch = async (
    searchTerm: string,
    locId?: string,
    customGps?: { lat: number; lng: number; label: string } | null
  ) => {
    const activeGps = customGps !== undefined ? customGps : (isGpsActive ? gpsData : null);
    const activeLocId = locId || selectedLocationId;

    setQuery(searchTerm);
    setLoading(true);
    setError(null);
    setActiveFilter('all'); // Reset filter on new search

    try {
      const params: Record<string, string | number> = {
        q: searchTerm
      };

      if (activeGps) {
        params.lat = activeGps.lat;
        params.lng = activeGps.lng;
        params.name = activeGps.label;
      } else {
        params.location = activeLocId;
      }

      const res = await axios.get<ComparisonResponse>('/api/compare', { params });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch comparison data');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (newLocationId: string) => {
    setIsGpsActive(false);
    setGpsData(null);
    setSelectedLocationId(newLocationId);
    if (query) {
      handleSearch(query, newLocationId, null);
    }
  };

  const handleGpsSelect = (lat: number, lng: number, label: string) => {
    const newGps = { lat, lng, label };
    setIsGpsActive(true);
    setGpsData(newGps);
    if (query) {
      handleSearch(query, undefined, newGps);
    }
  };

  // P1: Filter & Sort Computed Pairs
  const displayedPairs = useMemo(() => {
    if (!data?.matchedPairs) return [];

    let filtered = [...data.matchedPairs];

    if (activeFilter === 'blinkit_cheaper') {
      filtered = filtered.filter((p) => p.comparison.cheaperPlatform === 'blinkit');
    } else if (activeFilter === 'instamart_cheaper') {
      filtered = filtered.filter((p) => p.comparison.cheaperPlatform === 'instamart');
    } else if (activeFilter === 'equal') {
      filtered = filtered.filter((p) => p.comparison.cheaperPlatform === 'equal');
    }

    if (activeSort === 'savings_desc') {
      filtered.sort((a, b) => b.comparison.priceDifference - a.comparison.priceDifference);
    } else if (activeSort === 'price_asc') {
      filtered.sort((a, b) => Math.min(a.blinkit.price, a.instamart.price) - Math.min(b.blinkit.price, b.instamart.price));
    } else {
      // Confidence score sort
      filtered.sort((a, b) => b.matchDetails.score - a.matchDetails.score);
    }

    return filtered;
  }, [data?.matchedPairs, activeFilter, activeSort]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 pb-16">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 flex-1">
        {/* Top Controls: Location & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="w-full md:w-auto">
            <LocationSelector
              locations={locations}
              selectedLocationId={selectedLocationId}
              onSelectLocation={handleLocationChange}
              onSelectGPS={handleGpsSelect}
              currentLocationLabel={gpsData?.label}
              isGpsActive={isGpsActive}
              disabled={loading}
            />
          </div>

          <div className="w-full flex-1">
            <SearchBar
              onSearch={(q) => handleSearch(q)}
              isLoading={loading}
              currentQuery={query}
            />
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="max-w-5xl mx-auto flex flex-col gap-4">
            <div className="h-10 bg-slate-200/70 rounded-xl animate-pulse w-3/4"></div>
            <div className="h-44 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse flex flex-col gap-4">
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-slate-100 rounded-xl"></div>
                <div className="bg-slate-100 rounded-xl"></div>
              </div>
            </div>
            <div className="h-44 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse flex flex-col gap-4">
              <div className="h-4 bg-slate-100 rounded w-1/3"></div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="bg-slate-100 rounded-xl"></div>
                <div className="bg-slate-100 rounded-xl"></div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Results */}
        {!loading && data && (
          <div className="max-w-5xl mx-auto">
            <StatsBanner stats={data.stats} />

            {/* P1 Feature: Filter & Sort Bar */}
            {data.matchedPairs.length > 0 && (
              <FilterBar
                pairs={data.matchedPairs}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                activeSort={activeSort}
                onSortChange={setActiveSort}
              />
            )}

            {/* Matched Pairs Grid */}
            {displayedPairs.length > 0 ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Matched Equivalent Products ({displayedPairs.length})
                  </h2>
                  <span className="text-xs text-slate-500 font-medium">
                    Same brand & equivalent pack size • {data.location.name}
                  </span>
                </div>

                {displayedPairs.map((pair) => (
                  <ComparisonCard
                    key={pair.id}
                    pair={pair}
                    onInspect={(p) => setInspectingPair(p)}
                  />
                ))}
              </div>
            ) : data.matchedPairs.length > 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                <p className="text-sm font-semibold text-slate-700">
                  No items matched the active filter "{activeFilter}".
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  No 1-to-1 Matched Pairs Found for "{data.query}"
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                  We found items on individual platforms, but couldn't verify identical size and brand pairings between Blinkit and Instamart.
                </p>
              </div>
            )}

            {/* Unmatched / Single Platform Listings */}
            <UnmatchedList
              blinkit={data.unmatched.blinkit}
              instamart={data.unmatched.instamart}
            />
          </div>
        )}
      </main>

      {/* P1 Feature: Match Breakdown Inspector Modal */}
      <MatchInspectorModal
        pair={inspectingPair}
        onClose={() => setInspectingPair(null)}
      />
    </div>
  );
};

export default App;
