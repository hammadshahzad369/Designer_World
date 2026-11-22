import { NextResponse } from 'next/server';
import { storefrontHostname } from '@storecraft/shared';

export function proxy(request) {
  const host = request.headers.get('host')?.toLowerCase().replace(/:\d+$/, '') || '';
  const domain = process.env.STORECRAFT_ROOT_DOMAIN?.toLowerCase();
  const slug = storefrontHostname(host, domain);
  if (!slug) return NextResponse.next();

  if (request.nextUrl.pathname === '/') {
    const target = request.nextUrl.clone();
    target.pathname = '/store/' + slug;
    return NextResponse.rewrite(target);
  }

  // Keep the shared platform routes and other tenant paths off storefront hosts.
  return new NextResponse('Not found', { status: 404 });
}

export const config = { matcher: ['/((?!_next/|favicon.ico).*)'] };
