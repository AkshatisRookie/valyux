import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import ElectronicsPage from './components/electronics/ElectronicsPage';
import FlightsPage from './components/flights/FlightsPage';
import { ThemeProvider } from './components/ThemeProvider';
import { PincodeProvider, usePincode } from './context/PincodeContext';
import { PincodeModal } from './components/PincodeModal';
import { CATEGORIES } from './constants';
import { Product, Platform, CartItem, AppSection, ElectronicsCartItem } from './types';
import { searchViaGemini } from './services/geminiSearchApi';
import { useDebounce } from './utils/useDebounce';
import { STATIC_GROCERY_PRODUCTS } from './data/groceryProducts';

const AppContent: React.FC = () => {
  const { pincode, setPincode, hasPincode } = usePincode();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [electronicsCart, setElectronicsCart] = useState<ElectronicsCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [electronicsSearchQuery, setElectronicsSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSection, setActiveSection] = useState<AppSection>('grocery');

  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 600);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!hasPincode || !debouncedQuery || debouncedQuery.length < 2) {
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
        const result = await searchViaGemini(debouncedQuery, pincode, 'grocery');
        const products = (result.results || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          quantity: p.quantity || '',
          imageUrl: p.imageUrl,
          category: p.category,
          platformPrices: (p.platformPrices || []).map((pp: any) => ({
            platform: pp.platform,
            price: pp.price,
            originalPrice: pp.originalPrice,
            deliveryTime: pp.deliveryTime,
            productUrl: pp.productUrl,
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
  }, [debouncedQuery, pincode, hasPincode]);

  const displayProducts = useMemo(() => {
    const source = debouncedQuery.length >= 2 ? liveProducts : STATIC_GROCERY_PRODUCTS;
    return source.filter(p => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesCategory;
    });
  }, [liveProducts, selectedCategory, debouncedQuery.length]);

  const handleAddToCart = (product: Product, platform: Platform) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedPlatform === platform);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id && item.selectedPlatform === platform
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, selectedPlatform: platform, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, platform: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId && item.selectedPlatform === platform) {
          return { ...item, quantity: Math.max(0, item.quantity + delta) };
        }
        return item;
      }).filter(item => item.quantity > 0)
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
      <div className="min-h-screen flex flex-col transition-colors duration-300">
        <PincodeModal onConfirm={setPincode} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={activeSection === 'grocery' ? searchQuery : electronicsSearchQuery}
        onSearchChange={activeSection === 'grocery' ? setSearchQuery : setElectronicsSearchQuery}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pincode={pincode}
        onPincodeChange={setPincode}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {activeSection === 'grocery' && (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Compare prices</h1>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Pincode {pincode} · BigBasket, Blinkit, Instamart, Jiomart, Zepto
                </p>
              </div>
            </div>

            <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
              <div className="flex gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-yellow-400 text-neutral-900'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {searchQuery.length >= 2 && (
              <div className="mb-4 text-sm text-neutral-500">
                {isSearching && <span>Searching...</span>}
                {!isSearching && liveProducts.length > 0 && <span>{liveProducts.length} results</span>}
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
                  {searchQuery.length >= 2 ? 'No results. Try "milk", "bread", or "rice".' : 'Search above to compare prices.'}
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

        {activeSection === 'electronics' && (
          <ElectronicsPage
            pincode={pincode}
            searchQuery={electronicsSearchQuery}
            onSearchChange={setElectronicsSearchQuery}
            onAddToCart={handleAddToElectronicsCart}
          />
        )}

        {activeSection === 'flights' && <FlightsPage />}
      </main>

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
