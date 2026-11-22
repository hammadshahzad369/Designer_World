import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Business, Order, Product, StoreConfig, User } from '../src/models/index.js';

const testUri = process.env.TEST_MONGODB_URI;
const api = request(createApp({ JWT_ACCESS_SECRET: randomUUID() + randomUUID() }));

test('liveness and authentication rejection', async () => {
  await api.get('/health').expect(200, { status: 'ok' });
  await api.get('/api/merchant/products').expect(401);
  await api.get('/api/merchant/products').set('Authorization', 'Bearer invalid').expect(401);
  await api.get('/api/unknown').expect(404);
});

test('two merchants cannot read or update each other’s catalog or orders', { skip: !testUri }, async t => {
  await mongoose.connect(testUri, {
    dbName: 'storecraft_test_' + randomUUID().replaceAll('-', ''),
    serverSelectionTimeoutMS: 5000,
  });
  t.after(async () => {
    try {
      await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  await api.get('/ready').expect(200, { status: 'ready' });

  const password = randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);
  const [alpha, beta] = await Business.create([
    { businessName: 'Alpha Store', email: 'alpha@example.test', passwordHash, subDomain: 'alpha' },
    { businessName: 'Beta Store', email: 'beta@example.test', passwordHash, subDomain: 'beta', isApproved: true },
  ]);
  await StoreConfig.create({ businessId: alpha.id });
  await User.create({ name: 'Platform Admin', email: 'platform@example.test', passwordHash });

  const [alphaProduct, betaProduct] = await Product.create([
    { businessId: alpha.id, name: { en: 'Alpha Product' }, basePrice: 500, currency: 'PKR' },
    { businessId: beta.id, name: { en: 'Beta Product' }, basePrice: 700, currency: 'PKR' },
  ]);
  const [alphaOrder, betaOrder] = await Order.create([
    { businessId: alpha.id, orderNumber: 'A-1', deliveryType: 'delivery' },
    { businessId: beta.id, orderNumber: 'B-1', deliveryType: 'pickup' },
  ]);

  const login = async (email, portal) => {
    const { body } = await api.post('/api/auth/login').send({ email, password, portal }).expect(200);
    return 'Bearer ' + body.accessToken;
  };
  const merchant = await login(alpha.email, 'dashboard');
  const platform = await login('platform@example.test', 'super-admin');

  await api.get('/api/merchant/preview').set('Authorization', merchant).expect(200).expect(res => {
    if (res.body.store.slug !== 'alpha') throw new Error('Expected private Alpha preview');
  });
  await api.get('/api/store/alpha').expect(404);
  await api.patch('/api/admin/businesses/' + alpha.id + '/approve').set('Authorization', merchant).expect(403);
  await api.patch('/api/admin/businesses/' + alpha.id + '/approve').set('Authorization', platform).expect(204);
  await api.get('/api/store/alpha').expect(200);

  await api.get('/api/merchant/products/' + alphaProduct.id).set('Authorization', merchant).expect(200);
  await api.get('/api/merchant/products/' + betaProduct.id)
    .set('Authorization', merchant).set('X-Business-Id', beta.id).expect(404);
  await api.patch('/api/merchant/products/' + betaProduct.id + '/visibility')
    .set('Authorization', merchant).send({ isActive: false }).expect(404);
  await api.get('/api/store/alpha/products/' + betaProduct.id).expect(404);
  await api.get('/api/store/beta/products/' + betaProduct.id).expect(200);
  await api.patch('/api/merchant/products/' + alphaProduct.id + '/visibility')
    .set('Authorization', merchant).send({ isActive: false }).expect(204);
  await api.get('/api/store/alpha/products/' + alphaProduct.id).expect(404);

  await api.get('/api/merchant/orders/' + alphaOrder.id).set('Authorization', merchant).expect(200);
  await api.get('/api/merchant/orders/' + betaOrder.id).set('Authorization', merchant).expect(404);
  await api.patch('/api/merchant/orders/' + betaOrder.id + '/status')
    .set('Authorization', merchant).send({ status: 'confirmed' }).expect(404);
  await api.patch('/api/merchant/orders/' + alphaOrder.id + '/status')
    .set('Authorization', merchant).send({ status: 'delivered' }).expect(409);
  await api.patch('/api/merchant/orders/' + alphaOrder.id + '/status')
    .set('Authorization', merchant).send({ status: 'confirmed' }).expect(204);

  await Business.updateOne({ _id: alpha.id }, { subscriptionStatus: 'suspended' });
  await api.get('/api/store/alpha').expect(404);
  await api.get('/api/merchant/preview').set('Authorization', merchant).expect(403);
});

test('COD checkout rolls back unavailable items and reserves stock once for concurrent retries', { skip: !testUri }, async t => {
  await mongoose.connect(testUri, {
    dbName: 'storecraft_test_' + randomUUID().replaceAll('-', ''),
    serverSelectionTimeoutMS: 5000,
  });
  t.after(async () => {
    try {
      await mongoose.connection.dropDatabase();
    } finally {
      await mongoose.disconnect();
    }
  });
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const password = randomUUID();
  const signup = { businessName: 'Checkout Store', subDomain: 'checkout-shop', email: 'checkout@example.test', password };
  await api.post('/api/auth/register').send(signup).expect(201);
  await api.post('/api/auth/register').send(signup).expect(409);
  const { body: login } = await api.post('/api/auth/login').send({ email: signup.email, password }).expect(200);
  const bearer = 'Bearer ' + login.accessToken;
  await api.put('/api/merchant/settings').set('Authorization', bearer).send({
    templateId: 'classic', primaryColor: '#254438', secondaryColor: '#f5f1e8',
    defaultLanguage: 'en', defaultCurrency: 'PKR', seoDescription: '', heroImages: [],
    deliveryEnabled: true, pickupEnabled: true, deliveryFee: 150, pickupAddress: '22 Test Road',
  }).expect(200);
  const { body: catalog } = await api.post('/api/merchant/products').set('Authorization', bearer)
    .send({ name: 'Family Platter', description: '', basePrice: 1900, stock: 3, images: [] }).expect(201);
  const productId = catalog.product._id;
  const merchant = await Business.findOne({ subDomain: signup.subDomain });
  await Business.updateOne({ _id: merchant.id }, { isApproved: true });
  const path = '/api/store/checkout-shop/cart/checkout';
  const payload = {
    checkoutId: randomUUID(), items: [{ productId, quantity: 2 }],
    name: 'Checkout Customer', phone: '03001234567', deliveryType: 'delivery',
    address: { line1: '22 Test Road', city: 'Lahore' },
  };
  await api.post(path).send({ ...payload, total: 1 }).expect(400);
  await api.post(path).send({
    ...payload, items: [...payload.items, { productId: 'ffffffffffffffffffffffff', quantity: 1 }],
  }).expect(409);
  const retryResults = await Promise.all([
    api.post(path).send(payload).expect(201),
    api.post(path).send(payload).expect(201),
  ]);
  for (const result of retryResults) {
    const { order } = result.body;
    if (order.total !== 3950 || order.orderNumber !== payload.checkoutId || order.contact) {
      throw new Error('Unexpected public order receipt');
    }
  }

  await api.post(path).send({ ...payload, checkoutId: randomUUID() }).expect(409);
  const stockEdit = { name: 'Family Platter', description: '', basePrice: 1900, images: [], stock: 5 };
  await api.put('/api/merchant/products/' + productId).set('Authorization', bearer)
    .send({ ...stockEdit, expectedStock: 3 }).expect(409);
  await api.get('/api/merchant/products/' + productId).set('Authorization', bearer).expect(200).expect(({ body }) => {
    if (body.product.stock !== 1) throw new Error('Unexpected remaining stock');
  });
  await api.get('/api/merchant/orders').set('Authorization', bearer).expect(200).expect(({ body }) => {
    if (body.orders.length !== 1 || body.orders[0].contact.phone !== payload.phone) throw new Error('Unexpected orders');
  });
  await api.get('/api/store/checkout-shop/orders/' + payload.checkoutId + '/track').expect(200).expect(({ body }) => {
    if (body.order.contact || body.order.deliveryAddress) throw new Error('Tracking leaked personal information');
  });
  await api.post(path).send({
    checkoutId: randomUUID(), items: [{ productId, quantity: 1 }], name: payload.name,
    phone: payload.phone, deliveryType: 'pickup',
  }).expect(201).expect(({ body }) => {
    if (body.order.total !== 1900 || body.order.deliveryType !== 'pickup') throw new Error('Pickup charged a delivery fee');
  });
});
