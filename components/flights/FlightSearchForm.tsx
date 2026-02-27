import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAirportSearch } from './hooks';
import type { Airport, FlightSearchParams, TripType, CabinClass, Passengers } from './types';
import { AIRPORTS } from './data';

interface Props {
  onSearch: (params: FlightSearchParams) => void;
  isLoading: boolean;
}

/* ================================================================== */
/*  Airport input with fuzzy autocomplete dropdown                     */
/* ================================================================== */

const AirportInput: React.FC<{
  label: string;
  value: Airport | null;
  onChange: (a: Airport) => void;
  icon: React.ReactNode;
  placeholder: string;
}> = ({ label, value, onChange, icon, placeholder }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const suggestions = useAirportSearch(query);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback((a: Airport) => {
    onChange(a);
    setQuery('');
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && suggestions[highlightIdx]) { e.preventDefault(); handleSelect(suggestions[highlightIdx]); }
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">{label}</label>
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5
                      border border-gray-200 dark:border-gray-700 focus-within:border-sky-400 dark:focus-within:border-sky-500
                      focus-within:ring-2 focus-within:ring-sky-100 dark:focus-within:ring-sky-900/40 transition-all">
        <span className="text-gray-400 dark:text-gray-500 shrink-0">{icon}</span>
        {value && !open ? (
          <button onClick={() => { setOpen(true); setQuery(''); }}
            className="flex items-center gap-1.5 text-left w-full min-w-0">
            <span className="text-lg font-black text-gray-900 dark:text-white">{value.code}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{value.city}</span>
          </button>
        ) : (
          <input
            type="text"
            className="bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 w-full
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
            placeholder={placeholder}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900
                        border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-black/40
                        overflow-hidden max-h-[260px] overflow-y-auto">
          {suggestions.map((a, i) => (
            <button key={a.code}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                ${i === highlightIdx
                  ? 'bg-sky-50 dark:bg-sky-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              onMouseEnter={() => setHighlightIdx(i)}
              onClick={() => handleSelect(a)}>
              <span className="text-base font-black text-sky-600 dark:text-sky-400 w-10">{a.code}</span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{a.city}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{a.name}</div>
              </div>
              <span className="ml-auto text-[10px] text-gray-300 dark:text-gray-600">{a.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================================================================== */
/*  Passengers dropdown                                                */
/* ================================================================== */

const PassengerPicker: React.FC<{
  passengers: Passengers;
  onChange: (p: Passengers) => void;
}> = ({ passengers, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = passengers.adults + passengers.children + passengers.infants;

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const Row: React.FC<{ label: string; sub: string; field: keyof Passengers; min: number; max: number }> = ({ label, sub, field, min, max }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange({ ...passengers, [field]: Math.max(min, passengers[field] - 1) })}
          disabled={passengers[field] <= min}
          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center
                     text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          -
        </button>
        <span className="w-5 text-center text-sm font-bold text-gray-900 dark:text-gray-100">{passengers[field]}</span>
        <button onClick={() => onChange({ ...passengers, [field]: Math.min(max, passengers[field] + 1) })}
          disabled={passengers[field] >= max}
          className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center
                     text-gray-600 dark:text-gray-400 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          +
        </button>
      </div>
    </div>
  );

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">Travellers</label>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5
                   border border-gray-200 dark:border-gray-700 hover:border-sky-400 dark:hover:border-sky-500 transition-all w-full">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{total} traveller{total > 1 ? 's' : ''}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-64 bg-white dark:bg-gray-900
                        border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl dark:shadow-black/40 p-4">
          <Row label="Adults" sub="12+ years" field="adults" min={1} max={9} />
          <Row label="Children" sub="2–11 years" field="children" min={0} max={6} />
          <Row label="Infants" sub="Under 2" field="infants" min={0} max={2} />
          <button onClick={() => setOpen(false)}
            className="mt-2 w-full py-2 rounded-lg bg-sky-600 text-white text-sm font-bold hover:bg-sky-700 transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  );
};

/* ================================================================== */
/*  Main search form                                                   */
/* ================================================================== */

const CABIN_OPTIONS: { value: CabinClass; label: string }[] = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
];

const FlightSearchForm: React.FC<Props> = ({ onSearch, isLoading }) => {
  const [from, setFrom] = useState<Airport | null>(AIRPORTS[0]);
  const [to, setTo] = useState<Airport | null>(AIRPORTS[1]);
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState<Passengers>({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState<CabinClass>('economy');
  const [tripType, setTripType] = useState<TripType>('one_way');
  const [swapRotation, setSwapRotation] = useState(0);

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
    setSwapRotation(r => r + 180);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return;
    onSearch({
      from: from.code,
      to: to.code,
      departDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      passengers,
      cabinClass,
      tripType,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Trip type toggle */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {(['one_way', 'round_trip'] as TripType[]).map(t => (
          <button key={t} type="button" onClick={() => setTripType(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
              ${tripType === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t === 'one_way' ? 'One Way' : 'Round Trip'}
          </button>
        ))}
      </div>

      {/* Main row: From / Swap / To / Date / Passengers */}
      <div className="flex flex-col md:flex-wrap md:flex-row md:items-end gap-3">
        <AirportInput
          label="From" value={from} onChange={setFrom}
          placeholder="City or airport"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-5.07l-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0l-1.41-1.41M8.34 8.34L6.93 6.93"/></svg>}
        />

        {/* Swap button */}
        <button
          type="button"
          onClick={handleSwap}
          className="shrink-0 w-10 h-10 rounded-full border-2 border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 flex items-center justify-center
                     hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg
                     transition-all mb-0.5 mx-auto md:mx-0"
          style={{ transform: `rotate(${swapRotation}deg)`, transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <svg className="w-4 h-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        <AirportInput
          label="To" value={to} onChange={setTo}
          placeholder="City or airport"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />

        {/* Date */}
        <div className="min-w-[140px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">Depart</label>
          <input type="date" value={departDate} min={minDate}
            onChange={e => setDepartDate(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm font-semibold
                       text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700
                       focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40
                       transition-all outline-none" />
        </div>

        {tripType === 'round_trip' && (
          <div className="min-w-[140px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">Return</label>
            <input type="date" value={returnDate} min={departDate || minDate}
              onChange={e => setReturnDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm font-semibold
                         text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700
                         focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40
                         transition-all outline-none" />
          </div>
        )}

        <PassengerPicker passengers={passengers} onChange={setPassengers} />

        {/* Cabin class */}
        <div className="min-w-[140px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1 ml-1">Class</label>
          <select value={cabinClass} onChange={e => setCabinClass(e.target.value as CabinClass)}
            className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-sm font-semibold
                       text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700
                       focus:border-sky-400 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/40
                       transition-all outline-none appearance-none cursor-pointer">
            {CABIN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Search button */}
      <button type="submit" disabled={!from || !to || isLoading}
        className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50
                   text-white font-black text-sm tracking-wide
                   shadow-xl shadow-sky-600/25 hover:shadow-sky-600/40
                   transition-all duration-200 flex items-center justify-center gap-2 group">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Searching flights...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Search Flights
          </>
        )}
      </button>
    </form>
  );
};

export default FlightSearchForm;
