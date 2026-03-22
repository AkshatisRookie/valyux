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
import { useDebounce } from './utils/useDebounce';
import GroceryPlatformLogos from './components/GroceryPlatformLogos';

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
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 600);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hasPincode || !hasCoords || !debouncedQuery || debouncedQuery.length < 2) {
      setLiveProducts([]);
      setSearchError(null);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const fetchLive = async () => {
      setIsSearching(true);
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
        setIsSearching(false);
      }
    };
    fetchLive();
    return () => { abortRef.current?.abort(); };
  }, [debouncedQuery, pincode, hasPincode, hasCoords, lat, lon]);

  const displayProducts = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    return liveProducts
      .map((p) => {
        const filtered = p.platformPrices.filter((pp) => openByPlatform[pp.platform] !== false);
        return filtered.length > 0 ? { ...p, platformPrices: filtered } : null;
      })
      .filter((p): p is Product => p !== null);
  }, [liveProducts, debouncedQuery.length, openByPlatform]);

  const handleAddToCart = (product: Product, platform: Platform) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedPlatform === platform);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedPlatform === platform
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, selectedPlatform: platform, quantity: 1, optimizedBuyUrl: undefined, optimizedPlatform: undefined }];
    });
    setIsCartOpen(true);
  };

  const handleApplyGroceryOptimization = (items: CartItem[]) => {
    setCart(items);
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
    setIsCartOpen(true);
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
                <button
                  type="button"
                  onClick={() => setDeliveryLocation({ pincode: '', addressLabel: '' })}
                  className="mt-1.5 text-xs font-medium text-yellow-700 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300 underline underline-offset-2"
                >
                  Change location
                </button>
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

            {searchQuery.length >= 2 && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
                {isSearching && <span>Searching...</span>}
                {!isSearching && liveProducts.length > 0 && <span>{displayProducts.length} results</span>}
                {searchError && <span className="text-red-600 dark:text-red-400">{searchError}</span>}
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
                  {searchQuery.length >= 2 ? 'No results. Try "milk", "bread", or "rice".' : 'Search for products to compare prices.'}
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

      {isCartOpen && (
        <CartDrawer
          activeSection={activeSection}
          groceryItems={cart}
          electronicsItems={electronicsCart}
          onClose={() => setIsCartOpen(false)}
          onUpdateGroceryQuantity={handleUpdateQuantity}
          onUpdateElectronicsQuantity={handleUpdateElectronicsQuantity}
          onApplyGroceryOptimization={handleApplyGroceryOptimization}
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
