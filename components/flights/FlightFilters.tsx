import React from 'react';
import type { FlightFilters as Filters, TimeWindow, Airline, BookingPlatform } from './types';
import { DEFAULT_FLIGHT_FILTERS } from './types';
import { useActiveFlightFiltersCount } from './hooks';

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  airlines: Airline[];
  platforms: BookingPlatform[];
  priceRange: { min: number; max: number };
}

const TIME_WINDOWS: { id: TimeWindow; label: string; icon: string; range: string }[] = [
  { id: 'early_morning', label: 'Early', icon: '🌙', range: '12am – 6am' },
  { id: 'morning',       label: 'Morning', icon: '🌅', range: '6am – 12pm' },
  { id: 'afternoon',     label: 'Afternoon', icon: '☀️', range: '12pm – 5pm' },
  { id: 'evening',       label: 'Evening', icon: '🌇', range: '5pm – 9pm' },
  { id: 'night',         label: 'Night', icon: '🌙', range: '9pm – 12am' },
];

const FlightFilters: React.FC<Props> = ({ filters, onChange, airlines, platforms, priceRange }) => {
  const activeCount = useActiveFlightFiltersCount(filters);

  const setStops = (n: number | null) => onChange({ ...filters, maxStops: filters.maxStops === n ? null : n });

  const toggleAirline = (code: string) => {
    const next = filters.airlines.includes(code)
      ? filters.airlines.filter(c => c !== code)
      : [...filters.airlines, code];
    onChange({ ...filters, airlines: next });
  };

  const toggleTimeWindow = (tw: TimeWindow) => {
    const next = filters.departureWindows.includes(tw)
      ? filters.departureWindows.filter(t => t !== tw)
      : [...filters.departureWindows, tw];
    onChange({ ...filters, departureWindows: next });
  };

  const togglePlatform = (id: string) => {
    const next = filters.platforms.includes(id)
      ? filters.platforms.filter(p => p !== id)
      : [...filters.platforms, id];
    onChange({ ...filters, platforms: next });
  };

  const clearAll = () => onChange({ ...DEFAULT_FLIGHT_FILTERS });

  const ChipBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
        ${active
          ? 'bg-sky-600 dark:bg-sky-500 text-white border-sky-600 dark:border-sky-500'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}>
      {children}
    </button>
  );

  return (
    <div className="space-y-5 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 dark:text-white">Filters</h3>
        {activeCount > 0 && (
          <button onClick={clearAll}
            className="flex items-center gap-1 text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 transition-colors">
            Clear all
            <span className="inline-flex items-center justify-center w-4 h-4 bg-red-100 dark:bg-red-900/30
                             text-red-600 dark:text-red-400 text-[9px] font-black rounded-full">{activeCount}</span>
          </button>
        )}
      </div>

      {/* Stops */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Stops</div>
        <div className="flex flex-wrap gap-2">
          <ChipBtn active={filters.maxStops === 0} onClick={() => setStops(0)}>Non-stop</ChipBtn>
          <ChipBtn active={filters.maxStops === 1} onClick={() => setStops(1)}>1 stop</ChipBtn>
          <ChipBtn active={filters.maxStops === 2} onClick={() => setStops(2)}>2+ stops</ChipBtn>
        </div>
      </div>

      {/* Departure time */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Departure time</div>
        <div className="flex flex-wrap gap-2">
          {TIME_WINDOWS.map(tw => (
            <ChipBtn key={tw.id} active={filters.departureWindows.includes(tw.id)} onClick={() => toggleTimeWindow(tw.id)}>
              {tw.icon} {tw.label}
            </ChipBtn>
          ))}
        </div>
      </div>

      {/* Airlines */}
      {airlines.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Airlines</div>
          <div className="flex flex-wrap gap-2">
            {airlines.map(a => (
              <ChipBtn key={a.code} active={filters.airlines.includes(a.code)} onClick={() => toggleAirline(a.code)}>
                <span className="mr-1">{a.logo}</span> {a.name}
              </ChipBtn>
            ))}
          </div>
        </div>
      )}

      {/* Platforms */}
      {platforms.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Book via</div>
          <div className="flex flex-wrap gap-2">
            {platforms.map(p => (
              <ChipBtn key={p.id} active={filters.platforms.includes(p.id)} onClick={() => togglePlatform(p.id)}>
                {p.name}
              </ChipBtn>
            ))}
          </div>
        </div>
      )}

      {/* Price range */}
      {priceRange.max > priceRange.min && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Max price: {filters.maxPrice ? `₹${filters.maxPrice.toLocaleString('en-IN')}` : 'Any'}
          </div>
          <input type="range"
            min={priceRange.min} max={priceRange.max} step={100}
            value={filters.maxPrice || priceRange.max}
            onChange={e => {
              const v = Number(e.target.value);
              onChange({ ...filters, maxPrice: v >= priceRange.max ? null : v });
            }}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                       accent-sky-600 dark:accent-sky-400" />
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
            <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightFilters;
