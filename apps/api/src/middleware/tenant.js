import { isStoreSlug } from '@storecraft/shared';
import { Business } from '../models/index.js';

export async function ownerTenant(req, res, next) {
  const business = await Business.findOne({
    _id: req.auth.businessId,
    subscriptionStatus: { $in: ['active', 'trial'] },
  }).select('businessName subDomain logo category isApproved domainPreference').lean();

  if (!business) return res.status(403).json({ error: 'Business account unavailable' });
  req.businessId = business._id;
  req.store = {
    name: business.businessName, slug: business.subDomain, logo: business.logo, category: business.category,
    isApproved: business.isApproved, domainPreference: business.domainPreference || 'hosted',
  };
  next();
}

export async function publicTenant(req, res, next) {
  const slug = req.params.subdomain;
  const business = isStoreSlug(slug) && await Business.findOne({
    subDomain: slug,
    isApproved: true,
    subscriptionStatus: { $in: ['active', 'trial'] },
  }).select('businessName subDomain logo category').lean();

  if (!business) return res.status(404).json({ error: 'Store not found' });
  req.businessId = business._id;
  req.store = { name: business.businessName, slug: business.subDomain, logo: business.logo, category: business.category };
  next();
}
