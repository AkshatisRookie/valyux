import React from 'react';
import ElectronicsProductCard from './ElectronicsProductCard';
import type { Product } from './types';

interface Props {
  products: Product[];
}

const ElectronicsResults: React.FC<Props> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {products.map((product, i) => (
        <ElectronicsProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
};

export default ElectronicsResults;
