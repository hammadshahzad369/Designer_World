import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { isObjectIdOrHexString } from 'mongoose';
import { roles } from '@storecraft/shared';
import { order, setOrderStatus } from '../controllers/orders.js';
import { login } from '../controllers/auth.js';
import { product, products, publicStore, setVisibility } from '../controllers/catalog.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { ownerTenant, publicTenant } from '../middleware/tenant.js';
import { register, merchantStore, saveStore, saveProduct, listOrders, listBusinesses } from '../controllers/merchant.js';
import { placeOrder, trackOrder } from '../controllers/checkout.js';
import { Business, StoreConfig } from '../models/index.js';

export function apiRoutes(secret) {
  const api = Router();
  const authenticateRequest = authenticate(secret);

  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Too many login attempts' },
  });
  api.post('/auth/login', authLimit, login(secret));
  api.post('/auth/register', authLimit, register);

  const merchant = Router();
  merchant.use(authenticateRequest, requireRole(roles.owner), ownerTenant, (_req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });
  merchant.get('/settings', merchantStore);
  merchant.put('/settings', saveStore);
  merchant.post('/products', saveProduct);
  merchant.put('/products/:id', saveProduct);
  merchant.get('/orders', listOrders);
  merchant.get('/products', products(false));
  merchant.get('/products/:id', product(false));
  merchant.patch('/products/:id/visibility', setVisibility);
  merchant.get('/orders/:id', order);
  merchant.patch('/orders/:id/status', setOrderStatus);
  merchant.get('/preview', publicStore);

  const admin = Router();
  admin.use(authenticateRequest, requireRole(roles.platform));
  admin.get('/businesses', listBusinesses);
  admin.patch('/businesses/:id/approve', async (req, res) => {
    if (!isObjectIdOrHexString(req.params.id)) return res.status(404).json({ error: 'Business not found' });
    if (!await StoreConfig.exists({ businessId: req.params.id })) {
      return res.status(409).json({ error: 'The business must complete store setup first.' });
    }
    const result = await Business.updateOne({
      _id: req.params.id,
      subscriptionStatus: { $in: ['active', 'trial'] },
    }, { $set: { isApproved: true } });
    if (!result.matchedCount) return res.status(404).json({ error: 'Business not found' });
    res.sendStatus(204);
  });

  const store = Router({ mergeParams: true });
  store.use(publicTenant);
  store.get('/', publicStore);
  store.get('/products', products(true));
  store.get('/products/:id', product(true));
  store.post('/cart/checkout', placeOrder);
  store.get('/orders/:id/track', trackOrder);

  api.use('/admin', admin);
  api.use('/store/:subdomain', store);
  api.use('/merchant', merchant);
  return api;
}
