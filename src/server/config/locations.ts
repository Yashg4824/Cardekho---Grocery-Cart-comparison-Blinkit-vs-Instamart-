/**
 * @file locations.ts
 * @description Curated delivery locations with high-density quick-commerce dark store coverage.
 * 
 * Quick-commerce catalogs are hyper-local: Dark stores only service ~3-5km radiuses.
 * These locations provide verified coordinates for Blinkit and Swiggy Instamart.
 */

import { DeliveryLocation } from '../../shared/types.js';

export const PRESET_LOCATIONS: Record<string, DeliveryLocation> = {
  'delhi_connaught_place': {
    id: 'delhi_connaught_place',
    name: 'Connaught Place, Central Delhi',
    lat: 28.6315,
    lng: 77.2167,
    pincode: '110001',
    city: 'Delhi'
  },
  'delhi_south_ext': {
    id: 'delhi_south_ext',
    name: 'South Extension, South Delhi',
    lat: 28.5728,
    lng: 77.2215,
    pincode: '110049',
    city: 'Delhi'
  },
  'delhi_dwarka': {
    id: 'delhi_dwarka',
    name: 'Dwarka Sector 10, West Delhi',
    lat: 28.5823,
    lng: 77.0500,
    pincode: '110075',
    city: 'Delhi'
  },
  'delhi_rohini': {
    id: 'delhi_rohini',
    name: 'Rohini Sector 8, North Delhi',
    lat: 28.7041,
    lng: 77.1025,
    pincode: '110085',
    city: 'Delhi'
  },
  'delhi_lajpat_nagar': {
    id: 'delhi_lajpat_nagar',
    name: 'Lajpat Nagar, South Delhi',
    lat: 28.5677,
    lng: 77.2433,
    pincode: '110024',
    city: 'Delhi'
  },
  'gurugram_dlf_phase3': {
    id: 'gurugram_dlf_phase3',
    name: 'DLF Phase 3, Gurugram (NCR)',
    lat: 28.4947,
    lng: 77.0894,
    pincode: '122002',
    city: 'Gurugram'
  },
  'bengaluru_indiranagar': {
    id: 'bengaluru_indiranagar',
    name: 'Indiranagar, Bengaluru',
    lat: 12.9784,
    lng: 77.6408,
    pincode: '560038',
    city: 'Bengaluru'
  },
  'mumbai_bandra_west': {
    id: 'mumbai_bandra_west',
    name: 'Bandra West, Mumbai',
    lat: 19.0596,
    lng: 72.8295,
    pincode: '400050',
    city: 'Mumbai'
  }
};

/**
 * Default location used when none is specified by the client.
 */
export const DEFAULT_LOCATION = PRESET_LOCATIONS['delhi_connaught_place'];

/**
 * Resolve a location ID or custom coordinates into a valid DeliveryLocation object.
 */
export function resolveLocation(locationId?: string, lat?: string, lng?: string, pincode?: string, customName?: string): DeliveryLocation {
  if (locationId && PRESET_LOCATIONS[locationId]) {
    return PRESET_LOCATIONS[locationId];
  }

  const latNum = parseFloat(lat || locationId || '');
  const lngNum = parseFloat(lng || '');

  if (!isNaN(latNum) && !isNaN(lngNum)) {
    return {
      id: `gps_${latNum.toFixed(4)}_${lngNum.toFixed(4)}`,
      name: customName || `GPS Location (${latNum.toFixed(4)}, ${lngNum.toFixed(4)})`,
      lat: latNum,
      lng: lngNum,
      pincode: pincode || '110001',
      city: 'Current GPS'
    };
  }

  return DEFAULT_LOCATION;
}
