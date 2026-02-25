/* ================================================================== */
/*  Flight types — SOLID: each interface has a single responsibility,  */
/*  interfaces are granular, and a FlightDataProvider abstraction       */
/*  makes it trivial to swap mock data for real APIs later.            */
/* ================================================================== */

/* ── Primitives ────────────────────────────────────────────────────── */

export interface Airport {
  code: string;       // IATA e.g. "DEL"
  name: string;       // "Indira Gandhi International Airport"
  city: string;       // "New Delhi"
  country: string;    // "India"
}

export interface Airline {
  code: string;       // "6E"
  name: string;       // "IndiGo"
  logo: string;       // URL or emoji fallback
  color: string;      // brand accent for UI
}

/* ── Flight structure ──────────────────────────────────────────────── */

export interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  departure: { airport: Airport; time: string; terminal?: string };
  arrival:   { airport: Airport; time: string; terminal?: string };
  durationMin: number;
  aircraft?: string;
}

export interface FlightLeg {
  segments: FlightSegment[];
  totalDurationMin: number;
  stops: number;
  layovers?: { airport: Airport; durationMin: number }[];
}

/* ── Booking platforms ─────────────────────────────────────────────── */

export type PlatformType = 'ota' | 'airline' | 'metasearch';

export interface BookingPlatform {
  id: string;
  name: string;
  logo: string;
  type: PlatformType;
}

export interface PlatformOffer {
  platform: BookingPlatform;
  price: number;
  currency: string;
  bookingUrl: string;
  cabinClass: CabinClass;
  seatsLeft?: number;
  fareBreakdown?: { base: number; taxes: number };
}

/* ── Search params ─────────────────────────────────────────────────── */

export type TripType = 'one_way' | 'round_trip';
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type TimeWindow = 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface Passengers {
  adults: number;
  children: number;
  infants: number;
}

export interface FlightSearchParams {
  from: string;            // airport code
  to: string;
  departDate: string;      // YYYY-MM-DD
  returnDate?: string;
  passengers: Passengers;
  cabinClass: CabinClass;
  tripType: TripType;
}

/* ── Flight result ─────────────────────────────────────────────────── */

export interface FlightResult {
  id: string;
  outbound: FlightLeg;
  inbound?: FlightLeg;       // for round-trip
  offers: PlatformOffer[];
  bestPrice: number;
  valueScore: number;        // 0–100 — our SmartFare USP
}

/* ── Filters ───────────────────────────────────────────────────────── */

export interface FlightFilters {
  maxStops: number | null;               // null = any
  airlines: string[];                     // airline codes, [] = all
  departureWindows: TimeWindow[];        // [] = any
  maxPrice: number | null;
  platforms: string[];                    // platform ids, [] = all
}

export const DEFAULT_FLIGHT_FILTERS: FlightFilters = {
  maxStops: null,
  airlines: [],
  departureWindows: [],
  maxPrice: null,
  platforms: [],
};

export type FlightSortOption = 'best' | 'cheapest' | 'fastest' | 'earliest' | 'latest';

/* ── Data provider interface (SOLID: Dependency Inversion) ─────────── */

export interface FlightDataProvider {
  searchFlights(params: FlightSearchParams): Promise<FlightResult[]>;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function getTimeWindow(iso: string): TimeWindow {
  const h = new Date(iso).getHours();
  if (h < 6) return 'early_morning';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}

export function totalPassengers(p: Passengers): number {
  return p.adults + p.children + p.infants;
}
