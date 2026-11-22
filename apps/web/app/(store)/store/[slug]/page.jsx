import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { isStoreSlug, storefrontThemes } from '@storecraft/shared';
import Cart from '../../../../components/cart';
import { api } from '../../../../lib/api';
import '../../../retail.css';

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
  const theme = Object.hasOwn(storefrontThemes, config?.templateId) ? config.templateId : 'classic';

  return (
    <main className={'retail ' + theme}
      lang={language} dir={['ar', 'ur'].includes(language) ? 'rtl' : 'ltr'}
      style={{ '--store-accent': config?.primaryColor, '--store-background': config?.secondaryColor }}>
      <div className="retail-service">
        {config?.deliveryEnabled && config?.pickupEnabled ? 'Delivery & pickup available'
          : config?.pickupEnabled ? 'Order online and collect in store'
            : config?.deliveryEnabled ? 'Cash on delivery' : 'Online catalog'}
      </div>
      <header className="retail-nav">
        <div className="retail-width">
          <a className="retail-brand" href="#store-home">{store.name}</a>
          <nav aria-label="Store navigation"><a href="#catalog-title">Shop</a><a href="#order-tracking">Track order</a></nav>
        </div>
      </header>
      <div className="retail-width" id="store-home">
        <section className={'retail-hero' + (config?.heroImages?.[0] ? ' retail-hero-image' : '')}>
          <div>
            {store.category && <p className="retail-category">{store.category}</p>}
            <h1>{store.name}</h1>
            {config?.seoDescription && <p className="retail-description">{config.seoDescription}</p>}
            <a className="retail-cta" href="#catalog-title">Shop the collection →</a>
          </div>
          {config?.heroImages?.[0] && <img src={config.heroImages[0]} alt="" referrerPolicy="no-referrer" />}
        </section>
        <Cart products={catalog.products} config={config} slug={slug} checkoutId={randomUUID()} />
        <footer className="retail-footer"><strong>{store.name}</strong><span>Powered by StoreCraft</span></footer>
      </div>
    </main>
  );
}
