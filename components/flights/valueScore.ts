import type { FlightResult, TimeWindow } from './types';
import { getTimeWindow } from './types';

/* ================================================================== */
/*  Valyux SmartFare — Value Score Algorithm                           */
/*                                                                     */
/*  Instead of just sorting by price, SmartFare considers multiple     */
/*  factors to find the BEST VALUE flight. This is our USP.            */
/*                                                                     */
/*  Score = weighted sum of:                                           */
/*    - Price efficiency    (35%)  — how competitive is the fare       */
/*    - Time efficiency     (25%)  — how short is the journey          */
/*    - Convenience         (20%)  — non-stop > 1-stop > 2+ stops     */
/*    - Schedule fit        (10%)  — does departure time suit prefs    */
/*    - Airline quality     (10%)  — airline reputation tier           */
/* ================================================================== */

const WEIGHTS = {
  price: 0.35,
  duration: 0.25,
  convenience: 0.20,
  schedule: 0.10,
  airline: 0.10,
};

const AIRLINE_TIERS: Record<string, number> = {
  'UK': 0.95,  // Vistara (premium)
  'AI': 0.85,  // Air India
  'SQ': 0.95,  // Singapore Airlines
  'EK': 0.95,  // Emirates
  '6E': 0.80,  // IndiGo (reliable LCC)
  'QP': 0.75,  // Akasa Air
  'SG': 0.65,  // SpiceJet
  'I5': 0.70,  // AirAsia India
};

const SCHEDULE_PREFERENCES: Record<TimeWindow, number> = {
  early_morning: 0.5,
  morning: 0.9,
  afternoon: 0.8,
  evening: 0.85,
  night: 0.4,
};

/* ── Normalize to 0–1 ──────────────────────────────────────────────── */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 1;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/* ── Compute scores for a batch of flights ─────────────────────────── */
export function computeValueScores(flights: FlightResult[]): FlightResult[] {
  if (flights.length === 0) return [];

  const prices    = flights.map(f => f.bestPrice);
  const durations = flights.map(f => f.outbound.totalDurationMin);
  const minPrice  = Math.min(...prices);
  const maxPrice  = Math.max(...prices);
  const minDur    = Math.min(...durations);
  const maxDur    = Math.max(...durations);

  return flights.map(f => {
    // 1) Price: lower is better → invert normalized
    const priceScore = 1 - normalize(f.bestPrice, minPrice, maxPrice);

    // 2) Duration: shorter is better → invert normalized
    const durationScore = 1 - normalize(f.outbound.totalDurationMin, minDur, maxDur);

    // 3) Convenience: fewer stops better
    const stops = f.outbound.stops;
    const convenienceScore = stops === 0 ? 1 : stops === 1 ? 0.55 : 0.25;

    // 4) Schedule fit
    const departTime = f.outbound.segments[0]?.departure.time || '';
    const tw = departTime ? getTimeWindow(departTime) : 'morning';
    const scheduleScore = SCHEDULE_PREFERENCES[tw] ?? 0.5;

    // 5) Airline quality
    const airlineCode = f.outbound.segments[0]?.airline.code || '';
    const airlineScore = AIRLINE_TIERS[airlineCode] ?? 0.6;

    const rawScore =
      WEIGHTS.price       * priceScore +
      WEIGHTS.duration    * durationScore +
      WEIGHTS.convenience * convenienceScore +
      WEIGHTS.schedule    * scheduleScore +
      WEIGHTS.airline     * airlineScore;

    const valueScore = Math.round(rawScore * 100);

    return { ...f, valueScore };
  });
}

/* ── Score label for the UI ────────────────────────────────────────── */
export function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 80) return { text: 'Excellent Value', color: 'emerald' };
  if (score >= 65) return { text: 'Great Value',     color: 'blue' };
  if (score >= 50) return { text: 'Good Value',      color: 'amber' };
  return                   { text: 'Fair',            color: 'gray' };
}
