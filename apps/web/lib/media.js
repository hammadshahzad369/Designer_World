import 'server-only';
import { createHash } from 'node:crypto';
import { api, session } from './api';

export async function productImage(form) {
  const fallback = String(form.get('image') ?? '');
  const file = form.get('imageFile');
  if (!(file instanceof File) || file.size === 0) return { url: fallback };
  if (file.size > 700 * 1024) return { error: 'Choose an image under 700 KB.' };

  const prefix = Buffer.from(await file.slice(0, 12).arrayBuffer());
  const jpeg = prefix.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  const png = prefix.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = prefix.toString('ascii', 0, 4) === 'RIFF' && prefix.toString('ascii', 8, 12) === 'WEBP';
  if (!jpeg && !png && !webp) return { error: 'Choose a JPEG, PNG, or WebP image.' };

  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !/^[a-z0-9_-]+$/i.test(cloud) || !key || !secret) {
    return { error: 'Image uploads are unavailable. You can enter an HTTPS image URL.' };
  }

  const token = await session('dashboard');
  const settings = token && await api('/merchant/settings', { token });
  if (!settings?.ok || !settings.config) return { error: 'Sign in and complete store setup before uploading an image.' };

  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = 'storecraft/' + settings.store.slug;
  const signature = createHash('sha256').update('folder=' + folder + '&timestamp=' + timestamp + secret).digest('hex');
  const payload = new FormData();
  payload.set('file', file);
  payload.set('folder', folder);
  payload.set('timestamp', timestamp);
  payload.set('api_key', key);
  payload.set('signature', signature);
  const response = await fetch('https://api.cloudinary.com/v1_1/' + cloud + '/image/upload', {
    method: 'POST', body: payload, signal: AbortSignal.timeout(12000), cache: 'no-store',
  });
  if (!response.ok) return { error: 'Image upload failed. Check the file and try again.' };
  const { secure_url: url } = await response.json();
  return typeof url === 'string' && url.startsWith('https://')
    ? { url } : { error: 'Cloudinary did not return an HTTPS image URL.' };
}
