import { Router, Request, Response } from 'express';

/* ================================================================== */
/*  Flights API — SOLID architecture                                   */
/*                                                                     */
/*  FlightDataProvider interface (Dependency Inversion):                */
/*  Swap MockProvider for a real aggregator in the future with         */
/*  zero changes to the route handler.                                 */
/* ================================================================== */

/* ── Types (mirror frontend types for contract consistency) ────────── */

interface Airport { code: string; name: string; city: string; country: string }
interface Airline { code: string; name: string; logo: string; color: string }
interface FlightSegment {
  airline: Airline;
  flightNumber: string;
  departure: { airport: Airport; time: string; terminal?: string };
  arrival:   { airport: Airport; time: string; terminal?: string };
  durationMin: number;
}
interface FlightLeg {
  segments: FlightSegment[];
  totalDurationMin: number;
  stops: number;
  layovers?: { airport: Airport; durationMin: number }[];
}
interface BookingPlatform { id: string; name: string; logo: string; type: string }
interface PlatformOffer {
  platform: BookingPlatform;
  price: number;
  currency: string;
  bookingUrl: string;
  cabinClass: string;
  seatsLeft?: number;
}
interface FlightResult {
  id: string;
  outbound: FlightLeg;
  inbound?: FlightLeg;
  offers: PlatformOffer[];
  bestPrice: number;
  valueScore: number;
}
interface SearchParams {
  from: string; to: string; departDate: string; returnDate?: string;
  passengers?: string; cabinClass?: string; tripType?: string;
}

interface FlightDataProvider {
  search(params: SearchParams): Promise<FlightResult[]>;
}

/* ── Airport catalogue ─────────────────────────────────────────────── */

const AIRPORTS: Airport[] = [
  { code: 'DEL', name: 'Indira Gandhi International', city: 'New Delhi', country: 'India' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj Intl', city: 'Mumbai', country: 'India' },
  { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India' },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose Intl', city: 'Kolkata', country: 'India' },
  { code: 'GOI', name: 'Manohar International', city: 'Goa', country: 'India' },
  { code: 'JAI', name: 'Jaipur International', city: 'Jaipur', country: 'India' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { code: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
];

const ap = (code: string): Airport => AIRPORTS.find(a => a.code === code) || AIRPORTS[0];

/* ── Airline & platform catalogues ─────────────────────────────────── */

const AIRLINE: Record<string, Airline> = {
  '6E': { code: '6E', name: 'IndiGo',       logo: '', color: '#3f51b5' },
  AI:   { code: 'AI', name: 'Air India',    logo: '', color: '#e65100' },
  SG:   { code: 'SG', name: 'SpiceJet',     logo: '', color: '#d32f2f' },
  UK:   { code: 'UK', name: 'Vistara',      logo: '', color: '#6a1b9a' },
  QP:   { code: 'QP', name: 'Akasa Air',    logo: '', color: '#ff6f00' },
  I5:   { code: 'I5', name: 'AirAsia India',logo: '', color: '#e53935' },
};

const PLATFORM: Record<string, BookingPlatform> = {
  mmt:        { id: 'mmt',       name: 'MakeMyTrip',  logo: '', type: 'ota' },
  goibibo:    { id: 'goibibo',   name: 'Goibibo',     logo: '', type: 'ota' },
  cleartrip:  { id: 'cleartrip', name: 'Cleartrip',   logo: '', type: 'ota' },
  ixigo:      { id: 'ixigo',     name: 'ixigo',       logo: '', type: 'metasearch' },
  easemytrip: { id: 'easemytrip',name: 'EaseMyTrip',  logo: '', type: 'ota' },
  indigo:     { id: 'indigo',    name: 'IndiGo',      logo: '', type: 'airline' },
  airindia:   { id: 'airindia',  name: 'Air India',   logo: '', type: 'airline' },
  spicejet:   { id: 'spicejet',  name: 'SpiceJet',    logo: '', type: 'airline' },
};

/* ── Mock data builder ─────────────────────────────────────────────── */

function makeDt(h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

function makeOffers(pairs: [string, number][]): PlatformOffer[] {
  return pairs.map(([pid, price]) => ({
    platform: PLATFORM[pid], price, currency: 'INR', bookingUrl: '', cabinClass: 'economy',
  }));
}

function directLeg(al: string, fn: string, from: string, to: string, dh: number, dm: number, ah: number, am: number, dur: number): FlightLeg {
  return {
    segments: [{ airline: AIRLINE[al], flightNumber: fn, departure: { airport: ap(from), time: makeDt(dh, dm) }, arrival: { airport: ap(to), time: makeDt(ah, am) }, durationMin: dur }],
    totalDurationMin: dur, stops: 0,
  };
}

const STUB_FLIGHTS: FlightResult[] = [
  { id: 'fl1',  outbound: directLeg('6E','6E 2154','DEL','BOM',6,0,8,15,135),   offers: makeOffers([['mmt',4299],['goibibo',4199],['ixigo',4349],['indigo',4499]]),       bestPrice: 4199, valueScore: 0 },
  { id: 'fl2',  outbound: directLeg('AI','AI 865','DEL','BOM',7,30,9,50,140),    offers: makeOffers([['mmt',5899],['cleartrip',5749],['airindia',5999]]),                   bestPrice: 5749, valueScore: 0 },
  { id: 'fl3',  outbound: directLeg('SG','SG 8169','DEL','BOM',9,45,12,5,140),   offers: makeOffers([['mmt',3899],['goibibo',3799],['spicejet',3999],['easemytrip',3849]]),bestPrice: 3799, valueScore: 0 },
  { id: 'fl4',  outbound: directLeg('UK','UK 955','DEL','BOM',11,0,13,10,130),   offers: makeOffers([['mmt',6499],['cleartrip',6399],['ixigo',6299]]),                      bestPrice: 6299, valueScore: 0 },
  { id: 'fl5',  outbound: directLeg('QP','QP 1372','DEL','BOM',14,15,16,30,135), offers: makeOffers([['mmt',4099],['easemytrip',4049]]),                                    bestPrice: 4049, valueScore: 0 },
  { id: 'fl6',  outbound: directLeg('I5','I5 1456','DEL','BOM',16,45,19,0,135),  offers: makeOffers([['goibibo',3599],['mmt',3699]]),                                       bestPrice: 3599, valueScore: 0 },
  { id: 'fl7',  outbound: directLeg('6E','6E 2789','DEL','BOM',19,30,21,45,135), offers: makeOffers([['mmt',4599],['goibibo',4449],['indigo',4499]]),                        bestPrice: 4449, valueScore: 0 },
  { id: 'fl8',  outbound: directLeg('SG','SG 8721','DEL','BOM',21,0,23,15,135),  offers: makeOffers([['spicejet',3299],['mmt',3399],['ixigo',3299]]),                        bestPrice: 3299, valueScore: 0 },
];

/* ── MockProvider (implements FlightDataProvider) ──────────────────── */

class MockFlightProvider implements FlightDataProvider {
  async search(params: SearchParams): Promise<FlightResult[]> {
    await new Promise(r => setTimeout(r, 400));

    let results = [...STUB_FLIGHTS];

    if (params.from && params.to) {
      const text = `${params.from}-${params.to}`.toUpperCase();
      if (text !== 'DEL-BOM') {
        results = results.map((f, i) => ({
          ...f,
          id: `${f.id}_${params.from}_${params.to}`,
          bestPrice: f.bestPrice + Math.round(Math.random() * 2000 - 1000),
          offers: f.offers.map(o => ({ ...o, price: o.price + Math.round(Math.random() * 2000 - 1000) })),
          outbound: {
            ...f.outbound,
            segments: f.outbound.segments.map(s => ({
              ...s,
              departure: { ...s.departure, airport: ap(params.from) || s.departure.airport },
              arrival:   { ...s.arrival,   airport: ap(params.to)   || s.arrival.airport },
            })),
          },
        }));
      }
    }

    return results;
  }
}

/* ── Route handler ─────────────────────────────────────────────────── */

const router = Router();
const provider: FlightDataProvider = new MockFlightProvider();

router.get('/flights/search', async (req: Request, res: Response) => {
  try {
    const { from, to, departDate, returnDate, passengers, cabinClass, tripType } = req.query as Record<string, string>;

    if (!from || !to) {
      return res.status(400).json({ error: 'from and to are required' });
    }

    const results = await provider.search({
      from, to,
      departDate: departDate || '',
      returnDate: returnDate || undefined,
      passengers, cabinClass, tripType,
    });

    res.json({ results, meta: { from, to, departDate, count: results.length } });
  } catch (err) {
    console.error('Flight search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/flights/airports', (_req: Request, res: Response) => {
  res.json({ airports: AIRPORTS });
});

export default router;
