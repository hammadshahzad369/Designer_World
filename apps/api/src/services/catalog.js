import { Product, StoreConfig } from '../models/index.js';

export function getConfig(businessId) {
  return StoreConfig.findOne({ businessId })
    .select('templateId primaryColor secondaryColor defaultLanguage defaultCurrency seoTitle seoDescription heroImages deliveryEnabled pickupEnabled pickupAddress deliveryFee')
    .lean();
}

export function listProducts(businessId, { publicOnly = false, after } = {}) {
  const filter = { businessId };
  if (publicOnly) filter.isActive = true;
  if (after) filter._id = { $lt: after };
  return Product.find(filter)
    .select('name description images basePrice currency stock isActive')
    .sort({ _id: -1 }).limit(24).lean();
}

export function getProduct(businessId, productId, { publicOnly = false } = {}) {
  const filter = { _id: productId, businessId };
  if (publicOnly) filter.isActive = true;
  return Product.findOne(filter)
    .select('name description images basePrice currency stock isActive')
    .lean();
}

export async function updateProductVisibility(businessId, productId, isActive) {
  const result = await Product.updateOne({ _id: productId, businessId }, { $set: { isActive } });
  return result.matchedCount === 1;
}
