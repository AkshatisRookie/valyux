import type { Airport, Airline, BookingPlatform, FlightResult } from './types';

/* ================================================================== */
/*  Airports                                                           */
/* ================================================================== */

export const AIRPORTS: Airport[] = [
  { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India' },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose Intl', city: 'Kolkata', country: 'India' },
  { code: 'GOI', name: 'Manohar International', city: 'Goa', country: 'India' },
  { code: 'JAI', name: 'Jaipur International', city: 'Jaipur', country: 'India' },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', country: 'India' },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel Intl', city: 'Ahmedabad', country: 'India' },
  { code: 'COK', name: 'Cochin International', city: 'Kochi', country: 'India' },
  { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi Intl', city: 'Guwahati', country: 'India' },
  { code: 'LKO', name: 'Chaudhary Charan Singh Intl', city: 'Lucknow', country: 'India' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
];

export function findAirport(code: string): Airport {
  return AIRPORTS.find(a => a.code === code) || AIRPORTS[0];
}

/* ================================================================== */
/*  Airlines                                                           */
/* ================================================================== */

export const AIRLINES: Airline[] = [
  { code: '6E', name: 'IndiGo',       logo: '🔵', color: '#3f51b5' },
  { code: 'AI', name: 'Air India',    logo: '🟠', color: '#e65100' },
  { code: 'SG', name: 'SpiceJet',     logo: '🔴', color: '#d32f2f' },
  { code: 'UK', name: 'Vistara',      logo: '🟣', color: '#6a1b9a' },
  { code: 'QP', name: 'Akasa Air',    logo: '🟧', color: '#ff6f00' },
  { code: 'I5', name: 'AirAsia India',logo: '🟡', color: '#e53935' },
  { code: 'EK', name: 'Emirates',     logo: '🏆', color: '#c62828' },
  { code: 'SQ', name: 'Singapore Air',logo: '🌟', color: '#1565c0' },
];

export function findAirline(code: string): Airline {
  return AIRLINES.find(a => a.code === code) || AIRLINES[0];
}

/* ================================================================== */
/*  Booking Platforms                                                  */
/* ================================================================== */

export const BOOKING_PLATFORMS: BookingPlatform[] = [
  { id: 'mmt',       name: 'MakeMyTrip',  logo: 'https://imgak.mmtcdn.com/pwa_v3/pwa_commons_assets/favicon.ico', type: 'ota' },
  { id: 'goibibo',   name: 'Goibibo',     logo: 'https://www.goibibo.com/favicon.ico', type: 'ota' },
  { id: 'cleartrip', name: 'Cleartrip',   logo: 'https://www.cleartrip.com/favicon.ico', type: 'ota' },
  { id: 'ixigo',     name: 'ixigo',       logo: 'https://www.ixigo.com/favicon.ico', type: 'metasearch' },
  { id: 'easemytrip',name: 'EaseMyTrip',  logo: 'https://www.easemytrip.com/favicon.ico', type: 'ota' },
  { id: 'yatra',     name: 'Yatra',       logo: 'https://www.yatra.com/favicon.ico', type: 'ota' },
  { id: 'indigo',    name: 'IndiGo',      logo: 'https://www.goindigo.in/favicon.ico', type: 'airline' },
  { id: 'airindia',  name: 'Air India',   logo: 'https://www.airindia.com/favicon.ico', type: 'airline' },
  { id: 'spicejet',  name: 'SpiceJet',    logo: 'https://www.spicejet.com/favicon.ico', type: 'airline' },
  { id: 'akasa',     name: 'Akasa Air',   logo: 'https://www.akasaair.com/favicon.ico', type: 'airline' },
];

export function findPlatform(id: string): BookingPlatform {
  return BOOKING_PLATFORMS.find(p => p.id === id) || BOOKING_PLATFORMS[0];
}

/* ================================================================== */
/*  Build a platform booking URL (deep link)                           */
/* ================================================================== */

export function buildBookingUrl(
  platformId: string, from: string, to: string, date: string,
): string {
  const d = date.replace(/-/g, '');
  switch (platformId) {
    case 'mmt':        return `https://www.makemytrip.com/flight/search?itinerary=${from}-${to}-${date}&tripType=O&paxType=A-1_C-0_I-0&cabinClass=E`;
    case 'goibibo':    return `https://www.goibibo.com/flights/air-${from}-${to}-${d}-1-0-0-E-D`;
    case 'cleartrip':  return `https://www.cleartrip.com/flights/${from}-${to}-${date}`;
    case 'ixigo':      return `https://www.ixigo.com/search/result/flight/${from}/${to}/${date}//1/0/0/e/0`;
    case 'easemytrip': return `https://www.easemytrip.com/flights/${from}-${to}-${d}`;
    case 'yatra':      return `https://www.yatra.com/flights/search?type=O&origin=${from}&destination=${to}&depart_date=${date}&pax=1_0_0&class=Economy`;
    case 'indigo':     return `https://www.goindigo.in/`;
    case 'airindia':   return `https://www.airindia.com/`;
    case 'spicejet':   return `https://www.spicejet.com/`;
    case 'akasa':      return `https://www.akasaair.com/`;
    default:           return '#';
  }
}

/* ================================================================== */
/*  Mock flight results — DEL → BOM route                              */
/*  In production, this comes from the backend FlightDataProvider      */
/* ================================================================== */

function makeDate(h: number, m: number, plusDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 3 + plusDays);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const del = findAirport('DEL');
const bom = findAirport('BOM');
const blr = findAirport('BLR');
const hyd = findAirport('HYD');
const indigo = findAirline('6E');
const airIndia = findAirline('AI');
const spicejet = findAirline('SG');
const vistara = findAirline('UK');
const akasa = findAirline('QP');
const airasia = findAirline('I5');

export const MOCK_FLIGHTS: FlightResult[] = [
  {
    id: 'fl1',
    outbound: {
      segments: [{ airline: indigo, flightNumber: '6E 2154', departure: { airport: del, time: makeDate(6, 0) }, arrival: { airport: bom, time: makeDate(8, 15) }, durationMin: 135 }],
      totalDurationMin: 135, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 4299, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 4 },
      { platform: findPlatform('goibibo'), price: 4199, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('ixigo'), price: 4349, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('indigo'), price: 4499, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 6 },
    ],
    bestPrice: 4199, valueScore: 0,
  },
  {
    id: 'fl2',
    outbound: {
      segments: [{ airline: airIndia, flightNumber: 'AI 865', departure: { airport: del, time: makeDate(7, 30) }, arrival: { airport: bom, time: makeDate(9, 50) }, durationMin: 140 }],
      totalDurationMin: 140, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 5899, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('cleartrip'), price: 5749, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('airindia'), price: 5999, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 12 },
      { platform: findPlatform('yatra'), price: 5800, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 5749, valueScore: 0,
  },
  {
    id: 'fl3',
    outbound: {
      segments: [{ airline: spicejet, flightNumber: 'SG 8169', departure: { airport: del, time: makeDate(9, 45) }, arrival: { airport: bom, time: makeDate(12, 5) }, durationMin: 140 }],
      totalDurationMin: 140, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 3899, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('goibibo'), price: 3799, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('spicejet'), price: 3999, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 2 },
      { platform: findPlatform('easemytrip'), price: 3849, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 3799, valueScore: 0,
  },
  {
    id: 'fl4',
    outbound: {
      segments: [{ airline: vistara, flightNumber: 'UK 955', departure: { airport: del, time: makeDate(11, 0) }, arrival: { airport: bom, time: makeDate(13, 10) }, durationMin: 130 }],
      totalDurationMin: 130, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 6499, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('cleartrip'), price: 6399, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('ixigo'), price: 6299, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 6299, valueScore: 0,
  },
  {
    id: 'fl5',
    outbound: {
      segments: [
        { airline: indigo, flightNumber: '6E 6034', departure: { airport: del, time: makeDate(8, 0) }, arrival: { airport: hyd, time: makeDate(10, 30) }, durationMin: 150 },
        { airline: indigo, flightNumber: '6E 5421', departure: { airport: hyd, time: makeDate(11, 45) }, arrival: { airport: bom, time: makeDate(13, 5) }, durationMin: 80 },
      ],
      totalDurationMin: 305, stops: 1, layovers: [{ airport: hyd, durationMin: 75 }],
    },
    offers: [
      { platform: findPlatform('mmt'), price: 3499, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('goibibo'), price: 3399, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('ixigo'), price: 3549, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 3399, valueScore: 0,
  },
  {
    id: 'fl6',
    outbound: {
      segments: [{ airline: akasa, flightNumber: 'QP 1372', departure: { airport: del, time: makeDate(14, 15) }, arrival: { airport: bom, time: makeDate(16, 30) }, durationMin: 135 }],
      totalDurationMin: 135, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 4099, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('akasa'), price: 3999, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 8 },
      { platform: findPlatform('easemytrip'), price: 4049, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 3999, valueScore: 0,
  },
  {
    id: 'fl7',
    outbound: {
      segments: [{ airline: airasia, flightNumber: 'I5 1456', departure: { airport: del, time: makeDate(16, 45) }, arrival: { airport: bom, time: makeDate(19, 0) }, durationMin: 135 }],
      totalDurationMin: 135, stops: 0,
    },
    offers: [
      { platform: findPlatform('goibibo'), price: 3599, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('mmt'), price: 3699, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('yatra'), price: 3649, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 3599, valueScore: 0,
  },
  {
    id: 'fl8',
    outbound: {
      segments: [{ airline: indigo, flightNumber: '6E 2789', departure: { airport: del, time: makeDate(19, 30) }, arrival: { airport: bom, time: makeDate(21, 45) }, durationMin: 135 }],
      totalDurationMin: 135, stops: 0,
    },
    offers: [
      { platform: findPlatform('mmt'), price: 4599, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('indigo'), price: 4499, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 3 },
      { platform: findPlatform('goibibo'), price: 4449, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('cleartrip'), price: 4549, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 4449, valueScore: 0,
  },
  {
    id: 'fl9',
    outbound: {
      segments: [
        { airline: airIndia, flightNumber: 'AI 803', departure: { airport: del, time: makeDate(5, 30) }, arrival: { airport: blr, time: makeDate(8, 0) }, durationMin: 150 },
        { airline: airIndia, flightNumber: 'AI 619', departure: { airport: blr, time: makeDate(9, 30) }, arrival: { airport: bom, time: makeDate(11, 0) }, durationMin: 90 },
      ],
      totalDurationMin: 330, stops: 1, layovers: [{ airport: blr, durationMin: 90 }],
    },
    offers: [
      { platform: findPlatform('airindia'), price: 4999, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('mmt'), price: 4899, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('cleartrip'), price: 4849, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 4849, valueScore: 0,
  },
  {
    id: 'fl10',
    outbound: {
      segments: [{ airline: spicejet, flightNumber: 'SG 8721', departure: { airport: del, time: makeDate(21, 0) }, arrival: { airport: bom, time: makeDate(23, 15) }, durationMin: 135 }],
      totalDurationMin: 135, stops: 0,
    },
    offers: [
      { platform: findPlatform('spicejet'), price: 3299, currency: 'INR', bookingUrl: '', cabinClass: 'economy', seatsLeft: 5 },
      { platform: findPlatform('mmt'), price: 3399, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('easemytrip'), price: 3349, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
      { platform: findPlatform('ixigo'), price: 3299, currency: 'INR', bookingUrl: '', cabinClass: 'economy' },
    ],
    bestPrice: 3299, valueScore: 0,
  },
];
