import React, { useState } from 'react';
import type { FlightResult, PlatformOffer } from './types';
import { formatDuration, formatTime } from './types';
import { scoreLabel } from './valueScore';

interface Props {
  flight: FlightResult;
  index: number;
}

/* ================================================================== */
/*  Airline color mapping for visual identity                          */
/* ================================================================== */

const AIRLINE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  '6E': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', ring: 'ring-indigo-200 dark:ring-indigo-800' },
  AI:   { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', ring: 'ring-orange-200 dark:ring-orange-800' },
  SG:   { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-700 dark:text-red-400',       ring: 'ring-red-200 dark:ring-red-800' },
  UK:   { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', ring: 'ring-purple-200 dark:ring-purple-800' },
  QP:   { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   ring: 'ring-amber-200 dark:ring-amber-800' },
  I5:   { bg: 'bg-rose-100 dark:bg-rose-900/30',     text: 'text-rose-700 dark:text-rose-400',     ring: 'ring-rose-200 dark:ring-rose-800' },
  EK:   { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-800 dark:text-red-400',       ring: 'ring-red-200 dark:ring-red-800' },
  SQ:   { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-700 dark:text-blue-400',     ring: 'ring-blue-200 dark:ring-blue-800' },
};

const getAirlineStyle = (code: string) =>
  AIRLINE_COLORS[code] || { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', ring: 'ring-gray-200 dark:ring-gray-700' };

/* ================================================================== */
/*  Platform offer row                                                 */
/* ================================================================== */

const OfferRow: React.FC<{ offer: PlatformOffer; isBest: boolean }> = ({ offer, isBest }) => (
  <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors
    ${isBest
      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
    <div className="flex items-center gap-2.5 min-w-0">
      <img src={offer.platform.logo} alt={offer.platform.name}
        className="w-5 h-5 rounded object-contain shrink-0"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{offer.platform.name}</span>
      {isBest && (
        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full
                         bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-300">
          Best price
        </span>
      )}
      {offer.seatsLeft && offer.seatsLeft <= 5 && (
        <span className="text-[10px] font-bold text-red-500 dark:text-red-400">
          {offer.seatsLeft} left
        </span>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-base font-black ${isBest ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
        ₹{offer.price.toLocaleString('en-IN')}
      </span>
      <a href={offer.bookingUrl} target="_blank" rel="noopener noreferrer"
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all
          ${isBest
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-sky-400 dark:hover:border-sky-500 hover:text-sky-600 dark:hover:text-sky-400'}`}>
        Book
      </a>
    </div>
  </div>
);

/* ================================================================== */
/*  Flight Card                                                        */
/* ================================================================== */

const FlightCard: React.FC<Props> = ({ flight, index }) => {
  const [expanded, setExpanded] = useState(false);
  const leg = flight.outbound;
  const mainSegment = leg.segments[0];
  const lastSegment = leg.segments[leg.segments.length - 1];
  const airlineCode = mainSegment.airline.code;
  const style = getAirlineStyle(airlineCode);
  const label = scoreLabel(flight.valueScore);

  const sortedOffers = [...flight.offers].sort((a, b) => a.price - b.price);
  const bestOffer = sortedOffers[0];

  const scoreBg: Record<string, string> = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
    blue:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    amber:   'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    gray:    'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  return (
    <div
      className="fl-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800
                 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg dark:hover:shadow-black/30
                 transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 60}ms` }}>

      {/* ── Main row ──────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">

        {/* Airline badge */}
        <div className={`flex items-center gap-2 shrink-0 ${style.bg} px-3 py-2 rounded-xl ring-1 ${style.ring}`}>
          <span className="text-lg">{mainSegment.airline.logo}</span>
          <div>
            <div className={`text-xs font-black ${style.text}`}>{mainSegment.airline.name}</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500">{mainSegment.flightNumber}</div>
          </div>
        </div>

        {/* Timeline: Depart → Duration → Arrive */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            {/* Departure */}
            <div className="text-center">
              <div className="text-xl font-black text-gray-900 dark:text-white leading-none">
                {formatTime(mainSegment.departure.time)}
              </div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                {mainSegment.departure.airport.code}
              </div>
            </div>

            {/* Flight path visual */}
            <div className="flex-1 flex flex-col items-center min-w-[100px]">
              <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                {formatDuration(leg.totalDurationMin)}
              </div>
              <div className="w-full flex items-center gap-1 my-1">
                <div className="h-[2px] flex-1 bg-gradient-to-r from-sky-400 to-sky-200 dark:from-sky-500 dark:to-sky-700 rounded-full" />
                {leg.stops > 0 ? (
                  <>
                    {leg.layovers?.map((l, i) => (
                      <React.Fragment key={i}>
                        <div className="w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500 ring-2 ring-white dark:ring-gray-900 shrink-0" />
                        <div className="h-[2px] flex-1 bg-gradient-to-r from-sky-200 to-sky-400 dark:from-sky-700 dark:to-sky-500 rounded-full" />
                      </React.Fragment>
                    ))}
                  </>
                ) : (
                  <svg className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0 -mx-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                )}
              </div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                {leg.stops === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Non-stop</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    {leg.stops} stop{leg.stops > 1 ? 's' : ''}
                    {leg.layovers?.[0] && ` · ${leg.layovers[0].airport.code}`}
                  </span>
                )}
              </div>
            </div>

            {/* Arrival */}
            <div className="text-center">
              <div className="text-xl font-black text-gray-900 dark:text-white leading-none">
                {formatTime(lastSegment.arrival.time)}
              </div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">
                {lastSegment.arrival.airport.code}
              </div>
            </div>
          </div>
        </div>

        {/* Price + Score + CTA */}
        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${scoreBg[label.color]}`}>
            {label.text} · {flight.valueScore}
          </span>
          <div className="text-2xl font-black text-gray-900 dark:text-white leading-none">
            ₹{flight.bestPrice.toLocaleString('en-IN')}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400
                       hover:text-sky-700 dark:hover:text-sky-300 transition-colors">
            {expanded ? 'Hide' : `${flight.offers.length} deals`}
            <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Expanded: Platform offers ─────────────────────────────── */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out
        ${expanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 sm:px-5 pb-4 pt-1 space-y-1.5 border-t border-gray-100 dark:border-gray-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 pt-3">
            Compare prices across platforms
          </div>
          {sortedOffers.map((o, i) => (
            <OfferRow key={o.platform.id} offer={o} isBest={i === 0} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
