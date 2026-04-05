import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import ElectronicsPage from './components/electronics/ElectronicsPage';
import FlightsPage from './components/flights/FlightsPage';
import ComingSoonPlaceholder from './components/ComingSoonPlaceholder';
import { ThemeProvider } from './components/ThemeProvider';
import { FEATURE_ELECTRONICS_PAGE, FEATURE_FLIGHTS_PAGE } from './config/features';
import { PincodeProvider, usePincode } from './context/PincodeContext';
import { PincodeModal } from './components/PincodeModal';
import { Product, Platform, CartItem, AppSection, ElectronicsCartItem } from './types';
import { searchGroupQuickCommerce } from './services/quickCommerceApi';
import { reverseGeocodeLatLon } from './services/locationApi';
import { useDebounce } from './utils/useDebounce';
import GroceryPlatformLogos from './components/GroceryPlatformLogos';
import GroceryCategoryNav from './components/GroceryCategoryNav';

const AppContent: React.FC = () => {
  const { pincode, addressLabel, lat, lon, setDeliveryLocation, hasPincode, hasCoords, etaLoading, etaError, openByPlatform } = usePincode();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [electronicsCart, setElectronicsCart] = useState<ElectronicsCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [electronicsSearchQuery, setElectronicsSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<AppSection>('grocery');

  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [showGeoPermissionModal, setShowGeoPermissionModal] = useState(false);

  const debouncedQuery = useDebounce(searchQuery, 600);
  const abortRef = useRef<AbortController | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const SIMILAR_NAME_THRESHOLD = 0.72;
  /** When both rows have MRP from platforms, require match within this (₹) before merging */
  const MRP_MATCH_EPS = 2;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasPincode) return; // when no pincode yet, PincodeModal handles it
    if (!('geolocation' in navigator)) return;

    // Show only once per browser session.
    const key = 'valyux-geo-permission-modal';
    if (sessionStorage.getItem(key) === '1') return;

    setShowGeoPermissionModal(true);
  }, [hasPincode]);

  useEffect(() => {
    if (!hasPincode || !hasCoords || !debouncedQuery || debouncedQuery.length < 2) {
      setLiveProducts([]);
      setSearchError(null);
      setSearchProgress(0);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const fetchLive = async () => {
      setIsSearching(true);
      setSearchProgress(10);
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      progressTimerRef.current = window.setInterval(() => {
        setSearchProgress((p) => Math.min(90, p + 6 + Math.random() * 10));
      }, 350);
      setSearchError(null);
      try {
        const result = await searchGroupQuickCommerce(debouncedQuery, lat, lon, pincode);
        const products = (result.results || []).map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ''),
          name: String(p.name ?? ''),
          brand: String(p.brand ?? ''),
          quantity: String(p.quantity ?? ''),
          imageUrl: String(p.imageUrl ?? ''),
          category: String(p.category ?? 'Other'),
          platformPrices: (Array.isArray(p.platformPrices) ? p.platformPrices : []).map((pp: Record<string, unknown>) => ({
            platform: pp.platform as Platform,
            price: Number(pp.price) || 0,
            originalPrice: Number(pp.originalPrice) || 0,
            deliveryTime: String(pp.deliveryTime ?? '—'),
            productUrl: typeof pp.productUrl === 'string' ? pp.productUrl : undefined,
            externalItemId: typeof pp.externalItemId === 'string' ? pp.externalItemId : undefined,
          })),
        }));
        setLiveProducts(products);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setLiveProducts([]);
      } finally {
        if (progressTimerRef.current) {
          window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        setSearchProgress(100);
        setIsSearching(false);
        window.setTimeout(() => setSearchProgress(0), 350);
      }
    };
    fetchLive();
    return () => {
      abortRef.current?.abort();
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      setSearchProgress(0);
    };
  }, [debouncedQuery, pincode, hasPincode, hasCoords, lat, lon]);

  const handleUseCurrentLocation = () => {
    setGeoError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoError('Geolocation is not supported in this browser');
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latNum = pos.coords.latitude;
          const lonNum = pos.coords.longitude;
          const geo = await reverseGeocodeLatLon(latNum, lonNum);
          setDeliveryLocation({
            pincode: geo.pincode,
            addressLabel: geo.addressLabel || `Pincode ${geo.pincode}`,
            lat: geo.lat,
            lon: geo.lon,
          });
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

  const normalizeNameForCompare = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizeQtyForCompare = (q: string) =>
    (q || '')
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\.0+(?=\D|$)/g, '')
      .trim();

  const tokenSimilarity = (a: string, b: string) => {
    const ta = a.split(' ').filter(Boolean);
    const tb = b.split(' ').filter(Boolean);
    if (ta.length === 0 || tb.length === 0) return 0;
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 1;
    const setA = new Set(ta);
    const setB = new Set(tb);
    let inter = 0;
    for (const t of setA) if (setB.has(t)) inter += 1;
    return inter / Math.max(setA.size, setB.size);
  };

  const isQuantityCompatible = (a: string, b: string) => {
    const qa = normalizeQtyForCompare(a);
    const qb = normalizeQtyForCompare(b);
    if (!qa || !qb) return true;
    return qa === qb;
  };

  const listingMrp = (p: Product) =>
    Math.max(0, ...p.platformPrices.map((pp) => Number(pp.originalPrice) || 0));

  const isMrpCompatible = (a: Product, b: Product) => {
    const ma = listingMrp(a);
    const mb = listingMrp(b);
    if (ma <= 0 || mb <= 0) return true;
    return Math.abs(ma - mb) <= MRP_MATCH_EPS;
  };

  /** Higher = title matches search better (upstream order is arbitrary; we were sorting by price only). */
  const groceryQueryMatchScore = (rawQuery: string, product: Product): number => {
    const q = normalizeNameForCompare(rawQuery).trim();
    if (!q) return 0;
    const hay = normalizeNameForCompare(`${product.name} ${product.brand || ''}`);
    if (!hay) return 0;
    if (hay.includes(q)) return 1000;
    const qTokens = q.split(' ').filter((t) => t.length >= 2);
    if (qTokens.length === 0) return 0;
    let matched = 0;
    for (const t of qTokens) {
      if (hay.includes(t)) matched += 1;
    }
    return Math.round((matched / qTokens.length) * 500);
  };

  const displayProducts = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    const filtered = liveProducts
      .map((p) => {
        const platformPrices = p.platformPrices.filter((pp) => openByPlatform[pp.platform] !== false);
        return platformPrices.length > 0 ? { ...p, platformPrices } : null;
      })
      .filter((p): p is Product => p !== null);

    const groups: Product[] = [];
    for (const candidate of filtered) {
      const candidateName = normalizeNameForCompare(candidate.name);
      const candidateBrand = normalizeNameForCompare(candidate.brand || '');

      const target = groups.find((existing) => {
        const existingName = normalizeNameForCompare(existing.name);
        const similar = tokenSimilarity(existingName, candidateName) >= SIMILAR_NAME_THRESHOLD;
        if (!similar) return false;

        const existingBrand = normalizeNameForCompare(existing.brand || '');
        if (candidateBrand && existingBrand && candidateBrand !== existingBrand) return false;

        if (!isQuantityCompatible(existing.quantity, candidate.quantity)) return false;

        return isMrpCompatible(existing, candidate);
      });

      if (!target) {
        groups.push({
          ...candidate,
          platformPrices: [...candidate.platformPrices],
        });
        continue;
      }

      const byPlatform = new Map<Platform, Product['platformPrices'][number]>();
      for (const pp of target.platformPrices) byPlatform.set(pp.platform, pp);
      for (const pp of candidate.platformPrices) {
        const existing = byPlatform.get(pp.platform);
        if (!existing || pp.price < existing.price) {
          byPlatform.set(pp.platform, pp);
        }
      }
      target.platformPrices = Array.from(byPlatform.values()).sort((a, b) => a.price - b.price);
      if (!target.quantity && candidate.quantity) target.quantity = candidate.quantity;
      if (!target.brand && candidate.brand) target.brand = candidate.brand;
      if (!target.imageUrl && candidate.imageUrl) target.imageUrl = candidate.imageUrl;
    }

    const cheapest = (p: Product) => Math.min(...p.platformPrices.map((pp) => pp.price || Infinity));

    return [...groups].sort((a, b) => {
      const ra = groceryQueryMatchScore(debouncedQuery, a);
      const rb = groceryQueryMatchScore(debouncedQuery, b);
      if (rb !== ra) return rb - ra;
      const pa = a.platformPrices.length;
      const pb = b.platformPrices.length;
      if (pb !== pa) return pb - pa;
      return cheapest(a) - cheapest(b);
    });
  }, [liveProducts, debouncedQuery, openByPlatform]);

  const handleAddToCart = (product: Product, platform: Platform) => {
    setCart(prev => {
      const newName = normalizeNameForCompare(product.name);
      const newBrand = normalizeNameForCompare(product.brand || '');
      const newQty = normalizeQtyForCompare(product.quantity);

      const existing = prev.find((item) => {
        if (item.selectedPlatform !== platform) return false;
        if (normalizeQtyForCompare(item.product.quantity) !== newQty) return false;

        const itemName = normalizeNameForCompare(item.product.name);
        const sim = tokenSimilarity(itemName, newName);
        if (sim < 0.72) return false;

        const itemBrand = normalizeNameForCompare(item.product.brand || '');
        if (newBrand && itemBrand && itemBrand !== newBrand) return false;

        return true;
      });

      if (existing) {
        return prev.map((item) =>
          item.product.id === existing.product.id && item.selectedPlatform === platform
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        { product, selectedPlatform: platform, quantity: 1, optimizedBuyUrl: undefined, optimizedPlatform: undefined },
      ];
    });
  };

  const handleUpdateQuantity = (productId: string, platform: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId && item.selectedPlatform === platform) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const handleAddToElectronicsCart = (item: Omit<ElectronicsCartItem, 'quantity'>) => {
    setElectronicsCart(prev => {
      const existing = prev.find(
        i => i.productId === item.productId && i.retailer === item.retailer
      );
      if (existing) {
        return prev.map(i =>
          i.productId === item.productId && i.retailer === item.retailer
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateElectronicsQuantity = (
    productId: string,
    retailer: string,
    delta: number
  ) => {
    setElectronicsCart(prev =>
      prev
        .map(item => {
          if (item.productId === productId && item.retailer === retailer) {
            return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
        })
        .filter(item => item.quantity > 0)
    );
  };

  const groceryCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const electronicsCartCount = electronicsCart.reduce((acc, item) => acc + item.quantity, 0);
  const cartCount = activeSection === 'grocery' ? groceryCartCount : electronicsCartCount;

  if (!hasPincode) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 transition-colors duration-300">
        <PincodeModal onConfirm={setDeliveryLocation} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 transition-colors duration-300">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={activeSection === 'grocery' ? searchQuery : electronicsSearchQuery}
        onSearchChange={activeSection === 'grocery' ? setSearchQuery : setElectronicsSearchQuery}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeSection === 'grocery' && (
          <>
            <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
              <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Compare &amp; buy grocery at the best price
              </h1>
              <div className="mt-2 max-w-lg px-1">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  {addressLabel ? (
                    <>
                      <span className="font-medium">{addressLabel}</span>
                      <span className="mx-1 text-neutral-400">·</span>
                    </>
                  ) : null}
                  <span className="text-neutral-500 dark:text-neutral-400">Pincode {pincode}</span>
                </p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryLocation({ pincode: '', addressLabel: '' })}
                    className="text-xs font-medium text-yellow-700 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 underline underline-offset-2"
                  >
                    Change location
                  </button>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={geoLoading}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white underline underline-offset-2 disabled:opacity-60"
                  >
                    {geoLoading ? 'Getting location…' : 'Use current location'}
                  </button>
                </div>
                {geoError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {geoError}
                  </p>
                )}
                {etaLoading && <p className="text-xs text-neutral-500 mt-2">Loading delivery times…</p>}
                {etaError && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{etaError}</p>}
                {!hasCoords && hasPincode && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Locating your area for live prices…
                  </p>
                )}
              </div>
            </div>

            <GroceryPlatformLogos />

            {searchQuery.trim().length === 0 && (
              <GroceryCategoryNav onPickSearch={setSearchQuery} />
            )}

            {searchQuery.length >= 2 && (
              <div className="mb-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                  {isSearching && <span>Searching...</span>}
                  {!isSearching && liveProducts.length > 0 && <span>{displayProducts.length} results</span>}
                  {searchError && <span className="text-red-600 dark:text-red-400">{searchError}</span>}
                </div>
                {isSearching && (
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100 overflow-hidden dark:bg-neutral-800">
                    <div
                      className="h-full bg-yellow-400 transition-[width] duration-200"
                      style={{ width: `${searchProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {displayProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>

            {isSearching && displayProducts.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700" />
                    <div className="p-4 space-y-3">
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded w-16" />
                      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded w-full" />
                      <div className="h-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && displayProducts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  {searchQuery.length >= 2 ? 'No results. Try "milk", "bread", or "rice".' : ''}
                </p>
                {searchQuery.length >= 2 && (
                  <button onClick={() => setSearchQuery('')} className="mt-3 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    Clear
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeSection === 'electronics' && FEATURE_ELECTRONICS_PAGE && (
          <ElectronicsPage
            pincode={pincode}
            searchQuery={electronicsSearchQuery}
            onSearchChange={setElectronicsSearchQuery}
            onAddToCart={handleAddToElectronicsCart}
          />
        )}
        {activeSection === 'electronics' && !FEATURE_ELECTRONICS_PAGE && (
          <ComingSoonPlaceholder
            title="Electronics"
            description="Compare electronics across retailers."
          />
        )}

        {activeSection === 'flights' && FEATURE_FLIGHTS_PAGE && <FlightsPage />}
        {activeSection === 'flights' && !FEATURE_FLIGHTS_PAGE && (
          <ComingSoonPlaceholder
            title="Flights"
            description="Search and compare flights across OTAs."
          />
        )}
      </main>

      {showGeoPermissionModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950 p-4 shadow-2xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Allow current location?
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              This helps Valyux show the best live grocery prices near you.
            </p>
            {geoError && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                {geoError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.setItem('valyux-geo-permission-modal', '1'); } catch {}
                  setShowGeoPermissionModal(false);
                  handleUseCurrentLocation();
                }}
                disabled={geoLoading}
                className="flex-1 py-3 rounded-xl font-semibold bg-yellow-400 hover:bg-yellow-500 text-neutral-900 disabled:opacity-60"
              >
                {geoLoading ? 'Getting location…' : 'Allow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  try { sessionStorage.setItem('valyux-geo-permission-modal', '1'); } catch {}
                  setShowGeoPermissionModal(false);
                }}
                className="flex-1 py-3 rounded-xl font-semibold bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <CartDrawer
          activeSection={activeSection}
          groceryItems={cart}
          electronicsItems={electronicsCart}
          onClose={() => setIsCartOpen(false)}
          onUpdateGroceryQuantity={handleUpdateQuantity}
          onUpdateElectronicsQuantity={handleUpdateElectronicsQuantity}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <PincodeProvider>
      <AppContent />
    </PincodeProvider>
  </ThemeProvider>
);

export default App;
