import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoredPincode, setStoredPincode } from '../components/PincodeModal';

interface PincodeContextValue {
  pincode: string;
  setPincode: (p: string) => void;
  hasPincode: boolean;
}

const PincodeContext = createContext<PincodeContextValue | null>(null);

export function PincodeProvider({ children }: { children: React.ReactNode }) {
  const [pincode, setPincodeState] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPincodeState(getStoredPincode());
    setMounted(true);
  }, []);

  const setPincode = (p: string) => {
    const trimmed = p.trim();
    setStoredPincode(trimmed);
    setPincodeState(trimmed);
  };

  return (
    <PincodeContext.Provider
      value={{
        pincode,
        setPincode,
        hasPincode: mounted ? /^\d{6}$/.test(pincode) : false,
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
