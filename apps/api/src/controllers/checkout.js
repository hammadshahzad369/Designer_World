import mongoose from 'mongoose';
import { z } from 'zod';
import { Business, Order, Product, StoreConfig } from '../models/index.js';

const text = z.string().trim().min(1).max(180);
const checkout = z.strictObject({
  checkoutId: z.uuid({ version: 'v4' }),
  items: z.array(z.strictObject({
    productId: z.string().regex(/^[a-f0-9]{24}$/),
    quantity: z.number().int().min(1).max(99),
  })).min(1).max(20).refine(items => new Set(items.map(item => item.productId)).size === items.length),
  name: text,
  phone: z.string().trim().regex(/^\+?[\d ()-]{7,25}$/).refine(value => value.replace(/\D/g, '').length >= 7),
  deliveryType: z.enum(['delivery', 'pickup']),
  address: z.strictObject({ line1: text, city: text }).optional(),
}).refine(input => input.deliveryType !== 'delivery' || input.address);

class CheckoutError extends Error {}

function receipt(order) {
  return {
    orderNumber: order.orderNumber, status: order.status, total: order.total,
    currency: order.currency, deliveryType: order.deliveryType,
  };
}

export async function placeOrder(req, res) {
  const input = checkout.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Check your cart, contact information, and delivery address.' });
  const { checkoutId, items, name, phone, deliveryType, address } = input.data;
  const businessId = req.businessId;
  const orderFilter = { businessId, orderNumber: checkoutId };
  try {
    const order = await mongoose.connection.transaction(async session => {
      const previous = await Order.findOne(orderFilter).session(session);
      if (previous) return previous;

      const business = await Business.exists({
        _id: businessId, isApproved: true, subscriptionStatus: { $in: ['trial', 'active'] },
      }).session(session);
      const config = await StoreConfig.findOne({ businessId }).session(session);
      if (!business || !config || !config.paymentMethods.includes('cod') ||
          (deliveryType === 'delivery' ? !config.deliveryEnabled : !config.pickupEnabled)) {
        throw new CheckoutError('This fulfillment option is unavailable.');
      }

      const snapshots = [];
      let subtotal = 0;
      for (const { productId, quantity } of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const product = await Product.findOneAndUpdate({
          _id: productId, businessId, isActive: true, stock: { $gte: quantity }, currency: config.defaultCurrency,
        }, { $inc: { stock: -quantity } }, { session });
        if (!product) throw new CheckoutError('An item is unavailable in the requested quantity.');
        const unitPrice = Math.round(product.basePrice * 100);
        subtotal += unitPrice * quantity;
        snapshots.push({
          productId, name: product.name.get(config.defaultLanguage) || product.name.get('en') || [...product.name.values()][0],
          quantity, unitPrice: unitPrice / 100,
        });
      }
      const deliveryFee = deliveryType === 'delivery' ? Math.round((config.deliveryFee || 0) * 100) : 0;
      const [created] = await Order.create([{
        ...orderFilter, items: snapshots, contact: { name, phone }, deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? address : undefined,
        subtotal: subtotal / 100, deliveryFee: deliveryFee / 100, tax: 0, total: (subtotal + deliveryFee) / 100,
        currency: config.defaultCurrency, paymentMethod: 'cod',
      }], { session });
      return created;
    });
    res.set('Cache-Control', 'no-store').status(201).json({ order: receipt(order) });
  } catch (error) {
    if (error instanceof CheckoutError) return res.status(409).json({ error: error.message });
    if (error.code !== 11000) throw error;
    const existing = await Order.findOne(orderFilter).lean();
    if (!existing) throw error;
    res.set('Cache-Control', 'no-store').status(201).json({ order: receipt(existing) });
  }
}

export async function trackOrder(req, res) {
  if (!z.uuid({ version: 'v4' }).safeParse(req.params.id).success) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const order = await Order.findOne({ businessId: req.businessId, orderNumber: req.params.id }).lean();
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  res.set('Cache-Control', 'no-store').json({ order: receipt(order) });
}
