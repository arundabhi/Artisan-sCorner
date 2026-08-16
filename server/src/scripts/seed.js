import '../config/env.js';
import mongoose from 'mongoose';
import { User } from '../models/user.model.js';
import { Store } from '../models/store.model.js';
import { Product } from '../models/product.model.js';
import { Review } from '../models/review.model.js';
import { PlatformSetting } from '../models/platformSetting.model.js';
import { Cart } from '../models/cart.model.js';
import { Wishlist } from '../models/wishlist.model.js';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/artisans_corner');
    console.log('MongoDB connection established.');

    // Clear existing data
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Review.deleteMany({});
    await PlatformSetting.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    console.log('Collections cleared.');

    // Initialize System Settings
    console.log('Seeding marketplace settings...');
    await PlatformSetting.create({
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: 5,
    });

    // Create Users
    console.log('Seeding default users...');
    const admin = await User.create({
      name: 'Grace (Admin)',
      email: 'admin@artisanscorner.com',
      password: 'password123',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    });

    const vendor = await User.create({
      name: 'Arthur Miller (Artisan)',
      email: 'vendor@artisanscorner.com',
      password: 'password123',
      role: 'VENDOR',
      isActive: true,
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    });

    const buyer = await User.create({
      name: 'John Doe',
      email: 'buyer@artisanscorner.com',
      password: 'password123',
      role: 'BUYER',
      isActive: true,
      isEmailVerified: true,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    });

    // Create Carts & Wishlists
    await Cart.create({ user: admin._id, items: [], subtotal: 0 });
    await Cart.create({ user: vendor._id, items: [], subtotal: 0 });
    await Cart.create({ user: buyer._id, items: [], subtotal: 0 });

    await Wishlist.create({ user: admin._id, products: [] });
    await Wishlist.create({ user: vendor._id, products: [] });
    await Wishlist.create({ user: buyer._id, products: [] });

    // Create Store for Vendor
    console.log('Seeding store profile...');
    const store = await Store.create({
      owner: vendor._id,
      name: "Arthur's Woodshop",
      slug: 'arthurs-woodshop',
      description: 'Handcrafted items created from sustainably sourced local timber. Each piece tells a unique organic story.',
      phone: '1-800-555-WOOD',
      logo: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=400',
      address: {
        street: '101 Timberlane Trail',
        city: 'Portland',
        state: 'Oregon',
        postalCode: '97201',
        country: 'United States',
      },
      isApproved: true, // Pre-approved for convenience
      status: 'active',
    });

    // Seed 15 Products
    console.log('Seeding 15 products across categories...');
    const productsData = [
      {
        name: 'Hand-Carved Walnut Salad Bowl',
        description: 'Large salad bowl made from solid walnut. Finished with food-safe organic beeswax. Handwash only.',
        category: 'Kitchenware',
        price: 85.0,
        compareAtPrice: 95.0,
        stock: 5,
        sku: 'WW-SALAD-01',
        images: [{ url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600', publicId: 'p1' }],
        isFeatured: true,
      },
      {
        name: 'Rustic Maple Serving Board',
        description: 'Live edge serving board carved out of heavy maple wood. Perfect for cheeses, meats, and charcuterie.',
        category: 'Kitchenware',
        price: 60.0,
        compareAtPrice: 0,
        stock: 12,
        sku: 'WW-BOARD-02',
        images: [{ url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=600', publicId: 'p2' }],
        isFeatured: true,
      },
      {
        name: 'Minimalist Oak Spoon Set',
        description: 'Three-piece handcrafted oak wood spoon set. Crafted with ergonomics in mind and mineral oil coating.',
        category: 'Kitchenware',
        price: 28.0,
        compareAtPrice: 35.0,
        stock: 20,
        sku: 'WW-SPOONS-03',
        images: [{ url: 'https://images.unsplash.com/photo-1594751464207-6f81df6f8812?w=600', publicId: 'p3' }],
        isFeatured: false,
      },
      {
        name: 'Ceramic Speckled Coffee Mug',
        description: 'Thrown on the potter\'s wheel, this mug features a rustic clay bottom and beautiful speckled cream glaze.',
        category: 'Ceramics',
        price: 24.0,
        compareAtPrice: 0,
        stock: 15,
        sku: 'CR-MUG-04',
        images: [{ url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600', publicId: 'p4' }],
        isFeatured: true,
      },
      {
        name: 'Slab Ceramic Vase',
        description: 'Earthy ceramic flower vase with a textured matte finish. Elevates any dining table or mantel shelf.',
        category: 'Ceramics',
        price: 48.0,
        compareAtPrice: 55.0,
        stock: 8,
        sku: 'CR-VASE-05',
        images: [{ url: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600', publicId: 'p5' }],
        isFeatured: false,
      },
      {
        name: 'Linen Throw Pillow Cover',
        description: 'Pure, coarse woven linen pillow cover dyed with natural organic indigo dye. 18x18 inches.',
        category: 'Home Decor',
        price: 35.0,
        compareAtPrice: 42.0,
        stock: 10,
        sku: 'HD-PILLOW-06',
        images: [{ url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600', publicId: 'p6' }],
        isFeatured: true,
      },
      {
        name: 'Hand-Woven Wool Rug',
        description: 'Textured flatweave rug woven from unprocessed sheep wool. Ideal for placing next to a bed or fireside.',
        category: 'Home Decor',
        price: 180.0,
        compareAtPrice: 210.0,
        stock: 3,
        sku: 'HD-RUG-07',
        images: [{ url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600', publicId: 'p7' }],
        isFeatured: true,
      },
      {
        name: 'Full-Grain Leather Wallet',
        description: 'Minimalist card wallet hand-stitched from Horween leather. Fits up to 8 cards and folded cash bills.',
        category: 'Leather Goods',
        price: 45.0,
        compareAtPrice: 0,
        stock: 25,
        sku: 'LG-WALLET-08',
        images: [{ url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', publicId: 'p8' }],
        isFeatured: true,
      },
      {
        name: 'Leather Messenger Bag',
        description: 'Robust satchel crafted from vegetable-tanned leather. Fits 15-inch laptops and features brass hardware.',
        category: 'Leather Goods',
        price: 220.0,
        compareAtPrice: 250.0,
        stock: 4,
        sku: 'LG-BAG-09',
        images: [{ url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600', publicId: 'p9' }],
        isFeatured: false,
      },
      {
        name: 'Soy Wax Sandalwood Candle',
        description: 'Hand-poured natural soy wax candle in an amber glass jar. Subtle sandalwood scent with wooden wick.',
        category: 'Home Decor',
        price: 18.0,
        compareAtPrice: 22.0,
        stock: 30,
        sku: 'HD-CANDLE-10',
        images: [{ url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600', publicId: 'p10' }],
        isFeatured: false,
      },
      {
        name: 'Bronze Hanging Plant Hanger',
        description: 'Forged bronze plant hanger designed to attach securely to wall frames. Sleek art-deco structural curves.',
        category: 'Home Decor',
        price: 52.0,
        compareAtPrice: 0,
        stock: 7,
        sku: 'HD-HANGER-11',
        images: [{ url: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600', publicId: 'p11' }],
        isFeatured: false,
      },
      {
        name: 'Handcrafted Soap Collection',
        description: 'Pack of 4 organic soap bars infused with lavender, oatmeal, charcoal, and tea tree essential oils.',
        category: 'Wellness',
        price: 26.0,
        compareAtPrice: 30.0,
        stock: 40,
        sku: 'WL-SOAP-12',
        images: [{ url: 'https://images.unsplash.com/photo-1607006342411-9a90557430f8?w=600', publicId: 'p12' }],
        isFeatured: false,
      },
      {
        name: 'Earthy Clay Tea Set',
        description: 'Traditional style tea set including one teapot and 4 small cups, glazed with dark celadon crackle.',
        category: 'Ceramics',
        price: 90.0,
        compareAtPrice: 110.0,
        stock: 6,
        sku: 'CR-TEA-13',
        images: [{ url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600', publicId: 'p13' }],
        isFeatured: false,
      },
      {
        name: 'Embossed Leather Journal',
        description: 'Leather bound blank journal. Filled with 200 pages of thick acid-free unlined recycled cotton paper.',
        category: 'Leather Goods',
        price: 32.0,
        compareAtPrice: 0,
        stock: 18,
        sku: 'LG-JOURNAL-14',
        images: [{ url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600', publicId: 'p14' }],
        isFeatured: false,
      },
      {
        name: 'Cherry Wood Desk Organizer',
        description: 'Sleek storage compartment block with divisions for pens, phone, and small items, carved from cherry wood.',
        category: 'Kitchenware', // or Home Office, let's categorize to Kitchenware for simplicity
        price: 45.0,
        compareAtPrice: 50.0,
        stock: 12,
        sku: 'WW-DESK-15',
        images: [{ url: 'https://images.unsplash.com/photo-1591123120675-6f7f1aae0e55?w=600', publicId: 'p15' }],
        isFeatured: false,
      },
    ];

    const seededProducts = [];
    for (const p of productsData) {
      const product = await Product.create({
        ...p,
        images: p.images,
        vendor: vendor._id,
        store: store._id,
      });
      seededProducts.push(product);
    }
    console.log(`Seeded ${seededProducts.length} products.`);

    // Seed Sample Reviews (We need to simulate an order or just bypass validation hooks by directly creating)
    console.log('Seeding mock purchase reviews...');
    // Create a mock order to links verified purchase review
    const orderNum = `AC-SEED-MOCK`;
    
    // We bypass order check just by providing valid user, product, order schema fields
    const fakeOrderId = new mongoose.Types.ObjectId();
    
    const reviewsData = [
      {
        product: seededProducts[0]._id, // Salad bowl
        user: buyer._id,
        order: fakeOrderId,
        rating: 5,
        comment: 'Absolutely stunning bowl! The walnut grain is gorgeous and the beeswax smell is beautiful. Worth every penny.',
        isVerifiedPurchase: true,
      },
      {
        product: seededProducts[0]._id,
        user: admin._id, // admin acts as another user buying
        order: fakeOrderId,
        rating: 4,
        comment: 'Beautiful craftmanship. Slightly smaller than expected but fits nicely on our kitchen table.',
        isVerifiedPurchase: true,
      },
      {
        product: seededProducts[3]._id, // Speckled Mug
        user: buyer._id,
        order: fakeOrderId,
        rating: 5,
        comment: 'My absolute favorite morning coffee mug now. Feels rustic and warm to hold.',
        isVerifiedPurchase: true,
      },
      {
        product: seededProducts[7]._id, // Wallet
        user: buyer._id,
        order: fakeOrderId,
        rating: 5,
        comment: 'Very slim, high-grade leather, and beautiful stitching. Fits all my cards perfectly.',
        isVerifiedPurchase: true,
      },
    ];

    for (const r of reviewsData) {
      await Review.create(r);
    }
    console.log('Reviews seeded. Product average ratings recalculated automatically.');

    console.log('Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedData();
