
import React from 'react';
import { Product, Platform } from '../types';
import { getPlatformSearchUrl } from '../config/affiliateLinks';

const getProductLink = (platform: Platform, productName: string, productUrl?: string) =>
  productUrl || getPlatformSearchUrl(platform, productName);

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
      case 'BigBasket': return 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
      case 'Blinkit':   return 'text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
      case 'Instamart':  return 'text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20';
      case 'Jiomart':   return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20';
      case 'Zepto':     return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20';
      default:          return 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'BigBasket': return 'https://www.bigbasket.com/favicon.ico';
      case 'Blinkit':   return 'https://blinkit.com/favicon.ico';
      case 'Instamart':  return 'https://www.google.com/s2/favicons?domain=swiggy.com&sz=128';
      case 'Jiomart':   return 'https://www.jiomart.com/favicon.ico';
      case 'Zepto':     return 'https://www.zepto.com/favicon.ico';
      default:          return '';
    }
  };

  const isCheapest = (platform: Platform) => platform === cheapestPrice.platform;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
      <div className="relative aspect-square p-4 bg-neutral-50 dark:bg-neutral-800">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
          </div>
        )}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-neutral-900 text-xs font-semibold px-2 py-0.5 rounded">
            {discountPct}% off
          </span>
        )}
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-xs text-neutral-500 mb-0.5">{product.brand}</p>
        <h3 className="font-medium text-neutral-900 dark:text-white text-sm line-clamp-2 mb-1">{product.name}</h3>
        <p className="text-xs text-neutral-500 mb-3">{product.quantity}</p>

        <div className="space-y-1.5 mt-auto">
          {product.platformPrices.map((pp) => (
            <div
              key={pp.platform}
              className={`flex items-center justify-between py-2 px-2.5 rounded-lg ${getPlatformColor(pp.platform)} ${isCheapest(pp.platform) ? 'ring-1 ring-yellow-400' : ''}`}
            >
              <div className="flex items-center gap-1.5">
                <img src={getPlatformIcon(pp.platform)} alt="" className="w-3.5 h-3.5 rounded-full" />
                <span className="text-xs font-medium">{pp.platform}</span>
                {isCheapest(pp.platform) && <span className="text-[10px] font-semibold text-yellow-700 dark:text-yellow-400">Best</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs line-through text-neutral-500">₹{pp.originalPrice}</span>
                <span className="text-sm font-semibold">₹{pp.price}</span>
                <a href={getProductLink(pp.platform, product.name, pp.productUrl)} target="_blank" rel="noopener noreferrer" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white" title="Open">↗</a>
                <button onClick={() => onAddToCart(product, pp.platform)} className="w-6 h-6 flex items-center justify-center rounded bg-neutral-200 dark:bg-neutral-600 hover:bg-yellow-400 hover:text-neutral-900 text-sm font-bold">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/80 border-t border-neutral-100 dark:border-neutral-700 flex justify-between items-center text-xs">
        <span className="text-neutral-500">Lowest</span>
        <span className="font-semibold text-yellow-600 dark:text-yellow-400">{cheapestPrice.platform} ₹{cheapestPrice.price}</span>
      </div>
    </div>
  );
};

export default ProductCard;
