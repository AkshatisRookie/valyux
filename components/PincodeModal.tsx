import React, { useState, useEffect } from 'react';

const PINCODE_KEY = 'valyux-pincode';

export function getStoredPincode(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(PINCODE_KEY) || '';
}

export function setStoredPincode(pincode: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PINCODE_KEY, pincode.trim());
}

interface PincodeModalProps {
  onConfirm: (pincode: string) => void;
}

export const PincodeModal: React.FC<PincodeModalProps> = ({ onConfirm }) => {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = pincode.trim();
    if (!trimmed) {
      setError('Please enter your pincode');
      return;
    }
    if (!/^\d{6}$/.test(trimmed)) {
      setError('Pincode must be 6 digits');
      return;
    }
    setError('');
    setStoredPincode(trimmed);
    onConfirm(trimmed);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg max-w-sm w-full p-6 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Delivery pincode</h2>
        <p className="text-sm text-neutral-500 mb-4">We&apos;ll show delivery times for your area.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="6-digit pincode"
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            className="w-full px-4 py-3 text-center text-lg font-medium tracking-widest rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-yellow-500"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-neutral-900 font-semibold rounded-lg">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
};
