import { isObjectIdOrHexString } from 'mongoose';
import { z } from 'zod';
import { getConfig, getProduct, listProducts, updateProductVisibility } from '../services/catalog.js';

export async function publicStore(req, res) {
  const config = await getConfig(req.businessId);
  res.json({ store: req.store, config });
}

export function products(publicOnly) {
  return async (req, res) => {
    const after = req.query.after;
    if (after !== undefined && !isObjectIdOrHexString(after)) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    res.json({ products: await listProducts(req.businessId, { publicOnly, after }) });
  };
}

export function product(publicOnly) {
  return async (req, res) => {
    if (!isObjectIdOrHexString(req.params.id)) return res.status(404).json({ error: 'Product not found' });
    const result = await getProduct(req.businessId, req.params.id, { publicOnly });
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result });
  };
}

const visibility = z.strictObject({ isActive: z.boolean() });

export async function setVisibility(req, res) {
  if (!isObjectIdOrHexString(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  const input = visibility.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Expected a boolean isActive field' });
  if (!await updateProductVisibility(req.businessId, req.params.id, input.data.isActive)) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.sendStatus(204);
}
