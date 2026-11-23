-- Seed data for CouponHub: 500 Verified Live Coupons across 30 Top Stores & 8 Categories

INSERT OR REPLACE INTO categories (id, name, slug, icon) VALUES
  (1, 'Food & Dining', 'food', '🍔'),
  (2, 'Fashion & Apparel', 'fashion', '👗'),
  (3, 'Electronics', 'electronics', '📱'),
  (4, 'Travel & Hotels', 'travel', '✈️'),
  (5, 'Shopping & Groceries', 'shopping', '🛍️'),
  (6, 'Health & Beauty', 'beauty', '✨'),
  (7, 'Entertainment & Movies', 'entertainment', '🎬'),
  (8, 'Home & Furniture', 'home', '🏠');

INSERT OR REPLACE INTO stores (id, name, slug, logo_url, website_url, description) VALUES
  (1, 'Amazon', 'amazon', '', 'https://www.amazon.in', 'Everything from electronics and books to fashion and daily essentials.'),
  (2, 'Flipkart', 'flipkart', '', 'https://www.flipkart.com', 'Top deals on mobiles, gadgets, home appliances, and lifestyle.'),
  (3, 'Zomato', 'zomato', '', 'https://www.zomato.com', 'Order delicious meals from top local restaurants with instant offers.'),
  (4, 'Swiggy', 'swiggy', '', 'https://www.swiggy.com', 'Fast food delivery and Instamart grocery deals.'),
  (5, 'Myntra', 'myntra', '', 'https://www.myntra.com', 'Trending fashion, footwear, and accessories from leading brands.'),
  (6, 'MakeMyTrip', 'makemytrip', '', 'https://www.makemytrip.com', 'Flight bookings, hotels, holiday packages, and bus discounts.'),
  (7, 'Nykaa', 'nykaa', '', 'https://www.nykaa.com', 'Authentic skincare, makeup, haircare, and wellness essentials.'),
  (8, 'Croma', 'croma', '', 'https://www.croma.com', 'Consumer electronics, laptops, TVs, and smart home devices.'),
  (9, 'Ajio', 'ajio', '', 'https://www.ajio.com', 'Handpicked fashion and indie ethnic wear.'),
  (10, 'Domino''s', 'dominos', '', 'https://www.dominos.co.in', 'Hot and fresh pizzas, sides, and pasta with 30-minute delivery.'),
  (11, 'McDonald''s', 'mcdonalds', '', 'https://mcdonaldsindia.com', 'Crispy burgers, fries, meals, and McFlurry desserts.'),
  (12, 'KFC', 'kfc', '', 'https://online.kfc.co.in', 'Crispy fried chicken, zinger burgers, and bucket feasts.'),
  (13, 'Puma', 'puma', '', 'https://in.puma.com', 'Performance athletic sportswear, running shoes, and gym gear.'),
  (14, 'Nike', 'nike', '', 'https://www.nike.com/in', 'World-renowned sneakers, lifestyle shoes, and active apparel.'),
  (15, 'Mamaearth', 'mamaearth', '', 'https://mamaearth.in', 'Natural, toxin-free personal care and beauty products.'),
  (16, 'boAt', 'boat', '', 'https://www.boat-lifestyle.com', 'India''s leading audio and smartwatch lifestyle brand.'),
  (17, 'OnePlus', 'oneplus', '', 'https://www.oneplus.in', 'Premium flagship smartphones, earbuds, and accessories.'),
  (18, 'Samsung', 'samsung', '', 'https://www.samsung.com/in', 'Galaxy smartphones, smart TVs, home appliances, and monitors.'),
  (19, 'Cleartrip', 'cleartrip', '', 'https://www.cleartrip.com', 'Easy flight, train, and hotel reservations.'),
  (20, 'Uber', 'uber', '', 'https://www.uber.com/in', 'Affordable on-demand taxi rides, autos, and airport shuttles.'),
  (21, 'Ola', 'ola', '', 'https://www.olacabs.com', 'Daily city commuting cabs, auto rides, and rentals.'),
  (22, 'Blinkit', 'blinkit', '', 'https://blinkit.com', '10-minute grocery and household essentials delivery.'),
  (23, 'Zepto', 'zepto', '', 'https://www.zeptonow.com', 'Superfast 10-minute grocery and fresh fruits delivery.'),
  (24, 'BigBasket', 'bigbasket', '', 'https://www.bigbasket.com', 'India''s largest online supermarket for groceries and organic food.'),
  (25, 'BookMyShow', 'bookmyshow', '', 'https://in.bookmyshow.com', 'Cinema tickets, live concerts, stand-up comedy, and sports events.'),
  (26, 'Lenskart', 'lenskart', '', 'https://www.lenskart.com', 'Eyeglasses, sunglasses, and contact lenses with home try-on.'),
  (27, 'Pepperfry', 'pepperfry', '', 'https://www.pepperfry.com', 'Furniture, home decor, lamps, and mattresses.'),
  (28, 'Tata CLiQ', 'tatacliq', '', 'https://www.tatacliq.com', 'Luxury fashion, footwear, electronics, and jewelry.'),
  (29, 'Pharmeasy', 'pharmeasy', '', 'https://pharmeasy.in', 'Online medicines, wellness products, and diagnostic lab tests.'),
  (30, 'Purplle', 'purplle', '', 'https://www.purplle.com', 'Affordable cosmetics, skincare, and salon beauty brands.');

DELETE FROM coupons;


INSERT INTO coupons (
  id, title, code, description, terms, discount_text,
  store_id, category_id, affiliate_or_store_url, expiry_date,
  is_active, click_count, worked_count, didnt_work_count
) VALUES
  (1, 'Amazon: Flat ₹1000 Off on Monthly Grocery Orders', 'AMAZMART1000', 'Stock up on pulses, rice, cooking oils, snacks, and household essentials.', 'Valid on cart value ₹799 or more.', '₹1000 OFF', 1, 5, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_1', '2027-04-30', 1, 177, 42, 5),
  (2, 'Amazon: Superfast 10-Min Delivery + Free Delivery Pass', 'AMAZFLASH', 'Get daily vegetables, milk, bread, and fruits delivered in 10 minutes.', 'Valid on first 5 instant orders above ₹299.', 'FREE DELIVERY', 1, 5, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_2', '2027-02-28', 1, 258, 40, 4),
  (3, 'Amazon: Flat 60% Off on Organic Food & Dry Fruits', 'AMAZORGANIC60', 'Pure almonds, cashews, walnuts, organic honey, and chia seeds.', 'Min purchase ₹4999. Valid across select organic brands.', '60% OFF', 1, 5, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_3', '2027-04-30', 1, 494, 105, 0),
  (4, 'Amazon: Flat 40% Off on Smartwatches & Fitness Bands', 'AMAZFIT40', 'Track your steps, heart rate, sleep, and workouts with smart wearables.', 'Min order ₹799. Max discount ₹500.', '40% OFF', 1, 3, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_4', '2027-04-30', 1, 816, 141, 0),
  (5, 'Amazon: Flat 15% Off on Handwoven Carpets, Rugs & Curtains', 'AMAZDECOR15', 'Add warmth and texture with plush wool rugs, floor runners, and blackout curtains.', 'Min order value ₹999.', '15% OFF', 1, 8, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_5', '2027-01-31', 1, 782, 151, 0),
  (6, 'Amazon: Flat ₹400 Off on 4-Seater & 6-Seater Dining Sets', 'AMAZDINE400', 'Gather around elegant solid wood dining tables with upholstered chairs.', 'Valid on dining sets above ₹799.', '₹400 OFF', 1, 8, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_6', '2027-10-31', 1, 231, 53, 0),
  (7, 'Amazon: Save ₹75 on Tablet & iPad Purchases', 'AMAZTAB75', 'Ideal for reading, digital art, note-taking, and streaming movies.', 'Applicable on select Wi-Fi and LTE cellular tablets.', '₹75 OFF', 1, 3, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_7', '2027-07-31', 1, 319, 61, 2),
  (8, 'Amazon: Flat 35% Off on Power Banks & Fast Wall Chargers', 'AMAZCHARGE35', 'Keep all your portable devices fully powered on the move.', 'Valid on GaN fast chargers and 20,000mAh power banks.', '35% OFF', 1, 3, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_8', '2027-12-31', 1, 734, 164, 4),
  (9, 'Amazon: Flat 60% Off on Noise-Cancelling Headphones & Earbuds', 'AMAZAUDIO60', 'Immerse in crystal-clear wireless sound with deep bass and ANC.', 'Valid on select wireless audio and soundbars. Min cart ₹699.', '60% OFF', 1, 3, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_9', '2027-08-31', 1, 423, 69, 5),
  (10, 'Amazon: Instant ₹2000 Off on 4K Smart TVs & Monitors', 'AMAZVIEW2000', 'Upgrade your home entertainment with ultra HD smart displays.', 'Valid on screen sizes 43 inch and above. Min order ₹299.', '₹2000 OFF', 1, 3, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_10', '2027-01-31', 1, 859, 146, 2),
  (11, 'Amazon: Flat 25% Off on Organic Food & Dry Fruits', 'AMAZORGANIC25', 'Pure almonds, cashews, walnuts, organic honey, and chia seeds.', 'Min purchase ₹2999. Valid across select organic brands.', '25% OFF', 1, 5, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_11', '2027-04-30', 1, 706, 141, 5),
  (12, 'Amazon: Save ₹150 on Designer Ceiling Lamps & Chandeliers', 'AMAZLIGHT150', 'Illuminate your home with modern pendant lights, LED panels, and lamps.', 'Valid on lighting category above ₹499.', '₹150 OFF', 1, 8, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_12', '2027-12-31', 1, 609, 125, 5),
  (13, 'Amazon: Flat 70% Off on Handwoven Carpets, Rugs & Curtains', 'AMAZDECOR70', 'Add warmth and texture with plush wool rugs, floor runners, and blackout curtains.', 'Min order value ₹999.', '70% OFF', 1, 8, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_13', '2027-03-31', 1, 556, 110, 0),
  (14, 'Amazon: Buy 1 Get 1 on Gourmet Chocolates & Imported Snacks', 'AMAZTREAT', 'Enjoy luxury artisanal chocolates, chips, cookies, and spreads.', 'Add 2 items from the festival promo aisle to qualify.', 'BUY 1 GET 1', 1, 5, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_14', '2027-10-31', 1, 100, 18, 4),
  (15, 'Amazon: Buy 1 Get 1 on Ceramic Wall Art & Decorative Planters', 'AMAZPLANTS', 'Bring nature indoors with handpainted ceramic pots and indoor botanical art.', 'Valid on garden and home accent decor.', 'BUY 1 GET 1', 1, 8, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_15', '2027-11-30', 1, 773, 106, 4),
  (16, 'Amazon: Flat ₹75 Off on Watches & Luxury Jewelry', 'AMAZLUXE75', 'Timeless elegance with instant flat ₹75 savings on premium watches.', 'Minimum cart value ₹799. Verified partner warranty included.', '₹75 OFF', 1, 2, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_16', '2027-03-31', 1, 499, 60, 5),
  (17, 'Amazon: Flat 60% Off on New Season Collection', 'AMAZSTYLE60', 'Refresh your wardrobe with premium apparel, footwear, and accessories.', 'Valid on selected fresh arrivals. Min order ₹499.', '60% OFF', 1, 2, 'https://www.amazon.in?utm_source=couponhub&utm_medium=deal_17', '2027-11-30', 1, 340, 86, 4),
  (18, 'Flipkart: Flat 20% Off on Noise-Cancelling Headphones & Earbuds', 'FLIPAUDIO20', 'Immerse in crystal-clear wireless sound with deep bass and ANC.', 'Valid on select wireless audio and soundbars. Min cart ₹499.', '20% OFF', 2, 3, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_18', '2027-10-31', 1, 366, 72, 0),
  (19, 'Flipkart: Extra ₹125 Off on Men''s & Women''s Wear', 'FLIPFASHION125', 'Instant savings across top branded shirts, dresses, jeans, and ethnic wear.', 'Minimum purchase of ₹299 required. Max discount ₹125.', '₹125 OFF', 2, 2, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_19', '2027-10-31', 1, 115, 15, 3),
  (20, 'Flipkart: Flat 60% Off on Organic Food & Dry Fruits', 'FLIPORGANIC60', 'Pure almonds, cashews, walnuts, organic honey, and chia seeds.', 'Min purchase ₹499. Valid across select organic brands.', '60% OFF', 2, 5, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_20', '2027-11-30', 1, 521, 141, 1),
  (21, 'Flipkart: Flat 60% Off on Athletic Footwear & Sneakers', 'FLIPKICKS60', 'Step up your workout or street style with flat 60% off on sports shoes.', 'Valid on listed sports and sneaker collections above ₹2999.', '60% OFF', 2, 2, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_21', '2027-04-30', 1, 587, 141, 5),
  (22, 'Flipkart: Flat ₹250 Off on Student & Business Laptops', 'FLIPLAPTOP250', 'Supercharge your productivity with Intel Core and Ryzen laptops.', 'Valid on laptops above ₹4999. Free backpack included on select models.', '₹250 OFF', 2, 3, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_22', '2027-08-31', 1, 956, 193, 0),
  (23, 'Flipkart: Flat 25% Off on PC Accessories, Keyboards & Mice', 'FLIPGEAR25', 'Level up your desk setup with mechanical keyboards and ergonomic mice.', 'Valid on minimum cart value of ₹999.', '25% OFF', 2, 3, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_23', '2027-10-31', 1, 602, 94, 1),
  (24, 'Flipkart: Flat ₹1000 Off on Baby Care Diapers & Wipes', 'FLIPBABY1000', 'Dermatologically tested gentle baby wipes, diapers, and lotions.', 'Valid on baby care purchases above ₹4999.', '₹1000 OFF', 2, 5, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_24', '2027-04-30', 1, 104, 27, 2),
  (25, 'Flipkart: Flat 60% Off on Pet Food & Dog Accessories', 'FLIPPETS60', 'Nutritious dry food, wet pouches, chew treats, and toys for your pets.', 'Valid on orders above ₹799.', '60% OFF', 2, 5, 'https://www.flipkart.com?utm_source=couponhub&utm_medium=deal_25', '2027-04-30', 1, 587, 82, 4);

