
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import ElectronicsSearch from './components/ElectronicsSearch';
import { PRODUCTS, CATEGORIES } from './constants';
import { Product, Platform, CartItem, AppSection } from './types';
import { searchProducts, checkHealth, type SearchResult } from './services/groceryApi';
import { useDebounce } from './utils/useDebounce';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSection, setActiveSection] = useState<AppSection>('grocery');

  // Live search state
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [platformStatus, setPlatformStatus] = useState<Record<string, string> | null>(null);

  const debouncedQuery = useDebounce(searchQuery, 600);
  const abortRef = useRef<AbortController | null>(null);

  // Check if backend is reachable on mount
  useEffect(() => {
    checkHealth().then(setBackendAvailable);
  }, []);

  // Live search: fetch from backend when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2 || backendAvailable === false) {
      setLiveProducts([]);
      setPlatformStatus(null);
      setSearchError(null);
      return;
    }

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    const fetchLive = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const result: SearchResult = await searchProducts(debouncedQuery);
        setLiveProducts(result.products);
        setPlatformStatus(result.meta.platformStatus);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('Live search failed:', err);
        setSearchError(err instanceof Error ? err.message : 'Search failed');
        setLiveProducts([]);
      } finally {
        setIsSearching(false);
      }
    };

    fetchLive();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [debouncedQuery, backendAvailable]);

  // Decide which products to display
  const displayProducts = useMemo(() => {
    const useBackend = backendAvailable && debouncedQuery.length >= 2 && liveProducts.length > 0;
    const sourceProducts = useBackend ? liveProducts : PRODUCTS;

    return sourceProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, liveProducts, debouncedQuery, backendAvailable]);

  const handleAddToCart = (product: Product, platform: Platform) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.selectedPlatform === platform);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id && item.selectedPlatform === platform 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, selectedPlatform: platform, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, platform: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedPlatform === platform) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8">
        {/* ===== GROCERY / QUICK COMMERCE SECTION ===== */}
        {activeSection === 'grocery' && (
          <>
            {/* Banner Section */}
            <section className="mb-8 rounded-3xl overflow-hidden relative h-48 md:h-64 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center px-8 md:px-16 shadow-2xl shadow-indigo-100">
              <div className="relative z-10 max-w-lg">
                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">Lowest Prices Across Platforms.</h1>
                <p className="text-indigo-100 text-sm md:text-lg font-medium">Compare prices on BigBasket, Blinkit, Instamart, Jiomart & Zepto in real-time.</p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="flex -space-x-3">
                    <img src="https://www.bigbasket.com/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain" alt="BigBasket" title="BigBasket" />
                    <img src="https://blinkit.com/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain" alt="Blinkit" title="Blinkit" />
                    <img src="https://www.google.com/s2/favicons?domain=swiggy.com&sz=128" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain" alt="Instamart" title="Instamart" />
                    <img src="https://www.jiomart.com/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain" alt="Jiomart" title="Jiomart" />
                    <img src="https://www.zepto.com/favicon.ico" className="w-9 h-9 rounded-full border-2 border-white bg-white shadow-md object-contain" alt="Zepto" title="Zepto" />
                  </div>
                  <span className="text-white text-xs md:text-sm font-bold flex items-center">Trusted by 1M+ Smart Shoppers</span>
                </div>
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none">
                <svg viewBox="0 0 200 200" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#FFFFFF" d="M47.5,-59.2C59.9,-48.5,67.1,-32,71.7,-14.7C76.3,2.7,78.2,21,71,36.5C63.8,51.9,47.5,64.5,30.3,70.5C13.1,76.5,-5.1,75.9,-23,70C-40.9,64.2,-58.5,53.2,-68.1,37.3C-77.8,21.5,-79.4,0.7,-74.6,-18.3C-69.8,-37.2,-58.6,-54.3,-43.1,-63.9C-27.6,-73.4,-7.8,-75.4,6.7,-84.7C21.2,-93.9,47.5,-59.2,47.5,-59.2Z" transform="translate(100 100)" />
                </svg>
              </div>
            </section>

            {/* Categories Scroller */}
            <div className="mb-8 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex gap-3">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                      selectedCategory === cat 
                      ? 'bg-black text-white shadow-lg' 
                      : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Search Status Bar */}
            {searchQuery.length >= 2 && (
              <div className="mb-4 flex items-center gap-3 text-xs">
                {backendAvailable && isSearching && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-semibold">
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    Fetching live prices...
                  </div>
                )}
                {backendAvailable && !isSearching && liveProducts.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Live prices from {platformStatus ? Object.values(platformStatus).filter(s => s === 'success').length : 0} platforms
                  </div>
                )}
                {searchError && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Using cached prices
                  </div>
                )}
                {backendAvailable === false && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full font-semibold">
                    Showing saved prices (backend offline)
                  </div>
                )}
              </div>
            )}

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {displayProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>

            {/* Loading skeleton while searching */}
            {isSearching && displayProducts.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-2 bg-gray-100 rounded w-16" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                      <div className="space-y-2 mt-4">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <div key={j} className="h-8 bg-gray-50 rounded-lg" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && displayProducts.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
                <button onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="mt-4 text-indigo-600 font-bold underline underline-offset-4">Reset all filters</button>
              </div>
            )}
          </>
        )}

        {/* ===== ELECTRONICS & DEVICES SECTION ===== */}
        {activeSection === 'electronics' && (
          <ElectronicsSearch />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-20 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-black text-sm">V</div>
              <span className="text-xl font-black text-gray-900 tracking-tighter">valyux</span>
            </div>
            <p className="text-gray-400 text-sm">Empowering grocery shoppers with AI-first intelligence.</p>
          </div>
          <div className="flex gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
            <a href="#" className="hover:text-black transition-colors">About</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">API</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-gray-50 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          © 2024 Valyux Technology Solutions. All Rights Reserved.
        </div>
      </footer>

      {isCartOpen && (
        <CartDrawer 
          items={cart} 
          onClose={() => setIsCartOpen(false)} 
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}
    </div>
  );
};

export default App;
