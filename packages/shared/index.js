export const roles = Object.freeze({
  platform: 'super_admin',
  owner: 'business_admin',
  staff: 'staff',
  customer: 'customer',
});

const reserved = new Set(['www', 'api', 'admin', 'dashboard', 'super-admin', 'store', 'cname', 'mail']);

export function isStoreSlug(value) {
  return typeof value === 'string' && value.length <= 63 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !reserved.has(value);
}

export function storefrontHostname(hostname, rootDomain) {
  if (!rootDomain || !hostname.endsWith('.' + rootDomain)) return null;
  const slug = hostname.slice(0, -(rootDomain.length + 1));
  return isStoreSlug(slug) ? slug : null;
}

export const businessCategories = Object.freeze([
  'Fashion & accessories', 'Food & drink', 'Home & living', 'Beauty & wellness', 'Electronics', 'Other',
]);

export const storefrontThemes = Object.freeze({
  classic: 'Classic',
  market: 'Market',
  boutique: 'Boutique',
});
