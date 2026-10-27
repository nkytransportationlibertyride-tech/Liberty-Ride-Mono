/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Liberty Ride NKY Transit - Core Domain Logic & Calculations
 */

export type ServiceCategory = 'cvg' | 'medical' | 'business' | 'local';

export type RideStatus =
  | 'requested'
  | 'request_confirmed'
  | 'driver_offer_sent'
  | 'driver_confirmed'
  | 'driver_en_route'
  | 'completed'
  | 'no_driver_available'
  | 'driver_declined'
  | 'offer_expired'
  | 'cancelled';

export interface FareCalculationResult {
  baseFare: number;
  meteredDistanceRate: number;
  regionalSurcharges: number;
  totalFare: number;
  distanceMiles: number;
  estimatedMinutes: number;
  zone: string;
  isFlat: boolean;
  tariffId: string;
  summaryText: string;
}

export interface WaypointCoordinate {
  name: string;
  aliases: string[];
  zone: 'zone1' | 'zone2' | 'zone3' | 'medical';
  lat: number;
  lng: number;
}

export const VERIFIED_NKY_LOCATIONS: WaypointCoordinate[] = [
  {
    name: '3038 Dixie Hwy, Erlanger, KY 41018',
    aliases: ['3038 dixie hwy', 'dixie hwy hub', 'erlanger hub', 'erlanger'],
    zone: 'zone1',
    lat: 39.0184,
    lng: -84.6033,
  },
  {
    name: 'CVG Airport Terminal 3, Hebron, KY 41048',
    aliases: ['cvg airport', 'cvg', 'cvg terminal', 'cvg main terminal', 'hebron', 'airport'],
    zone: 'zone1',
    lat: 39.0461,
    lng: -84.6621,
  },
  {
    name: 'St. Elizabeth Healthcare, Edgewood, KY 41017',
    aliases: ['st. elizabeth', 'st elizabeth', 'st elizabeth edgewood', 'edgewood'],
    zone: 'medical',
    lat: 39.0235,
    lng: -84.5694,
  },
  {
    name: 'Crestview Hills Town Center, KY 41017',
    aliases: ['crestview hills', 'crestview', 'town center'],
    zone: 'zone1',
    lat: 39.0289,
    lng: -84.5772,
  },
  {
    name: 'Florence Mall / Turfway Park, Florence, KY 41042',
    aliases: ['florence mall', 'florence core', 'turfway park', 'florence'],
    zone: 'zone1',
    lat: 38.9959,
    lng: -84.6291,
  },
  {
    name: 'Covington Riverfront, Covington, KY 41011',
    aliases: ['covington riverfront', 'covington', 'riverfront'],
    zone: 'zone2',
    lat: 39.0837,
    lng: -84.5086,
  },
  {
    name: 'Downtown Cincinnati, Fountain Square, OH 45202',
    aliases: ['downtown cincy', 'downtown cincinnati', 'fountain square', 'cincinnati'],
    zone: 'zone2',
    lat: 39.1015,
    lng: -84.5125,
  },
  {
    name: 'Union / Walton Regional Corridor, KY 41091',
    aliases: ['union', 'walton', 'outer boone'],
    zone: 'zone3',
    lat: 38.9453,
    lng: -84.6711,
  },
  {
    name: 'Independence / Alexandria Outer Kenton, KY 41051',
    aliases: ['independence', 'alexandria', 'outer kenton'],
    zone: 'zone3',
    lat: 38.9428,
    lng: -84.5422,
  },
];

/**
 * Finds location coordinate by text matching
 */
export function matchNKYLocation(addressText: string): WaypointCoordinate | null {
  if (!addressText) return null;
  const lower = addressText.toLowerCase();
  for (const loc of VERIFIED_NKY_LOCATIONS) {
    if (loc.name.toLowerCase().includes(lower) || lower.includes(loc.name.toLowerCase())) {
      return loc;
    }
    for (const alias of loc.aliases) {
      if (lower.includes(alias)) {
        return loc;
      }
    }
  }
  return null;
}

/**
 * Calculates straight-line distance in statute miles between two coords (Haversine formula)
 */
export function calculateStatuteMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth radius in statute miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLine = R * c;
  // Road network factor across NKY I-71/I-75/I-275 corridor is ~1.28x
  return Math.max(2.5, Math.round(straightLine * 1.28 * 10) / 10);
}

/**
 * Calculates guaranteed fare according to regional Northern Kentucky tariffs
 */
export function calculateGuaranteedFare(
  pickup: string,
  dropoff: string,
  category: ServiceCategory
): FareCalculationResult {
  const locA = matchNKYLocation(pickup);
  const locB = matchNKYLocation(dropoff);

  // Default distance if custom address entered
  let distance = 11.4;
  if (locA && locB) {
    distance = calculateStatuteMiles(locA.lat, locA.lng, locB.lat, locB.lng);
  }

  // Estimated minutes: approx 1.3 mins per mile + 4 min terminal/dispatch buffer
  const estimatedMinutes = Math.max(8, Math.round(distance * 1.35 + 3));

  // Determine Zone and Tariff
  const isCincyOrRiver =
    (locA && locA.zone === 'zone2') ||
    (locB && locB.zone === 'zone2') ||
    pickup.toLowerCase().includes('cincinnati') ||
    dropoff.toLowerCase().includes('cincinnati') ||
    pickup.toLowerCase().includes('covington') ||
    dropoff.toLowerCase().includes('covington');

  const isMedicalTarget =
    category === 'medical' ||
    (locB && locB.zone === 'medical') ||
    dropoff.toLowerCase().includes('elizabeth') ||
    dropoff.toLowerCase().includes('hospital') ||
    dropoff.toLowerCase().includes('clinic');

  const isOuterZone3 =
    (locA && locA.zone === 'zone3') ||
    (locB && locB.zone === 'zone3') ||
    pickup.toLowerCase().includes('union') ||
    pickup.toLowerCase().includes('walton') ||
    dropoff.toLowerCase().includes('union') ||
    dropoff.toLowerCase().includes('walton');

  if (category === 'medical' || isMedicalTarget) {
    const base = 20.0;
    // Beyond 5 base miles: $2.75 / statute mile
    const meteredMiles = Math.max(0, distance - 5);
    const meteredRate = Math.round(meteredMiles * 2.75 * 100) / 100;
    const total = base + meteredRate;

    return {
      baseFare: base,
      meteredDistanceRate: meteredRate,
      regionalSurcharges: 0,
      totalFare: total,
      distanceMiles: distance,
      estimatedMinutes,
      zone: 'Medical',
      isFlat: meteredRate === 0,
      tariffId: '#KY-MED-20',
      summaryText: meteredRate > 0 ? '$20.00 Base + $2.75/mi metered' : '$20.00 Flat (Clinic Corridor)',
    };
  }

  if (category === 'business' || isCincyOrRiver) {
    return {
      baseFare: 45.0,
      meteredDistanceRate: 0,
      regionalSurcharges: 0,
      totalFare: 45.0,
      distanceMiles: Math.max(distance, 14.2),
      estimatedMinutes: Math.max(estimatedMinutes, 22),
      zone: 'Zone 2',
      isFlat: true,
      tariffId: '#KY-ZONE2',
      summaryText: '$45.00 Flat (Extended NKY & Downtown Cincy)',
    };
  }

  if (category === 'local' && isOuterZone3) {
    const base = 15.0;
    const meteredMiles = Math.max(0, distance - 4);
    const meteredRate = Math.round(meteredMiles * 2.75 * 100) / 100;
    return {
      baseFare: base,
      meteredDistanceRate: meteredRate,
      regionalSurcharges: 0,
      totalFare: base + meteredRate,
      distanceMiles: distance,
      estimatedMinutes,
      zone: 'Zone 3',
      isFlat: false,
      tariffId: '#KY-ZONE3',
      summaryText: '$15.00 Base + $2.75/mi (Regional Boone & Kenton)',
    };
  }

  if (category === 'local') {
    return {
      baseFare: 28.5,
      meteredDistanceRate: 0,
      regionalSurcharges: 0,
      totalFare: 28.5,
      distanceMiles: distance,
      estimatedMinutes,
      zone: 'Zone 1 Core',
      isFlat: true,
      tariffId: '#KY-LOCAL',
      summaryText: '$28.50 Flat (Erlanger Core Perimeter)',
    };
  }

  // Default Category: CVG Airport Zone 1
  return {
    baseFare: 35.0,
    meteredDistanceRate: 0,
    regionalSurcharges: 0,
    totalFare: 35.0,
    distanceMiles: distance,
    estimatedMinutes,
    zone: 'Zone 1',
    isFlat: true,
    tariffId: '#KY-ZONE1',
    summaryText: '$35.00 Flat (CVG to Erlanger & Immediate Corridor)',
  };
}

/**
 * Derives driver reference UID from phone number convention
 * Example: "+1 (859) 537-1827" -> "8595371827"
 */
export function deriveDriverReference(phone: string): string {
  if (!phone) return '8595371827';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('1')) {
    return clean.slice(1);
  }
  return clean || '8595371827';
}

/**
 * Formats a raw phone string into standard US display: (859) 537-1827
 */
export function formatUSPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const tenDigits = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (tenDigits.length < 10) return phone;
  return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6, 10)}`;
}

/**
 * Validates US phone number (at least 10 valid digits)
 */
export function validateUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith('1')) return true;
  return false;
}

/**
 * Checks if a ride can be canceled per regional policy:
 * Allowed only while driver is NOT yet en route and ride is NOT completed.
 */
export function canCancelRide(status: RideStatus): boolean {
  if (status === 'driver_en_route' || status === 'completed') {
    return false;
  }
  if (status === 'cancelled') {
    return false;
  }
  return true;
}

/**
 * Format current date/time explicitly in Eastern Time (America/New_York)
 */
export function formatEasternTime(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const parts = formatter.format(date);
    // Determine EDT vs EST
    const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
    const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
    const isDST = Math.max(jan, jul) !== date.getTimezoneOffset();
    const tzLabel = isDST ? 'EDT' : 'EST';
    return `${parts} ${tzLabel}`;
  } catch {
    return `${date.toLocaleTimeString()} EDT`;
  }
}

/**
 * Generates tracking reference UUID
 */
export function generateTransitUUID(prefix: string = 'e7b8c24a'): string {
  const randHex = (bytes: number) => {
    let s = '';
    const hex = '0123456789abcdef';
    for (let i = 0; i < bytes * 2; i++) {
      s += hex[Math.floor(Math.random() * hex.length)];
    }
    return s;
  };
  return `${prefix}-${randHex(2)}-4${randHex(1).slice(1)}-b${randHex(1).slice(1)}-${randHex(6)}`;
}

/**
 * Validates scheduled pickup date and time against Eastern Time (America/New_York)
 */
export function validateScheduledPickup(
  pickupDate: string,
  pickupTime: string,
  currentDate: Date = new Date()
): { valid: boolean; error?: string } {
  if (!pickupDate || !pickupDate.trim()) {
    return { valid: false, error: 'Pickup date is required' };
  }
  if (!pickupTime || !pickupTime.trim()) {
    return { valid: false, error: 'Pickup time is required' };
  }

  // Get current date in America/New_York (YYYY-MM-DD)
  const nyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayNY = nyFormatter.format(currentDate); // Format: YYYY-MM-DD

  // Direct date comparison
  if (pickupDate < todayNY) {
    return { valid: false, error: 'Pickup date cannot be in the past' };
  }

  // If date is today, check time if in HH:MM format
  if (pickupDate === todayNY) {
    const timeMatch = pickupTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const meridiem = timeMatch[3]?.toUpperCase();

      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;

      // Current NY hour & min
      const nyTimeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const [curHourStr, curMinStr] = nyTimeFormatter.format(currentDate).split(':');
      const curHours = parseInt(curHourStr, 10);
      const curMins = parseInt(curMinStr, 10);

      const scheduledTotalMins = hours * 60 + minutes;
      const currentTotalMins = curHours * 60 + curMins;

      // Allow 5 min buffer
      if (scheduledTotalMins < currentTotalMins - 5) {
        return { valid: false, error: 'Pickup time for today cannot be in the past' };
      }
    }
  }

  return { valid: true };
}

/**
 * Calculates the total fares paid across completed rides
 */
export function calculateTotalFaresPaid(
  rides: { fareEstimate: number; status: RideStatus }[]
): number {
  return rides
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + (r.fareEstimate || 0), 0);
}

/**
 * Formats a scheduled date and time into a clear Eastern Time string
 */
export function formatScheduledDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return timeStr || 'Scheduled';
  
  // Format dateStr (e.g. 2026-10-28)
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return `${dateStr} ${timeStr}`;

  const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = `${monthNames[dateObj.getUTCMonth()]} ${dateObj.getUTCDate()}, ${dateObj.getUTCFullYear()}`;

  return `${formattedDate} • ${timeStr} EDT`;
}

