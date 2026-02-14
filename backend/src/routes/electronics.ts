import { Router, type Request, type Response } from 'express';

const router = Router();

/* ------------------------------------------------------------------ */
/*  Types – normalized shape that the frontend expects                 */
/* ------------------------------------------------------------------ */

interface RetailerOffer {
  retailer: 'Amazon' | 'Flipkart';
  price: number;
  originalPrice: number;
  productUrl: string;
  affiliateUrl?: string;
  inStock: boolean;
  discount: number;
  offers: string[];
}

interface ElectronicsProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  description?: string;
  retailerOffers: RetailerOffer[];
}

/* ------------------------------------------------------------------ */
/*  Stub data — replace with real Flipkart Affiliate + Amazon PA-API  */
/* ------------------------------------------------------------------ */

const STUB_PRODUCTS: ElectronicsProduct[] = [
  {
    id: 'e1',
    name: 'Apple iPhone 15 (128 GB) – Blue',
    brand: 'Apple',
    category: 'Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 57999, originalPrice: 69900, productUrl: 'https://www.amazon.in/s?k=Apple+iPhone+15+128GB+Blue',            inStock: true,  discount: 17, offers: ['No-cost EMI'] },
      { retailer: 'Flipkart', price: 56499, originalPrice: 69900, productUrl: 'https://www.flipkart.com/search?q=Apple+iPhone+15+128GB+Blue',     inStock: true,  discount: 19, offers: ['Bank offer ₹1000 off'] },
    ],
  },
  {
    id: 'e2',
    name: 'Samsung Galaxy S24 Ultra 5G (256 GB) – Titanium Gray',
    brand: 'Samsung',
    category: 'Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 124999, originalPrice: 139999, productUrl: 'https://www.amazon.in/s?k=Samsung+Galaxy+S24+Ultra',          inStock: true,  discount: 11, offers: [] },
      { retailer: 'Flipkart', price: 123999, originalPrice: 139999, productUrl: 'https://www.flipkart.com/search?q=Samsung+Galaxy+S24+Ultra',   inStock: true,  discount: 11, offers: ['Exchange up to ₹12,000'] },
    ],
  },
  {
    id: 'e3',
    name: 'OnePlus 12 5G (256 GB) – Flowy Emerald',
    brand: 'OnePlus',
    category: 'Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 59999, originalPrice: 69999, productUrl: 'https://www.amazon.in/s?k=OnePlus+12+5G+256GB',           inStock: true,  discount: 14, offers: [] },
      { retailer: 'Flipkart', price: 57999, originalPrice: 69999, productUrl: 'https://www.flipkart.com/search?q=OnePlus+12+5G+256GB',    inStock: true,  discount: 17, offers: [] },
    ],
  },
  {
    id: 'e4',
    name: 'Google Pixel 8a (128 GB) – Bay',
    brand: 'Google',
    category: 'Smartphones',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 42999, originalPrice: 52999, productUrl: 'https://www.amazon.in/s?k=Google+Pixel+8a+128GB',           inStock: true,  discount: 19, offers: [] },
      { retailer: 'Flipkart', price: 41999, originalPrice: 52999, productUrl: 'https://www.flipkart.com/search?q=Google+Pixel+8a+128GB',    inStock: true,  discount: 21, offers: [] },
    ],
  },
  {
    id: 'e5',
    name: 'Apple MacBook Air M3 Chip (8 GB/256 GB) – Midnight',
    brand: 'Apple',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 99990, originalPrice: 114900, productUrl: 'https://www.amazon.in/s?k=Apple+MacBook+Air+M3',           inStock: true,  discount: 13, offers: ['No-cost EMI'] },
      { retailer: 'Flipkart', price: 98990, originalPrice: 114900, productUrl: 'https://www.flipkart.com/search?q=Apple+MacBook+Air+M3',    inStock: true,  discount: 14, offers: [] },
    ],
  },
  {
    id: 'e6',
    name: 'Dell XPS 13 (Intel Core Ultra 7, 16 GB, 512 GB SSD)',
    brand: 'Dell',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 139990, originalPrice: 159990, productUrl: 'https://www.amazon.in/s?k=Dell+XPS+13',              inStock: true,  discount: 13, offers: [] },
      { retailer: 'Flipkart', price: 142990, originalPrice: 159990, productUrl: 'https://www.flipkart.com/search?q=Dell+XPS+13',       inStock: true,  discount: 11, offers: [] },
    ],
  },
  {
    id: 'e7',
    name: 'HP Pavilion 15 (Ryzen 7, 16 GB, 512 GB SSD)',
    brand: 'HP',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 64990, originalPrice: 78999, productUrl: 'https://www.amazon.in/s?k=HP+Pavilion+15+Ryzen+7',         inStock: true,  discount: 18, offers: [] },
      { retailer: 'Flipkart', price: 63490, originalPrice: 78999, productUrl: 'https://www.flipkart.com/search?q=HP+Pavilion+15+Ryzen+7',  inStock: true,  discount: 20, offers: ['Bank offer ₹2000 off'] },
    ],
  },
  {
    id: 'e8',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    brand: 'Sony',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 24990, originalPrice: 34990, productUrl: 'https://www.amazon.in/s?k=Sony+WH-1000XM5',               inStock: true,  discount: 29, offers: [] },
      { retailer: 'Flipkart', price: 25490, originalPrice: 34990, productUrl: 'https://www.flipkart.com/search?q=Sony+WH-1000XM5',        inStock: true,  discount: 27, offers: [] },
    ],
  },
  {
    id: 'e9',
    name: 'Apple AirPods Pro (2nd Gen) with USB-C',
    brand: 'Apple',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 20990, originalPrice: 24900, productUrl: 'https://www.amazon.in/s?k=Apple+AirPods+Pro+2',           inStock: true,  discount: 16, offers: [] },
      { retailer: 'Flipkart', price: 21490, originalPrice: 24900, productUrl: 'https://www.flipkart.com/search?q=Apple+AirPods+Pro+2',    inStock: true,  discount: 14, offers: [] },
    ],
  },
  {
    id: 'e10',
    name: 'JBL Flip 6 Portable Bluetooth Speaker',
    brand: 'JBL',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 8999, originalPrice: 12999, productUrl: 'https://www.amazon.in/s?k=JBL+Flip+6',                   inStock: true,  discount: 31, offers: [] },
      { retailer: 'Flipkart', price: 9499, originalPrice: 12999, productUrl: 'https://www.flipkart.com/search?q=JBL+Flip+6',            inStock: true,  discount: 27, offers: [] },
    ],
  },
  {
    id: 'e11',
    name: 'Samsung 55″ Crystal 4K UHD Smart TV (2024)',
    brand: 'Samsung',
    category: 'TVs',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 42990, originalPrice: 54900, productUrl: 'https://www.amazon.in/s?k=Samsung+55+Crystal+4K+TV',           inStock: true,  discount: 22, offers: ['No-cost EMI'] },
      { retailer: 'Flipkart', price: 41990, originalPrice: 54900, productUrl: 'https://www.flipkart.com/search?q=Samsung+55+Crystal+4K+TV',    inStock: true,  discount: 24, offers: [] },
    ],
  },
  {
    id: 'e12',
    name: 'LG 55″ OLED evo C3 4K Smart TV',
    brand: 'LG',
    category: 'TVs',
    imageUrl: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 109990, originalPrice: 149990, productUrl: 'https://www.amazon.in/s?k=LG+55+OLED+C3',           inStock: true,  discount: 27, offers: [] },
      { retailer: 'Flipkart', price: 112990, originalPrice: 149990, productUrl: 'https://www.flipkart.com/search?q=LG+55+OLED+C3',    inStock: false, discount: 25, offers: [] },
    ],
  },
  {
    id: 'e13',
    name: 'Apple Watch Series 9 GPS (45 mm) – Midnight',
    brand: 'Apple',
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 36900, originalPrice: 44900, productUrl: 'https://www.amazon.in/s?k=Apple+Watch+Series+9',         inStock: true,  discount: 18, offers: [] },
      { retailer: 'Flipkart', price: 37490, originalPrice: 44900, productUrl: 'https://www.flipkart.com/search?q=Apple+Watch+Series+9',  inStock: true,  discount: 17, offers: [] },
    ],
  },
  {
    id: 'e14',
    name: 'Samsung Galaxy Watch 6 Classic 47 mm',
    brand: 'Samsung',
    category: 'Wearables',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 24999, originalPrice: 35999, productUrl: 'https://www.amazon.in/s?k=Samsung+Galaxy+Watch+6+Classic',       inStock: true,  discount: 31, offers: [] },
      { retailer: 'Flipkart', price: 23999, originalPrice: 35999, productUrl: 'https://www.flipkart.com/search?q=Samsung+Galaxy+Watch+6+Classic', inStock: true,  discount: 33, offers: [] },
    ],
  },
  {
    id: 'e15',
    name: 'Apple iPad Air M2 (11″, 128 GB) Wi-Fi – Space Grey',
    brand: 'Apple',
    category: 'Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 59900, originalPrice: 69900, productUrl: 'https://www.amazon.in/s?k=Apple+iPad+Air+M2',           inStock: true,  discount: 14, offers: ['No-cost EMI'] },
      { retailer: 'Flipkart', price: 58900, originalPrice: 69900, productUrl: 'https://www.flipkart.com/search?q=Apple+iPad+Air+M2',    inStock: true,  discount: 16, offers: [] },
    ],
  },
  {
    id: 'e16',
    name: 'Samsung Galaxy Tab S9 FE (128 GB) Wi-Fi',
    brand: 'Samsung',
    category: 'Tablets',
    imageUrl: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 33999, originalPrice: 44999, productUrl: 'https://www.amazon.in/s?k=Samsung+Galaxy+Tab+S9+FE',         inStock: true,  discount: 24, offers: [] },
      { retailer: 'Flipkart', price: 34499, originalPrice: 44999, productUrl: 'https://www.flipkart.com/search?q=Samsung+Galaxy+Tab+S9+FE',  inStock: true,  discount: 23, offers: [] },
    ],
  },
  {
    id: 'e17',
    name: 'Sony PS5 Slim Console (1 TB) – Digital Edition',
    brand: 'Sony',
    category: 'Gaming',
    imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 39990, originalPrice: 44990, productUrl: 'https://www.amazon.in/s?k=Sony+PS5+Slim+Digital',           inStock: true,  discount: 11, offers: [] },
      { retailer: 'Flipkart', price: 39490, originalPrice: 44990, productUrl: 'https://www.flipkart.com/search?q=Sony+PS5+Slim+Digital',    inStock: true,  discount: 12, offers: [] },
    ],
  },
  {
    id: 'e18',
    name: 'boAt Airdopes 141 TWS Earbuds – Active Black',
    brand: 'boAt',
    category: 'Audio',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 1099, originalPrice: 4490, productUrl: 'https://www.amazon.in/s?k=boAt+Airdopes+141',          inStock: true,  discount: 76, offers: [] },
      { retailer: 'Flipkart', price: 1099, originalPrice: 4490, productUrl: 'https://www.flipkart.com/search?q=boAt+Airdopes+141',   inStock: true,  discount: 76, offers: [] },
    ],
  },
  {
    id: 'e19',
    name: 'Lenovo IdeaPad Slim 5 (i5-13500H, 16 GB, 512 GB SSD)',
    brand: 'Lenovo',
    category: 'Laptops',
    imageUrl: 'https://images.unsplash.com/photo-1484788984921-03950022c9ef?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 56990, originalPrice: 72990, productUrl: 'https://www.amazon.in/s?k=Lenovo+IdeaPad+Slim+5',         inStock: true,  discount: 22, offers: [] },
      { retailer: 'Flipkart', price: 55990, originalPrice: 72990, productUrl: 'https://www.flipkart.com/search?q=Lenovo+IdeaPad+Slim+5',  inStock: true,  discount: 23, offers: [] },
    ],
  },
  {
    id: 'e20',
    name: 'Sony Bravia 55″ 4K Ultra HD Smart Google TV',
    brand: 'Sony',
    category: 'TVs',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&q=80',
    retailerOffers: [
      { retailer: 'Amazon',   price: 57990, originalPrice: 74900, productUrl: 'https://www.amazon.in/s?k=Sony+Bravia+55+4K',           inStock: true,  discount: 23, offers: ['No-cost EMI'] },
      { retailer: 'Flipkart', price: 59990, originalPrice: 74900, productUrl: 'https://www.flipkart.com/search?q=Sony+Bravia+55+4K',    inStock: false, discount: 20, offers: [] },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  GET /api/electronics/search?q=<query>                              */
/* ------------------------------------------------------------------ */

router.get('/electronics/search', async (req: Request, res: Response): Promise<void> => {
  const query  = (req.query.q as string || '').trim().toLowerCase();
  const cat    = (req.query.category as string || '').trim();
  const sort   = (req.query.sort as string || 'relevance').trim();
  const inStock = req.query.inStockOnly === 'true';

  try {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 300 + Math.random() * 400));

    let results = [...STUB_PRODUCTS];

    // Filter by search query — token-based matching for better discovery
    // e.g. "iphone blue" will match "Apple iPhone 15 (128 GB) – Blue"
    // because both tokens "iphone" and "blue" appear in the searchable text
    if (query) {
      const tokens = query.split(/\s+/).filter(t => t.length >= 2);
      if (tokens.length > 0) {
        results = results.filter(p => {
          const searchable = `${p.name} ${p.brand} ${p.category} ${p.id}`.toLowerCase();
          return tokens.every(token => searchable.includes(token));
        });
      }
    }

    // Filter by category
    if (cat && cat !== 'All') {
      results = results.filter(p => p.category === cat);
    }

    // Filter in-stock only
    if (inStock) {
      results = results.filter(p => p.retailerOffers.some(o => o.inStock));
    }

    // Sort
    const bestPrice = (p: ElectronicsProduct) =>
      Math.min(...p.retailerOffers.filter(o => o.inStock).map(o => o.price), Infinity);
    const bestDiscount = (p: ElectronicsProduct) =>
      Math.max(...p.retailerOffers.map(o => o.discount), 0);

    switch (sort) {
      case 'price-low':    results.sort((a, b) => bestPrice(a) - bestPrice(b));       break;
      case 'price-high':   results.sort((a, b) => bestPrice(b) - bestPrice(a));       break;
      case 'discount':     results.sort((a, b) => bestDiscount(b) - bestDiscount(a)); break;
      default:             break; // relevance = default order
    }

    res.json({
      query: req.query.q || '',
      results,
      meta: { totalResults: results.length, cached: false, fetchedAt: new Date().toISOString() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Electronics] Error: ${msg}`);
    res.status(500).json({ error: 'Electronics search failed', message: msg });
  }
});

/* ------------------------------------------------------------------ */
/*  GET /api/electronics/featured                                      */
/* ------------------------------------------------------------------ */

router.get('/electronics/featured', (_req: Request, res: Response) => {
  const featured = STUB_PRODUCTS.filter(p =>
    ['e1', 'e5', 'e8', 'e11', 'e13', 'e17', 'e3', 'e15'].includes(p.id)
  );
  res.json({ results: featured });
});

export default router;
