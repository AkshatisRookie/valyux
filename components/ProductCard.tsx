
import React from 'react';
import { Product, Platform } from '../types';
import { getPlatformSearchUrl } from '../config/affiliateLinks';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, platform: Platform) => void;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&q=80';

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const sortedPrices = [...product.platformPrices].sort((a, b) => a.price - b.price);
  const cheapestPrice = sortedPrices[0];
  const discountPct = cheapestPrice.originalPrice > cheapestPrice.price
    ? Math.round((1 - cheapestPrice.price / cheapestPrice.originalPrice) * 100)
    : 0;

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case 'BigBasket': return 'text-green-600 border-green-200 bg-green-50';
      case 'Blinkit': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'Instamart': return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'Jiomart': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'Zepto': return 'text-purple-600 border-purple-200 bg-purple-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'BigBasket': return 'https://www.bigbasket.com/favicon.ico';
      case 'Blinkit': return 'https://blinkit.com/favicon.ico';
      case 'Instamart': return 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128';
      case 'Jiomart': return 'https://www.jiomart.com/favicon.ico';
      case 'Zepto': return 'https://www.zepto.com/favicon.ico';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md group">
      <div className="relative aspect-square p-4 bg-gray-50">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        {discountPct > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
            {discountPct}% OFF
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.brand}</div>
        <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 leading-snug">{product.name}</h3>
        <div className="text-xs text-gray-500 mb-4">{product.quantity}</div>
        
        <div className="space-y-2 mt-auto">
          {product.platformPrices.map((pp) => (
            <div key={pp.platform} className={`flex items-center justify-between p-2 rounded-lg border ${getPlatformColor(pp.platform)}`}>
              <div className="flex items-center gap-2">
                <img src={getPlatformIcon(pp.platform)} alt={pp.platform} className="w-4 h-4 rounded-full" />
                <span className="text-[10px] font-bold uppercase">{pp.platform}</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] line-through opacity-60">₹{pp.originalPrice}</span>
                  <span className="text-xs font-bold">₹{pp.price}</span>
                </div>
                <div className="text-[8px] opacity-70">Delivery: {pp.deliveryTime}</div>
              </div>
              <div className="flex items-center gap-1 ml-1">
                <a
                  href={getPlatformSearchUrl(pp.platform, product.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 flex items-center justify-center bg-white border border-current rounded-md hover:bg-current hover:text-white transition-colors"
                  title={`Open ${product.name} on ${pp.platform}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                <button 
                  onClick={() => onAddToCart(product, pp.platform)}
                  className="w-6 h-6 flex items-center justify-center bg-white border border-current rounded-md hover:bg-current hover:text-white transition-colors"
                >
                  <span className="text-lg leading-none">+</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
        <span className="text-[10px] font-medium text-gray-400">Cheapest at:</span>
        <span className="text-[10px] font-bold text-green-600">{cheapestPrice.platform} (₹{cheapestPrice.price})</span>
      </div>
    </div>
  );
};

export default ProductCard;
