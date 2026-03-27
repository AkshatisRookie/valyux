import React, { useState, useRef, useEffect } from 'react';
import { fetchAddressSuggestions, reverseGeocodeLatLon, type AddressSuggestion } from '../services/locationApi';
import { geocodePincode } from '../services/pincodeGeocodeApi';
import { useDebounce } from '../utils/useDebounce';

const STORAGE_KEY = 'valyux-location';
const LEGACY_PINCODE_KEY = 'valyux-pincode';

export interface StoredLocation {
  pincode: string;
  addressLabel: string;
  /** Required for live QuickCommerce search / ETA */
  lat?: string;
  lon?: string;
}

export function getStoredLocation(): StoredLocation {
  if (typeof window === 'undefined') return { pincode: '', addressLabel: '' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredLocation>;
      if (parsed.pincode && /^\d{6}$/.test(parsed.pincode)) {
        return {
          pincode: parsed.pincode,
          addressLabel: typeof parsed.addressLabel === 'string' ? parsed.addressLabel : '',
          lat: typeof parsed.lat === 'string' && parsed.lat ? parsed.lat : undefined,
          lon: typeof parsed.lon === 'string' && parsed.lon ? parsed.lon : undefined,
        };
      }
    }
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(LEGACY_PINCODE_KEY);
  if (legacy && /^\d{6}$/.test(legacy.trim())) {
    return { pincode: legacy.trim(), addressLabel: '', lat: undefined, lon: undefined };
  }
  return { pincode: '', addressLabel: '' };
}

export function setStoredLocation(loc: StoredLocation): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  try {
    localStorage.removeItem(LEGACY_PINCODE_KEY);
  } catch {
    /* ignore */
  }
}

/** @deprecated use getStoredLocation */
export function getStoredPincode(): string {
  return getStoredLocation().pincode;
}

/** @deprecated use setStoredLocation */
export function setStoredPincode(pincode: string): void {
  setStoredLocation({ pincode: pincode.trim(), addressLabel: '' });
}

interface PincodeModalProps {
  onConfirm: (location: StoredLocation) => void;
}

export const PincodeModal: React.FC<PincodeModalProps> = ({ onConfirm }) => {
  const [query, setQuery] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [confirmUseLocation, setConfirmUseLocation] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [manualLoading, setManualLoading] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      setSuggestions([]);
      setSearchError(null);
      setHighlightIndex(-1);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setSearchError(null);

    fetchAddressSuggestions(debouncedQuery)
      .then((results) => {
        if (!cancelled) {
          setSuggestions(results);
          setHighlightIndex(results.length > 0 ? 0 : -1);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setSuggestions([]);
          setSearchError(err instanceof Error ? err.message : 'Could not search addresses');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const requestCurrentLocation = () => {
    setGeoError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser');
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const geo = await reverseGeocodeLatLon(lat, lon);

          const loc: StoredLocation = {
            pincode: geo.pincode,
            addressLabel: geo.addressLabel || `Pincode ${geo.pincode}`,
            lat: geo.lat,
            lon: geo.lon,
          };

          setStoredLocation(loc);
          onConfirm(loc);
        } catch (err) {
          setGeoError(err instanceof Error ? err.message : 'Could not fetch your current location');
        } finally {
          setGeoLoading(false);
        }
      },
      (e) => {
        setGeoLoading(false);
        const msg =
          e.code === e.PERMISSION_DENIED ? 'Location permission denied' : 'Could not access your location';
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleUseCurrentLocation = () => {
    setConfirmUseLocation(true);
  };

  const selectSuggestion = (s: AddressSuggestion) => {
    const loc: StoredLocation = {
      pincode: s.pincode,
      addressLabel: s.label,
      lat: s.lat,
      lon: s.lon,
    };
    setStoredLocation(loc);
    onConfirm(loc);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualPincode.replace(/\D/g, '');
    if (!trimmed) {
      setError('Enter a 6-digit pincode');
      return;
    }
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Pincode must be 6 digits');
      return;
    }
    setError('');
    const label = query.trim() || `Pincode ${trimmed}`;
    setManualLoading(true);
    try {
      const geo = await geocodePincode(trimmed);
      const loc: StoredLocation = {
        pincode: trimmed,
        addressLabel: label || geo.label,
        lat: geo.lat,
        lon: geo.lon,
      };
      setStoredLocation(loc);
      onConfirm(loc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not find this pincode on the map');
    } finally {
      setManualLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[highlightIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 dark:bg-black/60 p-4">
      <div
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col border border-neutral-200 dark:border-neutral-700"
        role="dialog"
        aria-labelledby="location-title"
      >
        <div className="p-5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 id="location-title" className="text-lg font-bold text-neutral-900 dark:text-white">
            Where should we deliver?
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Search for your street, area, or landmark. We use your pincode for prices and delivery.
          </p>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-3">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={geoLoading}
              className="w-full py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl font-semibold text-neutral-900 dark:text-white disabled:opacity-60"
            >
              {geoLoading ? 'Getting location…' : 'Use current location'}
            </button>
            {geoError && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{geoError}</p>}
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Type address, area, or landmark…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError('');
              }}
              onKeyDown={onKeyDown}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-yellow-400/60 focus:border-yellow-400"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">Searching…</span>
            )}
          </div>

          {searchError && (
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              {searchError} — use pincode below or start the backend (<code className="bg-neutral-100 dark:bg-neutral-800 px-1 rounded">cd backend && npm run dev</code>).
            </p>
          )}

          {query.length >= 3 && !loading && suggestions.length === 0 && !searchError && (
            <p className="text-sm text-neutral-500">No matches with a pincode. Try another search or enter your pincode below.</p>
          )}

          {suggestions.length > 0 && (
            <ul ref={listRef} className="rounded-xl border border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800 overflow-hidden max-h-56 overflow-y-auto">
              {suggestions.map((s, idx) => (
                <li key={`${s.id}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      idx === highlightIndex
                        ? 'bg-yellow-50 dark:bg-yellow-900/20'
                        : 'bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="font-medium text-neutral-900 dark:text-white line-clamp-2">{s.label}</div>
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{s.fullLabel}</div>
                    <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mt-1">Pincode {s.pincode}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="text-sm font-medium text-yellow-700 dark:text-yellow-400 hover:underline"
          >
            {showManual ? 'Hide' : 'Or enter pincode only'}
          </button>

          {showManual && (
            <form onSubmit={handleManualSubmit} className="space-y-3 pt-1">
              <p className="text-xs text-neutral-500">6-digit India pincode</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="e.g. 560001"
                value={manualPincode}
                onChange={(e) => {
                  setManualPincode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                className="w-full px-4 py-3 text-center text-lg font-medium tracking-widest rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-yellow-500"
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={manualLoading}
                className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-semibold rounded-xl disabled:opacity-60"
              >
                {manualLoading ? 'Locating…' : 'Continue with pincode'}
              </button>
            </form>
          )}
        </div>
      </div>

      {confirmUseLocation && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-950">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Allow current location?
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              We will use your location to show live grocery prices near you.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try { setConfirmUseLocation(false); } catch {}
                  requestCurrentLocation();
                }}
                disabled={geoLoading}
                className="flex-1 py-3 rounded-xl font-semibold bg-yellow-400 hover:bg-yellow-500 text-neutral-900 disabled:opacity-60"
              >
                {geoLoading ? 'Getting…' : 'Allow'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmUseLocation(false)}
                className="flex-1 py-3 rounded-xl font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
