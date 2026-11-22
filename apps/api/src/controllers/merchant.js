import bcrypt from 'bcryptjs';
import mongoose, { isObjectIdOrHexString } from 'mongoose';
import { z } from 'zod';
import { businessCategories, isStoreSlug, storefrontThemes } from '@storecraft/shared';
import { Business, Order, Product, StoreConfig } from '../models/index.js';

const shortText = z.string().trim().min(1).max(120);
const secureUrl = z.url({ protocol: /^https$/ }).max(1000);
const currencies = ['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR'];
const languages = ['en', 'ur', 'ar'];
const price = z.number().min(0).max(1000000)
  .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001);

const registration = z.strictObject({
  businessName: shortText,
  category: z.enum(businessCategories).optional(),
  domainPreference: z.enum(['hosted', 'custom']).default('hosted'),
  subDomain: z.string().refine(isStoreSlug),
  email: z.email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(12).refine(value => Buffer.byteLength(value) <= 72),
});

export async function register(req, res) {
  const input = registration.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Enter a valid email, store name, slug, and password of at least 12 characters.' });
  const { password, ...profile } = input.data;
  try {
    const business = await Business.create({ ...profile, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ slug: business.subDomain });
  } catch (error) {
    if (error.code !== 11000) throw error;
    res.status(409).json({ error: 'This email or store address is already in use.' });
  }
}

export async function merchantStore(req, res) {
  const config = await StoreConfig.findOne({ businessId: req.businessId }).lean();
  res.json({ store: req.store, config });
}

const storeSettings = z.strictObject({
  templateId: z.enum(Object.keys(storefrontThemes)),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  defaultLanguage: z.enum(languages),
  defaultCurrency: z.enum(currencies),
  seoDescription: z.string().trim().max(200),
  heroImages: z.array(secureUrl).max(1),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().trim().max(240),
  deliveryFee: price,
}).refine(store => (store.deliveryEnabled || store.pickupEnabled) && (!store.pickupEnabled || store.pickupAddress));

export async function saveStore(req, res) {
  const input = storeSettings.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Check the store settings and configure at least one fulfillment option.' });
  const businessId = req.businessId;
  const existing = await StoreConfig.findOne({ businessId }).select('defaultCurrency').lean();
  if (existing && existing.defaultCurrency !== input.data.defaultCurrency) {
    return res.status(409).json({ error: 'The checkout currency is fixed after initial setup.' });
  }
  try {
    const config = await StoreConfig.findOneAndUpdate({
      businessId,
      defaultCurrency: input.data.defaultCurrency,
    }, {
      $set: { ...input.data, supportedCurrencies: [input.data.defaultCurrency], supportedLanguages: [input.data.defaultLanguage] },
      $setOnInsert: { businessId },
    }, { upsert: true, new: true, runValidators: true });
    res.json({ config });
  } catch (error) {
    if (error.code !== 11000) throw error;
    res.status(409).json({ error: 'Store settings changed. Reload before saving again.' });
  }
}

const productInput = z.strictObject({
  name: shortText,
  description: z.string().trim().max(1500),
  basePrice: price,
  stock: z.number().int().min(0).max(1000000),
  images: z.array(secureUrl).max(1),
  expectedStock: z.number().int().min(0).optional(),
});

export async function saveProduct(req, res) {
  const id = req.params.id;
  if (id && !isObjectIdOrHexString(id)) return res.status(404).json({ error: 'Product not found.' });
  const input = productInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Enter a valid name, stock, and price with up to two decimal places.' });
  const businessId = req.businessId;
  const config = await StoreConfig.findOne({ businessId }).select('defaultCurrency').lean();
  if (!config) return res.status(409).json({ error: 'Complete store setup before adding products.' });
  const { name, description, expectedStock, ...details } = input.data;
  const changes = { ...details, name: { en: name }, description: { en: description }, currency: config.defaultCurrency };
  if (id) {
    if (expectedStock === undefined) return res.status(400).json({ error: 'Include the last loaded stock count.' });
    const filter = { _id: id, businessId };
    const product = await Product.findOneAndUpdate({ ...filter, stock: expectedStock }, { $set: changes }, {
      new: true, runValidators: true,
    }).lean();
    if (!product) {
      if (!await Product.exists(filter)) return res.status(404).json({ error: 'Product not found.' });
      return res.status(409).json({ error: 'Stock changed since this form loaded. Reload and try again.' });
    }
    return res.json({ product });
  }

  // Writes to the tenant record serialize concurrent product creation against the plan limit.
  const product = await mongoose.connection.transaction(async session => {
    const account = await Business.findOneAndUpdate({
      _id: businessId, subscriptionStatus: { $in: ['trial', 'active'] },
    }, { $inc: { catalogRevision: 1 } }, { session });
    if (!account) return null;
    if (await Product.countDocuments({ businessId }).session(session) >= 20) return null;
    const [created] = await Product.create([{ ...changes, businessId }], { session });
    return created;
  });
  if (!product) return res.status(409).json({ error: 'The Starter catalog limit is 20 products, or the account is inactive.' });
  res.status(201).json({ product });
}

export async function listOrders(req, res) {
  const after = req.query.after;
  if (after !== undefined && !isObjectIdOrHexString(after)) {
    return res.status(400).json({ error: 'Invalid cursor' });
  }
  const filter = { businessId: req.businessId };
  if (after) filter._id = { $lt: after };
  res.json({ orders: await Order.find(filter).sort({ _id: -1 }).limit(24).lean() });
}

export async function listBusinesses(req, res) {
  const after = req.query.after;
  if (after !== undefined && !isObjectIdOrHexString(after)) {
    return res.status(400).json({ error: 'Invalid cursor' });
  }
  const filter = after ? { _id: { $lt: after } } : {};
  const businesses = await Business.find(filter).select('businessName subDomain isApproved subscriptionStatus email')
    .sort({ _id: -1 }).limit(24).lean();
  res.set('Cache-Control', 'private, no-store').json({ businesses });
}
