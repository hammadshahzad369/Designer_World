'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isStoreSlug } from '@storecraft/shared';
import { api, session, sessionNames } from './api';
import { productImage } from './media';

const unavailable = { error: 'The service is temporarily unavailable. Try again.' };
const field = (form, name) => String(form.get(name) ?? '');
const idPattern = /^[a-f0-9]{24}$/;
const referencePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

async function login(portal, email, password) {
  const response = await api('/auth/login', { method: 'POST', body: { portal, email, password } });
  if (!response.ok) return { error: response.error };
  (await cookies()).set(sessionNames[portal], response.accessToken, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: response.expiresIn,
  });
  return {};
}

export async function signIn(portal, _previous, form) {
  if (!Object.hasOwn(sessionNames, portal)) return { error: 'Invalid portal.' };
  let result;
  try {
    result = await login(portal, field(form, 'email'), field(form, 'password'));
  } catch {
    return unavailable;
  }
  if (result.error) return result;
  redirect('/' + portal);
}

export async function signUp(_previous, form) {
  const email = field(form, 'email');
  const password = field(form, 'password');
  const category = field(form, 'category');
  try {
    const response = await api('/auth/register', { method: 'POST', body: {
      businessName: field(form, 'name'), subDomain: field(form, 'slug'), email, password,
      ...(category && { category }),
      domainPreference: field(form, 'domainPreference') || 'hosted',
    } });
    if (!response.ok) return { error: response.error };
    const result = await login('dashboard', email, password);
    if (result.error) return { error: 'Account created. Sign in using the dashboard.' };
  } catch {
    return unavailable;
  }
  redirect('/dashboard');
}

export async function signOut(portal) {
  if (!Object.hasOwn(sessionNames, portal)) return;
  (await cookies()).delete(sessionNames[portal]);
  redirect('/' + portal);
}

async function update(portal, path, method, body, message) {
  try {
    const token = await session(portal);
    if (!token) return { error: 'Sign in to continue.' };
    const response = await api(path, { token, method, body });
    if (!response.ok) return { error: response.error };
    revalidatePath('/' + portal);
    return { message };
  } catch {
    return unavailable;
  }
}

export async function saveSettings(_previous, form) {
  const hero = field(form, 'hero');
  return update('dashboard', '/merchant/settings', 'PUT', {
    templateId: field(form, 'template'),
    primaryColor: field(form, 'primary'),
    secondaryColor: field(form, 'secondary'),
    defaultLanguage: field(form, 'language'),
    defaultCurrency: field(form, 'currency'),
    seoDescription: field(form, 'description'),
    heroImages: hero ? [hero] : [],
    deliveryEnabled: form.has('delivery'),
    pickupEnabled: form.has('pickup'),
    pickupAddress: field(form, 'pickupAddress'),
    deliveryFee: Number(field(form, 'deliveryFee')),
  }, 'Store settings saved.');
}

export async function saveProduct(id, _previous, form) {
  if (id && !idPattern.test(id)) return { error: 'Invalid product.' };
  let image;
  try {
    image = await productImage(form);
  } catch {
    return { error: 'Image upload failed. Try again.' };
  }
  if (image.error) return image;
  return update('dashboard', '/merchant/products' + (id ? '/' + id : ''), id ? 'PUT' : 'POST', {
    name: field(form, 'name'),
    description: field(form, 'description'),
    basePrice: Number(field(form, 'price')),
    stock: Number(field(form, 'stock')),
    ...(id && { expectedStock: Number(field(form, 'expectedStock')) }),
    images: image.url ? [image.url] : [],
  }, 'Product saved.');
}

export async function setVisibility(id, active) {
  if (!idPattern.test(id) || typeof active !== 'boolean') return { error: 'Invalid product.' };
  return update('dashboard', '/merchant/products/' + id + '/visibility', 'PATCH', { isActive: active },
    active ? 'Product listed.' : 'Product archived.');
}

export async function setOrderStatus(id, _previous, form) {
  if (!idPattern.test(id)) return { error: 'Invalid order.' };
  return update('dashboard', '/merchant/orders/' + id + '/status', 'PATCH', {
    status: field(form, 'status'),
  }, 'Order status saved.');
}

export async function approve(id) {
  if (!idPattern.test(id)) return { error: 'Invalid business.' };
  return update('super-admin', '/admin/businesses/' + id + '/approve', 'PATCH', undefined, 'Store published.');
}

export async function checkout(slug, _previous, form) {
  if (!isStoreSlug(slug)) return { error: 'Store not found.' };
  try {
    const deliveryType = field(form, 'deliveryType');
    const items = [...form.entries()].filter(([name, value]) => name.startsWith('qty-') && Number(value) > 0)
      .map(([name, value]) => ({ productId: name.slice(4), quantity: Number(value) }));
    const response = await api('/store/' + slug + '/cart/checkout', { method: 'POST', body: {
      checkoutId: field(form, 'checkoutId'),
      items, name: field(form, 'name'), phone: field(form, 'phone'), deliveryType,
      ...(deliveryType === 'delivery' && { address: { line1: field(form, 'address'), city: field(form, 'city') } }),
    } });
    return response.ok ? { order: response.order } : { error: response.error };
  } catch {
    return unavailable;
  }
}

export async function track(slug, _previous, form) {
  const reference = field(form, 'reference').trim().toLowerCase();
  if (!isStoreSlug(slug) || !referencePattern.test(reference)) return { error: 'Enter a valid order reference.' };
  try {
    const response = await api('/store/' + slug + '/orders/' + reference + '/track');
    return response.ok ? { order: response.order } : { error: response.error };
  } catch {
    return unavailable;
  }
}
