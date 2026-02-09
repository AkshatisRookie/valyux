
import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import { PRODUCTS, CATEGORIES } from './constants';
import { Product, Platform, CartItem } from './types';

const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-8">
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filters.</p>
            <button onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="mt-4 text-indigo-600 font-bold underline underline-offset-4">Reset all filters</button>
          </div>
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
