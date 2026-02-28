import type { Product } from './types';

export const STATIC_ELECTRONICS_PRODUCTS: Product[] = [
  {
    id: 'e1',
    name: 'iPhone 15 128GB (Black)',
    brand: 'Apple',
    category: 'Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 79900, originalPrice: 89900, productUrl: 'https://www.amazon.in/dp/iphone15', inStock: true, discount: 11, offers: ['No cost EMI'], deliveryTime: '1-2 days' },
      { retailer: 'Flipkart', price: 78900, originalPrice: 89900, productUrl: 'https://www.flipkart.com/iphone-15', inStock: true, discount: 12, offers: ['Bank offer'], deliveryTime: '2-3 days' },
    ],
  },
  {
    id: 'e2',
    name: 'MacBook Air M2 13" 256GB',
    brand: 'Apple',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 104900, originalPrice: 114900, productUrl: 'https://www.amazon.in/dp/macbook-air', inStock: true, discount: 9, offers: ['Exchange'], deliveryTime: '2-3 days' },
      { retailer: 'Flipkart', price: 102990, originalPrice: 114900, productUrl: 'https://www.flipkart.com/macbook-air', inStock: true, discount: 10, offers: ['No cost EMI'], deliveryTime: '1-2 days' },
    ],
  },
  {
    id: 'e3',
    name: 'Sony WH-1000XM5 Wireless Headphones',
    brand: 'Sony',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 27990, originalPrice: 32990, productUrl: 'https://www.amazon.in/dp/sony-xm5', inStock: true, discount: 15, offers: ['5% off'], deliveryTime: '1 day' },
      { retailer: 'Flipkart', price: 27490, originalPrice: 32990, productUrl: 'https://www.flipkart.com/sony-wh1000xm5', inStock: true, discount: 17, offers: ['Supercoin'], deliveryTime: '2 days' },
    ],
  },
  {
    id: 'e4',
    name: 'Samsung 55" Crystal 4K Smart TV',
    brand: 'Samsung',
    category: 'TVs',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 52900, originalPrice: 64900, productUrl: 'https://www.amazon.in/dp/samsung-tv', inStock: true, discount: 18, offers: ['Exchange'], deliveryTime: '3-4 days' },
      { retailer: 'Flipkart', price: 51900, originalPrice: 64900, productUrl: 'https://www.flipkart.com/samsung-crystal-tv', inStock: true, discount: 20, offers: ['No cost EMI'], deliveryTime: '4-5 days' },
    ],
  },
  {
    id: 'e5',
    name: 'Apple Watch Series 9 GPS 41mm',
    brand: 'Apple',
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 41900, originalPrice: 45900, productUrl: 'https://www.amazon.in/dp/apple-watch-9', inStock: true, discount: 9, offers: [], deliveryTime: '1-2 days' },
      { retailer: 'Flipkart', price: 40900, originalPrice: 45900, productUrl: 'https://www.flipkart.com/apple-watch-series-9', inStock: true, discount: 11, offers: ['Bank offer'], deliveryTime: '2 days' },
    ],
  },
  {
    id: 'e6',
    name: 'iPad Air 10.9" 64GB WiFi',
    brand: 'Apple',
    category: 'Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon', price: 54900, originalPrice: 59900, productUrl: 'https://www.amazon.in/dp/ipad-air', inStock: true, discount: 8, offers: ['No cost EMI'], deliveryTime: '2 days' },
      { retailer: 'Flipkart', price: 53900, originalPrice: 59900, productUrl: 'https://www.flipkart.com/ipad-air', inStock: true, discount: 10, offers: ['Exchange'], deliveryTime: '1-2 days' },
    ],
  },
];
