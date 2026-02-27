import React from 'react';
import ElectronicsProductCard from './ElectronicsProductCard';
import type { Product } from './types';

interface Props {
  products: Product[];
  onAddToCart?: (item: { productId: string; name: string; imageUrl: string; brand: string; retailer: 'Amazon' | 'Flipkart'; price: number; productUrl: string }) => void;
}

const ElectronicsResults: React.FC<Props> = ({ products, onAddToCart }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
      {products.map((product, i) => (
        <ElectronicsProductCard key={product.id} product={product} index={i} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
};

export default ElectronicsResults;
