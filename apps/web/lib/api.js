import 'server-only';
import { cookies } from 'next/headers';

export const sessionNames = { dashboard: 'storecraft_merchant', 'super-admin': 'storecraft_platform' };

export async function session(portal) {
  return (await cookies()).get(sessionNames[portal])?.value;
}

export async function api(path, { token, method = 'GET', body } = {}) {
  const origin = process.env.STORECRAFT_API_URL || 'http://127.0.0.1:4000';
  const response = await fetch(new URL('/api' + path, origin), {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: 'Bearer ' + token }),
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  const data = response.status === 204 ? {} : await response.json();
  return { ok: response.ok, status: response.status, ...data };
}
