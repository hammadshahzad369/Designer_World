import { isObjectIdOrHexString } from 'mongoose';
import { z } from 'zod';
import { Order } from '../models/index.js';

const statusInput = z.strictObject({
  status: z.enum(['confirmed', 'packed', 'shipped', 'delivered']),
});

function orderFilter(req) {
  return { _id: req.params.id, businessId: req.businessId };
}

function orderNotFound(res) {
  return res.status(404).json({ error: 'Order not found' });
}

export async function order(req, res) {
  if (!isObjectIdOrHexString(req.params.id)) return orderNotFound(res);
  const result = await Order.findOne(orderFilter(req)).lean();
  if (!result) return orderNotFound(res);
  res.json({ order: result });
}

export async function setOrderStatus(req, res) {
  if (!isObjectIdOrHexString(req.params.id)) return orderNotFound(res);
  const input = statusInput.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Invalid fulfillment status' });
  const { status } = input.data;
  const prior = {
    confirmed: ['pending'],
    packed: ['confirmed'],
    shipped: ['packed'],
    delivered: ['packed', 'shipped'],
  };
  const filter = orderFilter(req);
  const result = await Order.updateOne({
    ...filter,
    status: { $in: [status, ...prior[status]] },
    ...(status === 'shipped' && { deliveryType: 'delivery' }),
    ...(status === 'delivered' && {
      $or: [{ deliveryType: 'pickup', status: { $in: ['packed', 'delivered'] } },
        { deliveryType: 'delivery', status: { $in: ['shipped', 'delivered'] } }],
    }),
  }, { $set: { status } });

  if (result.matchedCount) return res.sendStatus(204);
  if (!await Order.exists(filter)) return orderNotFound(res);
  res.status(409).json({ error: 'Order cannot move to that status' });
}
