import mongoose from 'mongoose';
import { isStoreSlug } from '@storecraft/shared';

const { Schema } = mongoose;
const ref = (model, required = false) => ({ type: Schema.Types.ObjectId, ref: model, required });
const tenant = { ...ref('Business', true), immutable: true, index: true };
const email = { type: String, required: true, lowercase: true, trim: true };
const passwordHash = { type: String, required: true, select: false };
const translated = { type: Map, of: String };
const money = { type: Number, min: 0 };
const count = { type: Number, min: 0, validate: Number.isInteger };
const currency = { type: String, uppercase: true, match: /^[A-Z]{3}$/ };
const gateways = ['cod', 'stripe', 'paypal', 'jazzcash', 'visa'];
const address = {
  line1: String,
  city: String,
  country: String,
  zip: String,
};

function model(name, collection, fields, indexes = []) {
  const schema = new Schema(fields, { collection, timestamps: true });
  for (const index of indexes) schema.index(index, { unique: true });
  return mongoose.model(name, schema);
}

export const User = model('User', 'users', {
  name: { type: String, required: true },
  email,
  passwordHash,
  role: { type: String, enum: ['super_admin'], default: 'super_admin' },
  lastLogin: Date,
}, [{ email: 1 }]);

// Platform identities live in users. Merchant credentials belong to the business
// account until a separate multi-owner account model is needed.
export const Business = model('Business', 'businesses', {
  businessName: { type: String, required: true },
  email,
  passwordHash,
  phone: String,
  logo: String,
  category: String,
  domainPreference: { type: String, enum: ['hosted', 'custom'], default: 'hosted' },
  subscriptionPlanId: ref('SubscriptionPlan'),
  subscriptionStatus: {
    type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'trial',
  },
  subDomain: { type: String, required: true, validate: isStoreSlug },
  customDomain: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  isApproved: { type: Boolean, default: false },
  catalogRevision: { type: Number, default: 0 },
}, [{ email: 1 }, { subDomain: 1 }]);

export const StoreConfig = model('StoreConfig', 'store_configs', {
  businessId: { ...tenant, index: false },
  templateId: { type: String, default: 'classic' },
  primaryColor: { type: String, default: '#254438', match: /^#[0-9a-f]{6}$/i },
  secondaryColor: { type: String, default: '#f5f1e8', match: /^#[0-9a-f]{6}$/i },
  fontFamily: String,
  heroImages: [String],
  defaultLanguage: { type: String, default: 'en' },
  supportedLanguages: { type: [String], default: ['en'] },
  defaultCurrency: { ...currency, default: 'PKR' },
  supportedCurrencies: { type: [String], default: ['PKR'] },
  taxRate: { type: Number, min: 0, max: 100 },
  taxLabel: String,
  deliveryEnabled: { type: Boolean, default: true },
  pickupEnabled: { type: Boolean, default: false },
  pickupAddress: String,
  deliveryFee: { ...money, default: 0 },
  freeDeliveryThreshold: money,
  paymentMethods: { type: [{ type: String, enum: gateways }], default: ['cod'] },
  seoTitle: String,
  seoDescription: String,
  socialLinks: { facebook: String, instagram: String, twitter: String, whatsapp: String },
}, [{ businessId: 1 }]);

export const Product = model('Product', 'products', {
  businessId: tenant,
  name: { ...translated, required: true },
  description: translated,
  categoryId: ref('Category'),
  images: [String],
  basePrice: { ...money, required: true },
  currency: { ...currency, required: true },
  sku: String,
  stock: { ...count, default: 0 },
  lowStockAlert: count,
  variants: [{ name: String, options: [{ label: String, priceModifier: Number, stock: count }] }],
  tags: [String],
  isActive: { type: Boolean, default: true },
  ratings: { average: { type: Number, min: 0, max: 5 }, count },
});

export const Category = model('Category', 'categories', {
  businessId: tenant,
  name: { ...translated, required: true },
  parentId: ref('Category'),
  image: String,
  sortOrder: Number,
});

export const Order = model('Order', 'orders', {
  businessId: tenant,
  customerId: ref('Customer'),
  orderNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  items: [{
    productId: ref('Product', true),
    name: String,
    quantity: { ...count, min: 1 },
    unitPrice: money,
    variantInfo: String,
  }],
  subtotal: money,
  deliveryFee: money,
  tax: money,
  total: money,
  currency,
  paymentMethod: { type: String, enum: gateways, default: 'cod' },
  paymentStatus: {
    type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending',
  },
  deliveryType: { type: String, enum: ['delivery', 'pickup'] },
  deliveryAddress: address,
  contact: { name: String, phone: String },
  trackingNumber: String,
  notes: String,
}, [{ businessId: 1, orderNumber: 1 }]);

export const Customer = model('Customer', 'customers', {
  businessId: tenant,
  name: String,
  email,
  phone: String,
  passwordHash: { ...passwordHash, required() { return this.authProvider === 'email'; } },
  authProvider: { type: String, enum: ['email', 'google', 'facebook'], default: 'email' },
  addresses: [{ ...address, label: String, isDefault: Boolean }],
  wishlist: [ref('Product')],
  language: String,
  currency,
  isBlacklisted: { type: Boolean, default: false },
}, [{ businessId: 1, email: 1 }]);

export const Payment = model('Payment', 'payments', {
  businessId: tenant,
  orderId: ref('Order', true),
  customerId: ref('Customer'),
  gateway: { type: String, enum: gateways, required: true },
  gatewayTransactionId: String,
  amount: money,
  currency,
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
});

export const Review = model('Review', 'reviews', {
  businessId: tenant,
  productId: ref('Product', true),
  customerId: ref('Customer', true),
  rating: { ...count, min: 1, max: 5, required: true },
  title: String,
  body: String,
  isVerifiedPurchase: { type: Boolean, default: false },
}, [{ businessId: 1, productId: 1, customerId: 1 }]);

export const SubscriptionPlan = model('SubscriptionPlan', 'subscription_plans', {
  name: { type: String, enum: ['Starter', 'Growth', 'Pro', 'Enterprise'], required: true },
  price: money,
  billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  limits: { products: count, staff: count, storage: count, customDomain: Boolean, analytics: String },
  features: [String],
  isActive: { type: Boolean, default: true },
}, [{ name: 1, billingCycle: 1 }]);

export const Coupon = model('Coupon', 'coupons', {
  businessId: tenant,
  code: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'] },
  value: money,
  minOrderAmount: money,
  usageLimit: count,
  usedCount: { ...count, default: 0 },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
}, [{ businessId: 1, code: 1 }]);

export const DeliveryZone = model('DeliveryZone', 'delivery_zones', {
  businessId: tenant,
  zoneName: String,
  countries: [String],
  cities: [String],
  shippingFee: money,
  estimatedDays: String,
  isActive: { type: Boolean, default: true },
});

export const StaffAccount = model('StaffAccount', 'staff_accounts', {
  businessId: tenant,
  name: String,
  email,
  passwordHash,
  role: { type: String, enum: ['manager', 'inventory', 'support'] },
  permissions: [String],
  isActive: { type: Boolean, default: true },
}, [{ businessId: 1, email: 1 }]);

export const Notification = model('Notification', 'notifications', {
  businessId: { ...tenant, required() { return this.recipientType !== 'super_admin'; } },
  recipientId: { type: Schema.Types.ObjectId, required: true },
  recipientType: { type: String, enum: ['super_admin', 'business', 'customer'], required: true },
  type: String,
  message: String,
  isRead: { type: Boolean, default: false },
});
