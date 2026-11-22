import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { isStoreSlug } from '@storecraft/shared';
import Cart from '../../../../components/cart';
import { api } from '../../../../lib/api';

export default async function StorePage({ params }) {
  const { slug } = await params;
  if (!isStoreSlug(slug)) notFound();
  const [details, catalog] = await Promise.all([
    api('/store/' + slug),
    api('/store/' + slug + '/products'),
  ]);
  if (details.status === 404 || catalog.status === 404) notFound();
  if (!details.ok || !catalog.ok) throw new Error('Storefront API unavailable');
  const { store, config } = details;
  const language = config?.defaultLanguage || 'en';

  return (
    <main className={'shell storefront ' + (config?.templateId === 'market' ? 'market' : 'classic')}
      lang={language} dir={['ar', 'ur'].includes(language) ? 'rtl' : 'ltr'}
      style={{ '--store-accent': config?.primaryColor, '--store-background': config?.secondaryColor }}>
      <header className="store-hero">
        <div><h1>{store.name}</h1>{config?.seoDescription && <p>{config.seoDescription}</p>}</div>
        {config?.heroImages?.[0] && <img src={config.heroImages[0]} alt="" referrerPolicy="no-referrer" />}
      </header>
      <Cart products={catalog.products} config={config} slug={slug} checkoutId={randomUUID()} />
      <footer>Powered by StoreCraft</footer>
    </main>
  );
}
