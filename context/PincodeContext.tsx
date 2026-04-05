import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { geocodePincode } from '../services/pincodeGeocodeApi';
import { fetchGroupEta } from '../services/quickCommerceApi';
import type { Platform } from '../types';
import { getStoredLocation, setStoredLocation, type StoredLocation } from '../components/PincodeModal';

interface PincodeContextValue {
  pincode: string;
  /** Short display line, e.g. area · city */
  addressLabel: string;
  lat: string;
  lon: string;
  /** Fetched once per address (backend + browser cache); delivery times per platform */
  etaByPlatform: Partial<Record<Platform, string>>;
  /** true = open, false = closed; used to hide closed stores from search results */
  openByPlatform: Partial<Record<Platform, boolean>>;
  etaLoading: boolean;
  etaError: string | null;
  /** Full location: pincode + label + coords */
  setDeliveryLocation: (loc: StoredLocation) => void;
  hasPincode: boolean;
  /** True when lat/lon are set (required for live grocery search) */
  hasCoords: boolean;
}

const PincodeContext = createContext<PincodeContextValue | null>(null);

export function PincodeProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<StoredLocation>(() => getStoredLocation());
  const [etaByPlatform, setEtaByPlatform] = useState<Partial<Record<Platform, string>>>({});
  const [openByPlatform, setOpenByPlatform] = useState<Partial<Record<Platform, boolean>>>({});
  const [etaLoading, setEtaLoading] = useState(false);
  const [etaError, setEtaError] = useState<string | null>(null);

  useEffect(() => {
    setLocationState(getStoredLocation());
  }, []);

  const setDeliveryLocation = useCallback((loc: StoredLocation) => {
    const pin = loc.pincode.trim();
    const label = (loc.addressLabel || '').trim();
    const lat = (loc.lat || '').trim();
    const lon = (loc.lon || '').trim();
    const next: StoredLocation = { pincode: pin, addressLabel: label, lat: lat || undefined, lon: lon || undefined };
    setStoredLocation(next);
    setLocationState(next);
    setEtaByPlatform({});
    setOpenByPlatform({});
    setEtaError(null);
  }, []);

  /** Backfill coordinates for saved sessions that only had pincode */
  useEffect(() => {
    if (!/^\d{6}$/.test(location.pincode)) return;
    if (location.lat && location.lon) return;
    let cancelled = false;
    geocodePincode(location.pincode)
      .then((g) => {
        if (cancelled) return;
        setLocationState((prev) => {
          if (prev.pincode !== location.pincode) return prev;
          const next: StoredLocation = {
            ...prev,
            lat: g.lat,
            lon: g.lon,
          };
          setStoredLocation(next);
          return next;
        });
      })
      .catch(() => {
        /* non-fatal: user can re-open location */
      });
    return () => {
      cancelled = true;
    };
  }, [location.pincode, location.lat, location.lon]);

  useEffect(() => {
    if (!/^\d{6}$/.test(location.pincode)) return;
    if (!location.lat || !location.lon) return;
    let cancelled = false;
    setEtaLoading(true);
    setEtaError(null);
    fetchGroupEta(location.lat, location.lon, location.pincode)
      .then(({ etaByPlatform: eta, openByPlatform: open }) => {
        if (cancelled) return;
        setEtaByPlatform(eta as Partial<Record<Platform, string>>);
        setOpenByPlatform(open as Partial<Record<Platform, boolean>>);
      })
      .catch((e) => {
        if (cancelled) return;
        setEtaError(e instanceof Error ? e.message : 'Could not load delivery times');
        setEtaByPlatform({});
        setOpenByPlatform({});
      })
      .finally(() => {
        if (!cancelled) setEtaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pincode, location.lat, location.lon]);

  const hasCoords = Boolean(location.lat && location.lon && !Number.isNaN(Number(location.lat)) && !Number.isNaN(Number(location.lon)));

  return (
    <PincodeContext.Provider
      value={{
        pincode: location.pincode,
        addressLabel: location.addressLabel,
        lat: location.lat || '',
        lon: location.lon || '',
        etaByPlatform,
        openByPlatform,
        etaLoading,
        etaError,
        setDeliveryLocation,
        hasPincode: /^\d{6}$/.test(location.pincode),
        hasCoords,
      }}
    >
      {children}
    </PincodeContext.Provider>
  );
}

export function usePincode() {
  const ctx = useContext(PincodeContext);
  if (!ctx) throw new Error('usePincode must be used within PincodeProvider');
  return ctx;
}
