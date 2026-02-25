import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { useDebounce } from '../../utils/useDebounce';
import { AIRPORTS, MOCK_FLIGHTS, AIRLINES, BOOKING_PLATFORMS, buildBookingUrl } from './data';
import { computeValueScores } from './valueScore';
import type {
  Airport, FlightResult, FlightSearchParams, FlightFilters,
  FlightSortOption, TimeWindow, Airline, BookingPlatform,
} from './types';
import { getTimeWindow, DEFAULT_FLIGHT_FILTERS } from './types';

const API_BASE = 'http://localhost:5000/api';

/* ================================================================== */
/*  Fuzzy airport search (Fuse.js)                                     */
/* ================================================================== */

const airportFuse = new Fuse(AIRPORTS, {
  keys: [
    { name: 'city', weight: 3 },
    { name: 'code', weight: 2 },
    { name: 'name', weight: 1 },
  ],
  threshold: 0.35,
  distance: 80,
  minMatchCharLength: 1,
});

export function useAirportSearch(query: string): Airport[] {
  return useMemo(() => {
    if (!query.trim()) return AIRPORTS.slice(0, 6);
    return airportFuse.search(query, { limit: 6 }).map(r => r.item);
  }, [query]);
}

/* ================================================================== */
/*  Apply filters & sort to flight results                             */
/* ================================================================== */

function applyFiltersAndSort(
  flights: FlightResult[],
  filters: FlightFilters,
  sort: FlightSortOption,
): FlightResult[] {
  let out = [...flights];

  if (filters.maxStops !== null) {
    out = out.filter(f => f.outbound.stops <= filters.maxStops!);
  }

  if (filters.airlines.length > 0) {
    out = out.filter(f =>
      f.outbound.segments.some(s => filters.airlines.includes(s.airline.code)),
    );
  }

  if (filters.departureWindows.length > 0) {
    out = out.filter(f => {
      const time = f.outbound.segments[0]?.departure.time;
      if (!time) return true;
      return filters.departureWindows.includes(getTimeWindow(time));
    });
  }

  if (filters.maxPrice !== null) {
    out = out.filter(f => f.bestPrice <= filters.maxPrice!);
  }

  if (filters.platforms.length > 0) {
    out = out.filter(f =>
      f.offers.some(o => filters.platforms.includes(o.platform.id)),
    );
  }

  switch (sort) {
    case 'cheapest':
      out.sort((a, b) => a.bestPrice - b.bestPrice);
      break;
    case 'fastest':
      out.sort((a, b) => a.outbound.totalDurationMin - b.outbound.totalDurationMin);
      break;
    case 'earliest':
      out.sort((a, b) => {
        const ta = a.outbound.segments[0]?.departure.time || '';
        const tb = b.outbound.segments[0]?.departure.time || '';
        return ta.localeCompare(tb);
      });
      break;
    case 'latest':
      out.sort((a, b) => {
        const ta = a.outbound.segments[0]?.departure.time || '';
        const tb = b.outbound.segments[0]?.departure.time || '';
        return tb.localeCompare(ta);
      });
      break;
    case 'best':
    default:
      out.sort((a, b) => b.valueScore - a.valueScore);
      break;
  }

  return out;
}

/* ================================================================== */
/*  Populate booking URLs in offers                                    */
/* ================================================================== */

function enrichOfferUrls(flights: FlightResult[], from: string, to: string, date: string): FlightResult[] {
  return flights.map(f => ({
    ...f,
    offers: f.offers.map(o => ({
      ...o,
      bookingUrl: o.bookingUrl || buildBookingUrl(o.platform.id, from, to, date),
    })),
  }));
}

/* ================================================================== */
/*  useFlightSearch — main search hook                                 */
/* ================================================================== */

interface FlightSearchState {
  results: FlightResult[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  searchParams: FlightSearchParams | null;
}

export function useFlightSearch(
  filters: FlightFilters,
  sort: FlightSortOption,
) {
  const [state, setState] = useState<FlightSearchState>({
    results: [], isLoading: false, error: null, hasSearched: false, searchParams: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (params: FlightSearchParams) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState(s => ({ ...s, isLoading: true, error: null, searchParams: params }));

    try {
      const qs = new URLSearchParams({
        from: params.from,
        to: params.to,
        departDate: params.departDate,
        cabinClass: params.cabinClass,
        tripType: params.tripType,
      });
      if (params.returnDate) qs.set('returnDate', params.returnDate);

      const res = await fetch(`${API_BASE}/flights/search?${qs}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();

      let flights = computeValueScores(data.results as FlightResult[]);
      flights = enrichOfferUrls(flights, params.from, params.to, params.departDate);
      flights = applyFiltersAndSort(flights, filters, sort);
      setState({ results: flights, isLoading: false, error: null, hasSearched: true, searchParams: params });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;

      console.warn('Backend unavailable, using mock flights');
      let flights = computeValueScores([...MOCK_FLIGHTS]);
      flights = enrichOfferUrls(flights, params.from, params.to, params.departDate);
      flights = applyFiltersAndSort(flights, filters, sort);
      setState({ results: flights, isLoading: false, error: null, hasSearched: true, searchParams: params });
    }
  }, [filters, sort]);

  const filteredResults = useMemo(() => {
    if (!state.hasSearched) return state.results;
    let flights = computeValueScores(state.results);
    return applyFiltersAndSort(flights, filters, sort);
  }, [state.results, state.hasSearched, filters, sort]);

  return {
    ...state,
    results: state.hasSearched ? filteredResults : state.results,
    search,
  };
}

/* ================================================================== */
/*  Helper hooks                                                       */
/* ================================================================== */

export function useAvailableAirlines(results: FlightResult[]): Airline[] {
  return useMemo(() => {
    const codes = new Set<string>();
    results.forEach(f => f.outbound.segments.forEach(s => codes.add(s.airline.code)));
    return AIRLINES.filter(a => codes.has(a.code));
  }, [results]);
}

export function useAvailablePlatforms(results: FlightResult[]): BookingPlatform[] {
  return useMemo(() => {
    const ids = new Set<string>();
    results.forEach(f => f.offers.forEach(o => ids.add(o.platform.id)));
    return BOOKING_PLATFORMS.filter(p => ids.has(p.id));
  }, [results]);
}

export function usePriceRange(results: FlightResult[]): { min: number; max: number } {
  return useMemo(() => {
    if (results.length === 0) return { min: 0, max: 10000 };
    const prices = results.map(f => f.bestPrice);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [results]);
}

export function useActiveFlightFiltersCount(filters: FlightFilters): number {
  let c = 0;
  if (filters.maxStops !== null) c++;
  c += filters.airlines.length;
  c += filters.departureWindows.length;
  if (filters.maxPrice !== null) c++;
  c += filters.platforms.length;
  return c;
}
