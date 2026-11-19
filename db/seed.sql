-- Seed data for CouponHub (idempotent via INSERT OR IGNORE)

INSERT OR IGNORE INTO categories (id, name, slug, icon) VALUES
  (1, 'Food & Dining', 'food', '🍔'),
  (2, 'Fashion & Apparel', 'fashion', '👗'),
  (3, 'Electronics', 'electronics', '📱'),
  (4, 'Travel & Hotels', 'travel', '✈️'),
  (5, 'Shopping & Groceries', 'shopping', '🛍️'),
  (6, 'Health & Beauty', 'beauty', '✨');

INSERT OR IGNORE INTO stores (id, name, slug, logo_url, website_url, description) VALUES
  (1, 'Amazon', 'amazon', '', 'https://www.amazon.in', 'Everything from electronics and books to fashion and daily essentials.'),
  (2, 'Flipkart', 'flipkart', '', 'https://www.flipkart.com', 'Top deals on mobiles, gadgets, home appliances, and lifestyle.'),
  (3, 'Zomato', 'zomato', '', 'https://www.zomato.com', 'Order delicious meals from top local restaurants with instant offers.'),
  (4, 'Swiggy', 'swiggy', '', 'https://www.swiggy.com', 'Fast food delivery and Instamart grocery deals.'),
  (5, 'Myntra', 'myntra', '', 'https://www.myntra.com', 'Trending fashion, footwear, and accessories from leading brands.'),
  (6, 'MakeMyTrip', 'makemytrip', '', 'https://www.makemytrip.com', 'Flight bookings, hotels, holiday packages, and bus discounts.'),
  (7, 'Nykaa', 'nykaa', '', 'https://www.nykaa.com', 'Authentic skincare, makeup, haircare, and wellness essentials.'),
  (8, 'Croma', 'croma', '', 'https://www.croma.com', 'Consumer electronics, laptops, TVs, and smart home devices.');

INSERT OR IGNORE INTO coupons (
  id, title, code, description, terms, discount_text,
  store_id, category_id, affiliate_or_store_url, expiry_date,
  is_active, click_count, worked_count, didnt_work_count
) VALUES
  (
    1,
    'Flat 20% Off on Electronics & Accessories',
    'TECH20',
    'Save flat 20% on headphones, keyboards, power banks, and smartwatches.',
    'Valid on minimum cart value of Rs. 999. Maximum discount Rs. 1,500. Applicable once per user.',
    '20% OFF',
    1, 3, 'https://www.amazon.in/electronics', '2027-03-31',
    1, 248, 41, 3
  ),
  (
    2,
    'Flat Rs. 150 Off on Food Orders Above Rs. 399',
    'ZOMATO150',
    'Enjoy instant Rs. 150 discount on select restaurants across India.',
    'Minimum order value Rs. 399. Not valid on combos or cash-on-delivery orders.',
    '₹150 OFF',
    3, 1, 'https://www.zomato.com', '2027-02-28',
    1, 312, 64, 5
  ),
  (
    3,
    'Extra 30% Off on New Season Fashion',
    'STYLE30',
    'Upgrade your wardrobe with extra 30% off on men and women apparel.',
    'Minimum purchase of Rs. 1,499 required. Valid on selected catalog styles only.',
    '30% OFF',
    5, 2, 'https://www.myntra.com', '2027-01-31',
    1, 189, 29, 2
  ),
  (
    4,
    'Up to Rs. 2,500 Off on Domestic Flights',
    'FLYMMT2500',
    'Book domestic round-trip or one-way flights and get instant savings.',
    'Valid on bookings above Rs. 5,000. Convenience fee is non-refundable.',
    'UP TO ₹2500 OFF',
    6, 4, 'https://www.makemytrip.com/flights/', '2027-04-15',
    1, 165, 22, 1
  ),
  (
    5,
    'Flat 15% Off on Smartphones & Laptops',
    'FLIPTECH15',
    'Exclusive festival savings on top-rated smartphones and student laptops.',
    'Valid on prepaid orders only. Max discount Rs. 2,000 per transaction.',
    '15% OFF',
    2, 3, 'https://www.flipkart.com/electronics-store', '2026-12-31',
    1, 276, 52, 4
  ),
  (
    6,
    'Free Delivery + Rs. 125 Off on First 3 Orders',
    'SWIGGY125',
    'Get Rs. 125 off plus zero delivery fee on your next food or Instamart order.',
    'Minimum order Rs. 299. Valid on select partner outlets.',
    '₹125 OFF',
    4, 1, 'https://www.swiggy.com', '2026-11-25',
    1, 205, 38, 2
  ),
  (
    7,
    'Flat Rs. 400 Off on Skincare & Beauty Combos',
    'GLOW400',
    'Save Rs. 400 on bestselling serums, sunscreens, and makeup kits.',
    'Applicable on minimum order of Rs. 1,599. Cannot be clubbed with gift cards.',
    '₹400 OFF',
    7, 6, 'https://www.nykaa.com', '2027-02-14',
    1, 134, 19, 1
  ),
  (
    8,
    'Flat Rs. 1,000 Off on Smart TVs & Audio',
    'CROMA1000',
    'Instant cart discount on 4K Smart TVs, soundbars, and Bluetooth speakers.',
    'Valid online on orders above Rs. 12,000. Standard warranty applies.',
    '₹1000 OFF',
    8, 3, 'https://www.croma.com', '2027-01-15',
    1, 98, 14, 0
  ),
  (
    9,
    'Flat 10% Cashback on Monthly Groceries',
    'FRESH10',
    'Stock up on pantry essentials, snacks, and household supplies for less.',
    'Maximum cashback Rs. 300 credited to wallet within 24 hours of delivery.',
    '10% CASHBACK',
    1, 5, 'https://www.amazon.in/fresh', '2027-03-10',
    1, 144, 26, 2
  ),
  (
    10,
    '25% Off on Luxury & Boutique Hotel Stays',
    'STAY25',
    'Book weekend getaways and business stays at 25% off across 50+ cities.',
    'Valid on prepaid hotel bookings. Blackout dates may apply during peak holidays.',
    '25% OFF',
    6, 4, 'https://www.makemytrip.com/hotels/', '2026-12-20',
    1, 118, 17, 1
  ),
  (
    11,
    'Extra Rs. 300 Off on Sneakers & Athleisure',
    'KICKS300',
    'Save extra Rs. 300 on running shoes, sneakers, and activewear.',
    'Minimum cart value Rs. 1,999. Applicable on listed sports brands.',
    '₹300 OFF',
    5, 2, 'https://www.myntra.com/footwear', '2026-11-23',
    1, 87, 15, 1
  ),
  (
    12,
    'Diwali Mega Flash Sale - 50% Off (Expired Demo)',
    'DIWALI50',
    'Limited-time Diwali mega flash sale across home decor and gifting.',
    'Offer expired. Kept in database to demonstrate automatic expired coupon handling.',
    '50% OFF',
    2, 5, 'https://www.flipkart.com', '2026-10-15',
    1, 410, 88, 12
  ),
  (
    13,
    'Monsoon Weekend Feast - Flat 40% Off (Expired Demo)',
    'RAIN40',
    'Special monsoon weekend offer on pizzas, burgers, and biryanis.',
    'Offer expired on September 30, 2026.',
    '40% OFF',
    3, 1, 'https://www.zomato.com', '2026-09-30',
    1, 195, 44, 9
  );
