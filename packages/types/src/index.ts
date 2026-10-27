// Types miroir de la migration 003 V0.3 (~/workspace/liberty-ride/v0.3-artifacts/003_liberty_ride_v0_3.sql).
// Source de vérité : la base Supabase. Ne pas diverger sans migration.

export type ServiceType = 'AIRPORT_CVG' | 'MEDICAL_HOSPITAL' | 'BUSINESS_EXEC' | 'LOCAL_TAXI';

export type RideStatus =
  | 'REQUESTED'
  | 'INTAKE_VALIDATED'
  | 'LEASE_OFFERED_ATTEMPTED_UNKNOWN'
  | 'CONFIRMED_R10'
  | 'LEASE_EXPIRED_ESCALATED'
  | 'DRIVER_REJECTED'
  | 'NO_DRIVER_AVAILABLE'
  | 'DRIVER_EN_ROUTE'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'INVOICED_B2B' | 'REFUNDED';
export type PricingModel = 'FLAT' | 'BASE_PLUS_MILE';

export interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
}

export interface Driver {
  id: string;
  driver_ref: string;
  display_name: string;
  phone: string | null;
  telegram_user_id: number | null;
  telegram_chat_id: number | null;
  is_active: boolean;
}

export interface PricingZone {
  id: string;
  service_type: ServiceType;
  zone_code: string;
  zone_label: string | null;
  pricing_model: PricingModel;
  min_miles: number;
  max_miles: number | null;
  base_fare: number;
  per_mile_rate: number;
  flat_fare: number | null;
  currency: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  service_type: ServiceType;
  zone_code: string | null;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string;
  flight_number: string | null;
  special_needs: string | null;
  distance_miles: number | null;
  estimated_fare: number | null;
  fare_currency: string;
  payment_status: PaymentStatus;
  ride_status: RideStatus;
  assigned_driver_id: string | null;
  assigned_driver_ref: string | null;
  current_fencing_token: string | null;
  lease_attempt: number;
  lease_offered_at: string | null;
  lease_expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constantes publiques (affichage / estimation côté client).
// Le tarif FINAL vient toujours du RPC get_quote via le BFF, jamais de ce
// fichier. Les valeurs ci-dessous sont la grille publique documentée V0.3.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  name: 'Liberty Ride NKY Trans, LLC',
  phone: '(859) 537-1827',
  phoneHref: 'tel:+18595371827',
  website: 'erlangertaxiservice.com',
  area: 'Northern Kentucky — Cincinnati / CVG',
} as const;

/** Grille publique d'ESTIMATION (aéroport CVG). Tarif final = RPC get_quote. */
export const PUBLIC_TARIFF: Array<{
  zone: string;
  label: string;
  fare: string;
  detail: string;
}> = [
  { zone: 'ZONE_1', label: 'Zone 1 — proche CVG', fare: '35 $', detail: 'Forfait' },
  { zone: 'ZONE_2', label: 'Zone 2 — agglomération', fare: '45 $', detail: 'Forfait' },
  { zone: 'ZONE_3', label: 'Zone 3 — éloignée', fare: '15 $ + 2,75 $/mile', detail: 'Base + distance' },
  { zone: 'MEDICAL', label: 'Transport médical', fare: '20 $ + 2,75 $/mile', detail: 'Base + distance' },
];

/** Estimation locale, affichée comme telle. Ne remplace jamais get_quote. */
export function estimateFare(service: ServiceType, zone: string, miles: number): number | null {
  if (service === 'AIRPORT_CVG') {
    if (zone === 'ZONE_1') return 35;
    if (zone === 'ZONE_2') return 45;
    if (zone === 'ZONE_3') return 15 + 2.75 * miles;
  }
  if (service === 'MEDICAL_HOSPITAL') return 20 + 2.75 * miles;
  return null; // BUSINESS_EXEC / LOCAL_TAXI : devis sur demande
}

// ---------------------------------------------------------------------------
// Backend — URLs publiques (aucun secret ici).
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://lgvusahqkdwargrjrmmy.supabase.co';
export const FUNNEL_BASE = 'https://amd-pc-1.tail58ad16.ts.net';

export const N8N_WEBHOOKS = {
  vapiCreateBookingCommit: `${FUNNEL_BASE}/webhook/vapi/create-booking-commit`,
  vapiGetQuote: `${FUNNEL_BASE}/webhook/vapi/get-quote`,
  stripeEvents: `${FUNNEL_BASE}/webhook/stripe/events`,
  internalPaymentLink: `${FUNNEL_BASE}/webhook/internal/payment-link`,
  b2bAccountRequest: `${FUNNEL_BASE}/webhook/b2b/account-request`,
} as const;

// Payload POST /api/bookings (BFF) — mappé sur commit_booking via quote token.
export interface BookingRequest {
  customer_name: string;
  customer_phone: string;
  service_type: ServiceType;
  pickup_address: string;
  dropoff_address: string;
  pickup_datetime: string; // ISO
  flight_number?: string;
  special_needs?: string;
  zone_code?: string;
  distance_miles?: number;
}

// ---------------------------------------------------------------------------
// Interfaces produit fini (spec résolue) : libellés anglais, géographie.
// Aucun secret ici. Les tarifs finaux viennent toujours du BFF (get_quote).
// ---------------------------------------------------------------------------

/** Libellés anglais des 10 états — jamais les enums bruts dans l'UI. */
export const STATUS_LABELS: Record<RideStatus, string> = {
  REQUESTED: 'Requested — waiting for dispatch',
  INTAKE_VALIDATED: 'Request confirmed — finding your driver',
  LEASE_OFFERED_ATTEMPTED_UNKNOWN: 'Driver offer sent',
  CONFIRMED_R10: 'Driver confirmed',
  DRIVER_EN_ROUTE: 'Driver en route',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  LEASE_EXPIRED_ESCALATED: 'Offer expired — owner notified',
  DRIVER_REJECTED: 'Driver declined — finding another driver',
  NO_DRIVER_AVAILABLE: 'No driver available',
};

export const SERVICE_LABELS: Record<ServiceType, string> = {
  AIRPORT_CVG: 'Airport (CVG)',
  MEDICAL_HOSPITAL: 'Medical',
  BUSINESS_EXEC: 'Business',
  LOCAL_TAXI: 'Local taxi',
};

export interface LatLon {
  lat: number;
  lon: number;
}

/** Distance haversine en miles (repli si le routage est indisponible). */
export function haversineMiles(a: LatLon, b: LatLon): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export interface GeocodeHit {
  display: string;
  lat: number;
  lon: number;
}

/** Nominatim (gratuit, ~1 req/s) : recherche d'adresses, liste de choix. */
export async function geocode(query: string): Promise<GeocodeHit[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('Geocoding unavailable');
  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
  return data.map((d) => ({ display: d.display_name, lat: Number(d.lat), lon: Number(d.lon) }));
}

/** Nominatim inverse : coordonnées → adresse (repli épingle manuelle). */
export async function reverseGeocode(p: LatLon): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lon}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return typeof data.display_name === 'string' ? data.display_name : null;
}

export interface RouteResult {
  miles: number;
  /** Géométrie GeoJSON [lon, lat][] si le routeur la fournit. */
  geometry: Array<[number, number]> | null;
  source: 'osrm' | 'haversine';
}

/** OSRM public (gratuit, sans clé) ; repli haversine labellisé. */
export async function routeMiles(a: LatLon, b: LatLon): Promise<RouteResult> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM unavailable');
    const data = (await res.json()) as {
      routes?: Array<{ distance: number; geometry?: { coordinates: Array<[number, number]> } }>;
    };
    const route = data.routes?.[0];
    if (route === undefined) throw new Error('No OSRM route');
    return {
      miles: Math.round((route.distance / 1609.34) * 100) / 100,
      geometry: route.geometry?.coordinates ?? null,
      source: 'osrm',
    };
  } catch {
    return { miles: Math.round(haversineMiles(a, b) * 100) / 100, geometry: null, source: 'haversine' };
  }
}

/** Lien de navigation externe (Google Maps, adresses encodées, sans clé). */
export function googleMapsLink(pickup: string, dropoff: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

/** Libellé « updated X ago » pour le polling de suivi. */
export function timeAgo(iso: string, nowMs: number): string {
  const diff = Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 1000));
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/** Validation téléphone US (10 chiffres après normalisation). */
export function isUsPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  const norm = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return norm.length === 10;
}
