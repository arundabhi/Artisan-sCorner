import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Store } from '../src/models/store.model.js';
import { Product } from '../src/models/product.model.js';
import { Cart } from '../src/models/cart.model.js';
import { Order } from '../src/models/order.model.js';
import { Review } from '../src/models/review.model.js';
import { PlatformSetting } from '../src/models/platformSetting.model.js';

// Setup environment before testing
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/artisans_corner_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_12345';

describe("Artisan's Corner Backend Integration Tests", () => {
  let buyerTokenCookie = '';
  let vendorTokenCookie = '';
  let vendorId = '';
  let storeId = '';
  let productId = '';
  let orderId = '';

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI);
    }
    
    // Clear test database collections
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await PlatformSetting.deleteMany({});
    await Cart.deleteMany({});
    await Review.deleteMany({});

    // Seed marketplace settings
    await PlatformSetting.create({
      key: 'PLATFORM_COMMISSION_PERCENT',
      value: 5,
    });
  });

  afterAll(async () => {
    // Clean up connections
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  // 1. REGISTER & LOGIN TESTS
  describe('Authentication Flow', () => {
    it('should register a new buyer user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@test.com',
          password: 'password123',
          phone: '1234567890',
        });

      console.log('REGISTER RESPONSE BODY:', res.body);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('jane@test.com');
      expect(res.body.user.role).toBe('BUYER');
      
      // Save buyer token from set-cookie
      const cookies = res.headers['set-cookie'];
      buyerTokenCookie = cookies[0];
    });

    it('should login an existing buyer', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'jane@test.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should block access to protected routes without a token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should access protected profile route with token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', [buyerTokenCookie]);

      console.log('PROFILE RESPONSE:', res.status, res.body);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@test.com');
    });
  });

  // 2. VENDOR ONBOARDING & STORE CREATION
  describe('Vendor Onboarding & Store Creation', () => {
    it('should register a vendor user and submit store application', async () => {
      // 1. Register VENDOR user
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Arthur Miller',
          email: 'arthur@test.com',
          password: 'password123',
          role: 'VENDOR',
        });
      
      vendorTokenCookie = regRes.headers['set-cookie'][0];
      vendorId = regRes.body.user.id;

      // 2. Submit store onboarding application
      const storeRes = await request(app)
        .post('/api/stores')
        .set('Cookie', [vendorTokenCookie])
        .send({
          name: 'Handcrafted Pottery Store',
          description: 'Beautiful hand thrown ceramic pots and mugs.',
          phone: '555-STORE-1',
          address: {
            street: '456 Clay Rd',
            city: 'Clayton',
            state: 'California',
            postalCode: '94517',
            country: 'USA',
          },
        });

      console.log('STORE RESPONSE:', storeRes.status, storeRes.body);
      expect(storeRes.status).toBe(201);
      expect(storeRes.body.success).toBe(true);
      expect(storeRes.body.data.name).toBe('Handcrafted Pottery Store');
      expect(storeRes.body.data.isApproved).toBe(false); // starts as false

      storeId = storeRes.body.data._id;
    });

    it('should block vendor listing products if store is not approved', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [vendorTokenCookie])
        .send({
          name: 'Clay Pot',
          description: 'Standard clay pot',
          category: 'Ceramics',
          price: 15.0,
          stock: 10,
          sku: 'CR-POT-01',
        });

      expect(res.status).toBe(403); // Pending admin approval block
      expect(res.body.success).toBe(false);
    });

    it('should allow product listing after store approval', async () => {
      // Manually approve store in database
      await Store.findByIdAndUpdate(storeId, { isApproved: true });

      const res = await request(app)
        .post('/api/products')
        .set('Cookie', [vendorTokenCookie])
        .attach('images', Buffer.from('fake-image-binary'), 'pot.png')
        .field('name', 'Clay Coffee Mug')
        .field('description', 'Handmade ceramic mug with blue glaze.')
        .field('category', 'Ceramics')
        .field('price', '20')
        .field('stock', '5')
        .field('sku', 'CR-MUG-BLUE');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Clay Coffee Mug');
      
      productId = res.body.data._id;
    });
  });

  // 3. PRODUCT CRUD & OWNERSHIP CHECKS
  describe('Product CRUD & Security Guards', () => {
    it('should block non-owners from editing vendor product', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Cookie', [buyerTokenCookie]) // Buyer tries to edit vendor's product
        .send({
          price: 5.0,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow vendor to edit their own product', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Cookie', [vendorTokenCookie])
        .send({
          price: 18.5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(18.5);
    });
  });

  // 4. CART & CHECKOUT VERIFICATION TESTS
  describe('Cart Sync, Pricing & Checkout Calculations', () => {
    it('should sync local cart with database and verify db pricing', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Cookie', [buyerTokenCookie])
        .send({
          items: [
            {
              product: productId,
              quantity: 2,
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items[0].price).toBe(18.5); // Database price must override client price
      expect(res.body.data.subtotal).toBe(37.0); // 18.5 * 2
    });

    it('should initialize order checkout and check commission splits', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Cookie', [buyerTokenCookie])
        .send({
          shippingAddress: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94111',
            country: 'USA',
            phone: '555-555-5555',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      
      const order = res.body.data.order;
      expect(order.subtotal).toBe(37.0);
      
      // 5% default commission calculations
      // platformFee = 37 * 0.05 = 1.85
      // vendorPayout = 37 - 1.85 = 35.15
      expect(order.platformFee).toBe(1.85);
      expect(order.vendorPayout).toBe(35.15);
      expect(order.paymentStatus).toBe('PENDING');

      orderId = order._id;
    });
  });

  // 5. REVIEW SYSTEM ELIGIBILITY TESTS
  describe('Review Submission Rules', () => {
    it('should block review submission for uncompleted purchases', async () => {
      // Order is created, but paymentStatus is PENDING and orderStatus is PROCESSING
      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', [buyerTokenCookie])
        .send({
          product: productId,
          order: orderId,
          rating: 5,
          comment: 'Fantastic quality mug!',
        });

      expect(res.status).toBe(400); // Fails since order is not marked DELIVERED
      expect(res.body.success).toBe(false);
    });

    it('should allow review submission after order is delivered', async () => {
      // Simulate Stripe Payment webhook callback to mark paid
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'PAID',
        orderStatus: 'DELIVERED',
      });

      // Submit review
      const res = await request(app)
        .post('/api/reviews')
        .set('Cookie', [buyerTokenCookie])
        .send({
          product: productId,
          order: orderId,
          rating: 4,
          comment: 'Fantastic quality blue mug. Thick clay.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isVerifiedPurchase).toBe(true);
    });
  });
});
