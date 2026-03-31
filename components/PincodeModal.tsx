import React, { useState } from 'react';
import { reverseGeocodeLatLon } from '../services/locationApi';
import { geocodePincode } from '../services/pincodeGeocodeApi';

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
  const [manualPincode, setManualPincode] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [confirmUseLocation, setConfirmUseLocation] = useState(false);
  const [error, setError] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

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

  const handleUseCurrentLocation = () => setConfirmUseLocation(true);

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
    setManualLoading(true);
    try {
      const geo = await geocodePincode(trimmed);
      const loc: StoredLocation = {
        pincode: trimmed,
        addressLabel: geo.label || `Pincode ${trimmed}`,
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
            Enter your pincode (or use current location). We use it for prices and delivery.
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
