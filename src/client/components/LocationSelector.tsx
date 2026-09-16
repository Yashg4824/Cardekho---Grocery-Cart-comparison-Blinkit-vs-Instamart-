import React, { useState } from 'react';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { DeliveryLocation } from '../../shared/types.js';

interface LocationSelectorProps {
  locations: DeliveryLocation[];
  selectedLocationId: string;
  onSelectLocation: (locationId: string) => void;
  onSelectGPS: (lat: number, lng: number, label: string) => void;
  currentLocationLabel?: string;
  isGpsActive?: boolean;
  disabled?: boolean;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  onSelectGPS,
  currentLocationLabel,
  isGpsActive = false,
  disabled = false
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let areaLabel = `GPS: ${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`;

        // Optional quick reverse-geocoding via free public Nominatim or friendly label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.address?.city || 'Local Area';
            const city = data.address?.city || data.address?.state || 'Delhi NCR';
            areaLabel = `GPS: ${suburb}, ${city}`;
          }
        } catch {
          // Fallback to coordinates if reverse-geocoding is blocked
        }

        setIsDetecting(false);
        onSelectGPS(lat, lng, areaLabel);
      },
      (error) => {
        setIsDetecting(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission was denied in your browser settings.');
        } else {
          setGpsError('Unable to retrieve your current location.');
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Preset Location Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
          <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Delivery Dark Store
            </span>
            <select
              value={isGpsActive ? 'gps_active' : selectedLocationId}
              onChange={(e) => {
                if (e.target.value !== 'gps_active') {
                  onSelectLocation(e.target.value);
                }
              }}
              disabled={disabled || isDetecting}
              className="text-xs font-semibold text-slate-800 bg-transparent border-none outline-none cursor-pointer pr-2"
            >
              {isGpsActive && (
                <option value="gps_active">
                  📍 {currentLocationLabel || 'Current GPS Location'}
                </option>
              )}
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.pincode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1-Click GPS Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={disabled || isDetecting}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            isGpsActive
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-emerald-700'
          }`}
          title="Detect my current location coordinates via browser GPS"
        >
          {isDetecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>Locating...</span>
            </>
          ) : isGpsActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>GPS Active</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click GPS</span>
            </>
          )}
        </button>
      </div>

      {/* GPS Error Notice if any */}
      {gpsError && (
        <span className="text-[11px] font-medium text-rose-600 px-1">
          {gpsError}
        </span>
      )}
    </div>
  );
};
