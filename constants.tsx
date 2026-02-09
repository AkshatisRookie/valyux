
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Amul Gold Full Cream Milk',
    brand: 'Amul',
    quantity: '500 ml',
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    category: 'Dairy',
    platformPrices: [
      { platform: 'BigBasket', price: 34, originalPrice: 35, deliveryTime: '15 mins' },
      { platform: 'Blinkit', price: 35, originalPrice: 35, deliveryTime: '8 mins' },
      { platform: 'Instamart', price: 33, originalPrice: 35, deliveryTime: '12 mins' },
      { platform: 'Jiomart', price: 34.5, originalPrice: 35, deliveryTime: '20 mins' },
      { platform: 'Zepto', price: 33.5, originalPrice: 35, deliveryTime: '10 mins' },
    ]
  },
  {
    id: '2',
    name: 'Capsicum - Green',
    brand: 'Fresho',
    quantity: '500 g',
    imageUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80',
    category: 'Vegetables',
    platformPrices: [
      { platform: 'BigBasket', price: 67.5, originalPrice: 144, deliveryTime: '10 mins' },
      { platform: 'Blinkit', price: 72, originalPrice: 150, deliveryTime: '9 mins' },
      { platform: 'Instamart', price: 69, originalPrice: 140, deliveryTime: '11 mins' },
      { platform: 'Jiomart', price: 68, originalPrice: 145, deliveryTime: '25 mins' },
      { platform: 'Zepto', price: 70, originalPrice: 148, deliveryTime: '9 mins' },
    ]
  },
  {
    id: '3',
    name: 'Amul Salted Butter',
    brand: 'Amul',
    quantity: '100 g',
    imageUrl: 'https://images.unsplash.com/photo-1588165933713-b62464c2a0e0?w=400&q=80',
    category: 'Dairy',
    platformPrices: [
      { platform: 'BigBasket', price: 56, originalPrice: 58, deliveryTime: '10 mins' },
      { platform: 'Blinkit', price: 58, originalPrice: 58, deliveryTime: '8 mins' },
      { platform: 'Instamart', price: 57, originalPrice: 58, deliveryTime: '12 mins' },
      { platform: 'Jiomart', price: 56.5, originalPrice: 58, deliveryTime: '22 mins' },
      { platform: 'Zepto', price: 57.5, originalPrice: 58, deliveryTime: '11 mins' },
    ]
  },
  {
    id: '4',
    name: 'Carrot - Orange',
    brand: 'Fresho',
    quantity: '500 g',
    imageUrl: 'https://images.unsplash.com/photo-1598170845051-5c2d228b2074?w=400&q=80',
    category: 'Vegetables',
    platformPrices: [
      { platform: 'BigBasket', price: 29, originalPrice: 72, deliveryTime: '10 mins' },
      { platform: 'Blinkit', price: 31, originalPrice: 75, deliveryTime: '7 mins' },
      { platform: 'Instamart', price: 30, originalPrice: 70, deliveryTime: '14 mins' },
      { platform: 'Jiomart', price: 29.5, originalPrice: 73, deliveryTime: '18 mins' },
      { platform: 'Zepto', price: 30.5, originalPrice: 71, deliveryTime: '8 mins' },
    ]
  },
  {
    id: '5',
    name: 'Maggi 2-Minute Instant Noodles',
    brand: 'Nestle',
    quantity: '300 g',
    imageUrl: 'https://images.unsplash.com/photo-1569718212167-3ad0f9ec2f8a?w=400&q=80',
    category: 'Snacks',
    platformPrices: [
      { platform: 'BigBasket', price: 48, originalPrice: 58, deliveryTime: '12 mins' },
      { platform: 'Blinkit', price: 50, originalPrice: 58, deliveryTime: '10 mins' },
      { platform: 'Instamart', price: 47, originalPrice: 58, deliveryTime: '15 mins' },
      { platform: 'Jiomart', price: 48.5, originalPrice: 58, deliveryTime: '24 mins' },
      { platform: 'Zepto', price: 47.5, originalPrice: 58, deliveryTime: '9 mins' },
    ]
  },
  {
    id: '6',
    name: 'Cauliflower',
    brand: 'Fresho',
    quantity: '1 pc (approx. 400 to 600 g)',
    imageUrl: 'https://images.unsplash.com/photo-1574944985070-8f3ebcfe5e5e?w=400&q=80',
    category: 'Vegetables',
    platformPrices: [
      { platform: 'BigBasket', price: 43.2, originalPrice: 54, deliveryTime: '10 mins' },
      { platform: 'Blinkit', price: 45, originalPrice: 55, deliveryTime: '8 mins' },
      { platform: 'Instamart', price: 42, originalPrice: 52, deliveryTime: '12 mins' },
      { platform: 'Jiomart', price: 43.5, originalPrice: 54, deliveryTime: '20 mins' },
      { platform: 'Zepto', price: 42.5, originalPrice: 53, deliveryTime: '10 mins' },
    ]
  },
  { id: '7', name: 'Bananas', brand: 'Fresho', quantity: '1 dozen', imageUrl: 'https://images.unsplash.com/photo-1603832645937-98d3fb133bf4?w=400&q=80', category: 'Fruits', platformPrices: [
    { platform: 'BigBasket', price: 48, originalPrice: 55, deliveryTime: '12 mins' }, { platform: 'Blinkit', price: 52, originalPrice: 58, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 50, originalPrice: 56, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 49, originalPrice: 57, deliveryTime: '22 mins' }, { platform: 'Zepto', price: 51, originalPrice: 56, deliveryTime: '9 mins' },
  ]},
  { id: '8', name: 'Tomatoes', brand: 'Fresho', quantity: '1 kg', imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264b2512d?w=400&q=80', category: 'Vegetables', platformPrices: [
    { platform: 'BigBasket', price: 38, originalPrice: 48, deliveryTime: '10 mins' }, { platform: 'Blinkit', price: 42, originalPrice: 50, deliveryTime: '7 mins' }, { platform: 'Instamart', price: 40, originalPrice: 48, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 39, originalPrice: 49, deliveryTime: '20 mins' }, { platform: 'Zepto', price: 41, originalPrice: 50, deliveryTime: '8 mins' },
  ]},
  { id: '9', name: 'Onion', brand: 'Fresho', quantity: '1 kg', imageUrl: 'https://images.unsplash.com/photo-1615485290382-24990a8d76a0?w=400&q=80', category: 'Vegetables', platformPrices: [
    { platform: 'BigBasket', price: 32, originalPrice: 42, deliveryTime: '10 mins' }, { platform: 'Blinkit', price: 35, originalPrice: 44, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 33, originalPrice: 42, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 31, originalPrice: 43, deliveryTime: '18 mins' }, { platform: 'Zepto', price: 34, originalPrice: 43, deliveryTime: '9 mins' },
  ]},
  { id: '10', name: 'Potatoes', brand: 'Fresho', quantity: '1 kg', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80', category: 'Vegetables', platformPrices: [
    { platform: 'BigBasket', price: 28, originalPrice: 38, deliveryTime: '11 mins' }, { platform: 'Blinkit', price: 32, originalPrice: 40, deliveryTime: '7 mins' }, { platform: 'Instamart', price: 30, originalPrice: 38, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 29, originalPrice: 39, deliveryTime: '22 mins' }, { platform: 'Zepto', price: 31, originalPrice: 39, deliveryTime: '10 mins' },
  ]},
  { id: '11', name: 'Alphonso Mango', brand: 'Fresho', quantity: '1 kg', imageUrl: 'https://images.unsplash.com/photo-1553271662-246f6b4c6951?w=400&q=80', category: 'Fruits', platformPrices: [
    { platform: 'BigBasket', price: 180, originalPrice: 220, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 195, originalPrice: 230, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 185, originalPrice: 225, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 175, originalPrice: 215, deliveryTime: '25 mins' }, { platform: 'Zepto', price: 190, originalPrice: 228, deliveryTime: '10 mins' },
  ]},
  { id: '12', name: 'Amul Taaza Toned Milk', brand: 'Amul', quantity: '1 L', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80', category: 'Dairy', platformPrices: [
    { platform: 'BigBasket', price: 58, originalPrice: 62, deliveryTime: '14 mins' }, { platform: 'Blinkit', price: 60, originalPrice: 62, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 57, originalPrice: 62, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 59, originalPrice: 62, deliveryTime: '20 mins' }, { platform: 'Zepto', price: 58, originalPrice: 62, deliveryTime: '10 mins' },
  ]},
  { id: '13', name: 'Mother Dairy Curd', brand: 'Mother Dairy', quantity: '400 g', imageUrl: 'https://images.unsplash.com/photo-1571212515416-ffe4b2d2b758?w=400&q=80', category: 'Dairy', platformPrices: [
    { platform: 'BigBasket', price: 36, originalPrice: 42, deliveryTime: '12 mins' }, { platform: 'Blinkit', price: 40, originalPrice: 44, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 38, originalPrice: 43, deliveryTime: '11 mins' }, { platform: 'Jiomart', price: 37, originalPrice: 42, deliveryTime: '22 mins' }, { platform: 'Zepto', price: 39, originalPrice: 43, deliveryTime: '9 mins' },
  ]},
  { id: '14', name: 'Amul Fresh Paneer', brand: 'Amul', quantity: '200 g', imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80', category: 'Dairy', platformPrices: [
    { platform: 'BigBasket', price: 98, originalPrice: 110, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 105, originalPrice: 112, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 102, originalPrice: 110, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 100, originalPrice: 108, deliveryTime: '24 mins' }, { platform: 'Zepto', price: 104, originalPrice: 111, deliveryTime: '10 mins' },
  ]},
  { id: '15', name: 'Amul Cheese Slices', brand: 'Amul', quantity: '200 g', imageUrl: 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=400&q=80', category: 'Dairy', platformPrices: [
    { platform: 'BigBasket', price: 135, originalPrice: 148, deliveryTime: '12 mins' }, { platform: 'Blinkit', price: 142, originalPrice: 150, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 138, originalPrice: 148, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 132, originalPrice: 145, deliveryTime: '22 mins' }, { platform: 'Zepto', price: 140, originalPrice: 148, deliveryTime: '9 mins' },
  ]},
  { id: '16', name: 'Coca-Cola Soft Drink', brand: 'Coca-Cola', quantity: '2 L', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80', category: 'Beverages', platformPrices: [
    { platform: 'BigBasket', price: 95, originalPrice: 110, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 99, originalPrice: 110, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 92, originalPrice: 108, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 94, originalPrice: 108, deliveryTime: '25 mins' }, { platform: 'Zepto', price: 96, originalPrice: 109, deliveryTime: '10 mins' },
  ]},
  { id: '17', name: 'Pepsi Soft Drink', brand: 'Pepsi', quantity: '2 L', imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400&q=80', category: 'Beverages', platformPrices: [
    { platform: 'BigBasket', price: 90, originalPrice: 105, deliveryTime: '14 mins' }, { platform: 'Blinkit', price: 95, originalPrice: 106, deliveryTime: '7 mins' }, { platform: 'Instamart', price: 88, originalPrice: 104, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 89, originalPrice: 103, deliveryTime: '24 mins' }, { platform: 'Zepto', price: 92, originalPrice: 105, deliveryTime: '9 mins' },
  ]},
  { id: '18', name: 'Lay\'s Potato Chips', brand: 'Lay\'s', quantity: '52 g', imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80', category: 'Snacks', platformPrices: [
    { platform: 'BigBasket', price: 20, originalPrice: 25, deliveryTime: '12 mins' }, { platform: 'Blinkit', price: 22, originalPrice: 25, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 19, originalPrice: 24, deliveryTime: '11 mins' }, { platform: 'Jiomart', price: 21, originalPrice: 25, deliveryTime: '20 mins' }, { platform: 'Zepto', price: 20, originalPrice: 24, deliveryTime: '9 mins' },
  ]},
  { id: '19', name: 'Parle-G Gold Biscuits', brand: 'Parle', quantity: '600 g', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80', category: 'Snacks', platformPrices: [
    { platform: 'BigBasket', price: 65, originalPrice: 75, deliveryTime: '13 mins' }, { platform: 'Blinkit', price: 68, originalPrice: 76, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 63, originalPrice: 74, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 64, originalPrice: 73, deliveryTime: '22 mins' }, { platform: 'Zepto', price: 66, originalPrice: 75, deliveryTime: '10 mins' },
  ]},
  { id: '20', name: 'Haldiram\'s Aloo Bhujia', brand: 'Haldiram\'s', quantity: '500 g', imageUrl: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&q=80', category: 'Snacks', platformPrices: [
    { platform: 'BigBasket', price: 95, originalPrice: 110, deliveryTime: '14 mins' }, { platform: 'Blinkit', price: 99, originalPrice: 112, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 92, originalPrice: 108, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 94, originalPrice: 109, deliveryTime: '24 mins' }, { platform: 'Zepto', price: 96, originalPrice: 110, deliveryTime: '9 mins' },
  ]},
  { id: '21', name: 'Red Bull Energy Drink', brand: 'Red Bull', quantity: '250 ml', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', category: 'Beverages', platformPrices: [
    { platform: 'BigBasket', price: 115, originalPrice: 130, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 120, originalPrice: 132, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 112, originalPrice: 128, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 118, originalPrice: 130, deliveryTime: '25 mins' }, { platform: 'Zepto', price: 116, originalPrice: 129, deliveryTime: '10 mins' },
  ]},
  { id: '22', name: 'Harpic Toilet Paper', brand: 'Harpic', quantity: '4 rolls', imageUrl: 'https://images.unsplash.com/photo-1584556812953-39f561b763d5?w=400&q=80', category: 'Household', platformPrices: [
    { platform: 'BigBasket', price: 185, originalPrice: 210, deliveryTime: '18 mins' }, { platform: 'Blinkit', price: 192, originalPrice: 212, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 180, originalPrice: 208, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 178, originalPrice: 205, deliveryTime: '28 mins' }, { platform: 'Zepto', price: 188, originalPrice: 210, deliveryTime: '11 mins' },
  ]},
  { id: '23', name: 'Vim Dishwash Liquid', brand: 'Vim', quantity: '500 ml', imageUrl: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80', category: 'Household', platformPrices: [
    { platform: 'BigBasket', price: 95, originalPrice: 115, deliveryTime: '16 mins' }, { platform: 'Blinkit', price: 99, originalPrice: 116, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 92, originalPrice: 112, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 94, originalPrice: 114, deliveryTime: '26 mins' }, { platform: 'Zepto', price: 96, originalPrice: 114, deliveryTime: '10 mins' },
  ]},
  { id: '24', name: 'Surf Excel Easy Wash', brand: 'Surf', quantity: '1 kg', imageUrl: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&q=80', category: 'Household', platformPrices: [
    { platform: 'BigBasket', price: 245, originalPrice: 280, deliveryTime: '17 mins' }, { platform: 'Blinkit', price: 252, originalPrice: 282, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 238, originalPrice: 275, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 242, originalPrice: 278, deliveryTime: '27 mins' }, { platform: 'Zepto', price: 248, originalPrice: 279, deliveryTime: '11 mins' },
  ]},
  { id: '25', name: 'Lizol Floor Cleaner', brand: 'Lizol', quantity: '1 L', imageUrl: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=400&q=80', category: 'Household', platformPrices: [
    { platform: 'BigBasket', price: 165, originalPrice: 190, deliveryTime: '16 mins' }, { platform: 'Blinkit', price: 172, originalPrice: 192, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 158, originalPrice: 185, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 162, originalPrice: 188, deliveryTime: '26 mins' }, { platform: 'Zepto', price: 168, originalPrice: 190, deliveryTime: '10 mins' },
  ]},
  { id: '26', name: 'Glad Garbage Bags', brand: 'Glad', quantity: '30 count', imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=400&q=80', category: 'Household', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 320, deliveryTime: '18 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 322, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 278, originalPrice: 315, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 318, deliveryTime: '28 mins' }, { platform: 'Zepto', price: 288, originalPrice: 320, deliveryTime: '11 mins' },
  ]},
  { id: '27', name: 'Dove Shampoo', brand: 'Dove', quantity: '340 ml', imageUrl: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=400&q=80', category: 'Personal Care', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 320, deliveryTime: '16 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 322, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 278, originalPrice: 315, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 318, deliveryTime: '26 mins' }, { platform: 'Zepto', price: 288, originalPrice: 320, deliveryTime: '10 mins' },
  ]},
  { id: '28', name: 'Colgate Toothpaste', brand: 'Colgate', quantity: '200 g', imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400&q=80', category: 'Personal Care', platformPrices: [
    { platform: 'BigBasket', price: 125, originalPrice: 145, deliveryTime: '14 mins' }, { platform: 'Blinkit', price: 132, originalPrice: 148, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 118, originalPrice: 142, deliveryTime: '12 mins' }, { platform: 'Jiomart', price: 122, originalPrice: 144, deliveryTime: '24 mins' }, { platform: 'Zepto', price: 128, originalPrice: 145, deliveryTime: '9 mins' },
  ]},
  { id: '29', name: 'Axe Deodorant Body Spray', brand: 'Axe', quantity: '150 ml', imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&q=80', category: 'Personal Care', platformPrices: [
    { platform: 'BigBasket', price: 245, originalPrice: 280, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 252, originalPrice: 282, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 238, originalPrice: 275, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 242, originalPrice: 278, deliveryTime: '25 mins' }, { platform: 'Zepto', price: 248, originalPrice: 279, deliveryTime: '10 mins' },
  ]},
  { id: '30', name: 'Whisper Sanitary Napkins', brand: 'Whisper', quantity: 'Pack of 20', imageUrl: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bbf2?w=400&q=80', category: 'Personal Care', platformPrices: [
    { platform: 'BigBasket', price: 185, originalPrice: 215, deliveryTime: '16 mins' }, { platform: 'Blinkit', price: 192, originalPrice: 218, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 178, originalPrice: 212, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 182, originalPrice: 210, deliveryTime: '26 mins' }, { platform: 'Zepto', price: 188, originalPrice: 214, deliveryTime: '10 mins' },
  ]},
  { id: '31', name: 'Garnier Face Wash', brand: 'Garnier', quantity: '200 ml', imageUrl: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&q=80', category: 'Personal Care', platformPrices: [
    { platform: 'BigBasket', price: 165, originalPrice: 195, deliveryTime: '15 mins' }, { platform: 'Blinkit', price: 172, originalPrice: 198, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 158, originalPrice: 192, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 162, originalPrice: 194, deliveryTime: '25 mins' }, { platform: 'Zepto', price: 168, originalPrice: 195, deliveryTime: '10 mins' },
  ]},
  { id: '32', name: 'Amul Ice Cream', brand: 'Amul', quantity: '1 L', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80', category: 'Frozen', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 320, deliveryTime: '20 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 322, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 278, originalPrice: 315, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 318, deliveryTime: '30 mins' }, { platform: 'Zepto', price: 288, originalPrice: 320, deliveryTime: '12 mins' },
  ]},
  { id: '33', name: 'Frozen Peas & Mixed Veg', brand: 'Fresho', quantity: '500 g', imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', category: 'Frozen', platformPrices: [
    { platform: 'BigBasket', price: 95, originalPrice: 115, deliveryTime: '18 mins' }, { platform: 'Blinkit', price: 99, originalPrice: 116, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 92, originalPrice: 112, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 94, originalPrice: 114, deliveryTime: '28 mins' }, { platform: 'Zepto', price: 96, originalPrice: 114, deliveryTime: '11 mins' },
  ]},
  { id: '34', name: 'Ready-to-Cook Parathas', brand: 'MTR', quantity: '6 pcs', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', category: 'Frozen', platformPrices: [
    { platform: 'BigBasket', price: 125, originalPrice: 148, deliveryTime: '19 mins' }, { platform: 'Blinkit', price: 132, originalPrice: 150, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 118, originalPrice: 145, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 122, originalPrice: 146, deliveryTime: '28 mins' }, { platform: 'Zepto', price: 128, originalPrice: 147, deliveryTime: '10 mins' },
  ]},
  { id: '35', name: 'Frozen Pizza Margherita', brand: 'Amul', quantity: '300 g', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', category: 'Frozen', platformPrices: [
    { platform: 'BigBasket', price: 165, originalPrice: 195, deliveryTime: '20 mins' }, { platform: 'Blinkit', price: 172, originalPrice: 198, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 158, originalPrice: 192, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 162, originalPrice: 194, deliveryTime: '30 mins' }, { platform: 'Zepto', price: 168, originalPrice: 195, deliveryTime: '12 mins' },
  ]},
  { id: '36', name: 'Fresh Chicken Breast', brand: 'Fresho', quantity: '500 g', imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80', category: 'Meat', platformPrices: [
    { platform: 'BigBasket', price: 245, originalPrice: 280, deliveryTime: '25 mins' }, { platform: 'Blinkit', price: 252, originalPrice: 282, deliveryTime: '12 mins' }, { platform: 'Instamart', price: 238, originalPrice: 275, deliveryTime: '18 mins' }, { platform: 'Jiomart', price: 242, originalPrice: 278, deliveryTime: '35 mins' }, { platform: 'Zepto', price: 248, originalPrice: 279, deliveryTime: '14 mins' },
  ]},
  { id: '37', name: 'Fresh Fish Fillet', brand: 'Fresho', quantity: '500 g', imageUrl: 'https://images.unsplash.com/photo-1519708227418-8e673682dc0a?w=400&q=80', category: 'Meat', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 320, deliveryTime: '26 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 322, deliveryTime: '12 mins' }, { platform: 'Instamart', price: 278, originalPrice: 315, deliveryTime: '19 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 318, deliveryTime: '36 mins' }, { platform: 'Zepto', price: 288, originalPrice: 320, deliveryTime: '14 mins' },
  ]},
  { id: '38', name: 'Pampers Diapers', brand: 'Pampers', quantity: 'Pack of 44', imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80', category: 'Baby', platformPrices: [
    { platform: 'BigBasket', price: 685, originalPrice: 780, deliveryTime: '20 mins' }, { platform: 'Blinkit', price: 692, originalPrice: 782, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 678, originalPrice: 775, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 682, originalPrice: 778, deliveryTime: '32 mins' }, { platform: 'Zepto', price: 688, originalPrice: 779, deliveryTime: '12 mins' },
  ]},
  { id: '39', name: 'Johnson\'s Baby Wipes', brand: 'Johnson\'s', quantity: '3 packs', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80', category: 'Baby', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 320, deliveryTime: '18 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 322, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 278, originalPrice: 315, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 318, deliveryTime: '30 mins' }, { platform: 'Zepto', price: 288, originalPrice: 320, deliveryTime: '11 mins' },
  ]},
  { id: '40', name: 'Cerelac Baby Food', brand: 'Nestle', quantity: '300 g', imageUrl: 'https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&q=80', category: 'Baby', platformPrices: [
    { platform: 'BigBasket', price: 245, originalPrice: 280, deliveryTime: '19 mins' }, { platform: 'Blinkit', price: 252, originalPrice: 282, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 238, originalPrice: 275, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 242, originalPrice: 278, deliveryTime: '31 mins' }, { platform: 'Zepto', price: 248, originalPrice: 279, deliveryTime: '11 mins' },
  ]},
  { id: '41', name: 'Johnson\'s Baby Powder', brand: 'Johnson\'s', quantity: '200 g', imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&q=80', category: 'Baby', platformPrices: [
    { platform: 'BigBasket', price: 165, originalPrice: 195, deliveryTime: '17 mins' }, { platform: 'Blinkit', price: 172, originalPrice: 198, deliveryTime: '8 mins' }, { platform: 'Instamart', price: 158, originalPrice: 192, deliveryTime: '13 mins' }, { platform: 'Jiomart', price: 162, originalPrice: 194, deliveryTime: '29 mins' }, { platform: 'Zepto', price: 168, originalPrice: 195, deliveryTime: '10 mins' },
  ]},
  { id: '42', name: 'Lactogen Infant Formula', brand: 'Nestle', quantity: '400 g', imageUrl: 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&q=80', category: 'Baby', platformPrices: [
    { platform: 'BigBasket', price: 485, originalPrice: 545, deliveryTime: '20 mins' }, { platform: 'Blinkit', price: 492, originalPrice: 548, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 478, originalPrice: 540, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 482, originalPrice: 542, deliveryTime: '32 mins' }, { platform: 'Zepto', price: 488, originalPrice: 544, deliveryTime: '12 mins' },
  ]},
  { id: '43', name: 'Pedigree Dog Food', brand: 'Pedigree', quantity: '3 kg', imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 685, originalPrice: 780, deliveryTime: '22 mins' }, { platform: 'Blinkit', price: 692, originalPrice: 782, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 678, originalPrice: 775, deliveryTime: '16 mins' }, { platform: 'Jiomart', price: 682, originalPrice: 778, deliveryTime: '34 mins' }, { platform: 'Zepto', price: 688, originalPrice: 779, deliveryTime: '12 mins' },
  ]},
  { id: '44', name: 'Whiskas Cat Food', brand: 'Whiskas', quantity: '1.2 kg', imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 385, originalPrice: 445, deliveryTime: '21 mins' }, { platform: 'Blinkit', price: 392, originalPrice: 448, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 378, originalPrice: 440, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 382, originalPrice: 442, deliveryTime: '33 mins' }, { platform: 'Zepto', price: 388, originalPrice: 444, deliveryTime: '11 mins' },
  ]},
  { id: '45', name: 'Cat Litter', brand: 'SmartCat', quantity: '4 kg', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 485, originalPrice: 555, deliveryTime: '23 mins' }, { platform: 'Blinkit', price: 492, originalPrice: 558, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 478, originalPrice: 550, deliveryTime: '16 mins' }, { platform: 'Jiomart', price: 482, originalPrice: 552, deliveryTime: '35 mins' }, { platform: 'Zepto', price: 488, originalPrice: 554, deliveryTime: '12 mins' },
  ]},
  { id: '46', name: 'Pedigree Dog Treats', brand: 'Pedigree', quantity: '300 g', imageUrl: 'https://images.unsplash.com/photo-1589941024233-39a0d1db5c46?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 285, originalPrice: 330, deliveryTime: '20 mins' }, { platform: 'Blinkit', price: 292, originalPrice: 332, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 278, originalPrice: 325, deliveryTime: '14 mins' }, { platform: 'Jiomart', price: 282, originalPrice: 328, deliveryTime: '32 mins' }, { platform: 'Zepto', price: 288, originalPrice: 330, deliveryTime: '11 mins' },
  ]},
  { id: '47', name: 'Pet Grooming Shampoo', brand: 'Drools', quantity: '500 ml', imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 385, originalPrice: 445, deliveryTime: '21 mins' }, { platform: 'Blinkit', price: 392, originalPrice: 448, deliveryTime: '9 mins' }, { platform: 'Instamart', price: 378, originalPrice: 440, deliveryTime: '15 mins' }, { platform: 'Jiomart', price: 382, originalPrice: 442, deliveryTime: '33 mins' }, { platform: 'Zepto', price: 388, originalPrice: 444, deliveryTime: '11 mins' },
  ]},
  { id: '48', name: 'Pet Chew Toys', brand: 'Kong', quantity: '2 pcs', imageUrl: 'https://images.unsplash.com/photo-1587302912306-cf1ed9c33146?w=400&q=80', category: 'Pet', platformPrices: [
    { platform: 'BigBasket', price: 485, originalPrice: 565, deliveryTime: '22 mins' }, { platform: 'Blinkit', price: 492, originalPrice: 568, deliveryTime: '10 mins' }, { platform: 'Instamart', price: 478, originalPrice: 560, deliveryTime: '16 mins' }, { platform: 'Jiomart', price: 482, originalPrice: 562, deliveryTime: '34 mins' }, { platform: 'Zepto', price: 488, originalPrice: 564, deliveryTime: '12 mins' },
  ]}
];

export const CATEGORIES = ['All', 'Dairy', 'Vegetables', 'Snacks', 'Beverages', 'Fruits', 'Household', 'Personal Care', 'Baby', 'Pet', 'Frozen', 'Meat'];
