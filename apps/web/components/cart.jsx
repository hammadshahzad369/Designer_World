'use client';

import { useActionState, useEffect, useState } from 'react';
import { checkout, track } from '../lib/actions';
import { Feedback, Submit } from './forms';

function Tracking({ slug, initialOrder, money }) {
  const [polled, setPolled] = useState(null);
  const [result, lookup] = useActionState(track.bind(null, slug), { order: initialOrder });
  const order = polled?.basedOn === result ? polled.order : result.order;
  const reference = order?.orderNumber;
  const terminal = ['delivered', 'cancelled', 'refunded'].includes(order?.status);

  useEffect(() => {
    if (!reference || terminal) return;
    let stopped = false;
    const timer = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      const form = new FormData();
      form.set('reference', reference);
      try {
        const response = await track(slug, null, form);
        if (!stopped && response.order) setPolled({ basedOn: result, order: response.order });
      } catch {
        // Keep the last known status and retry on the next interval.
      }
    }, 15000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [slug, reference, result, terminal]);

  return (
    <section className="panel tracking" id="order-tracking">
      <h2>{initialOrder ? 'Order placed' : 'Track an order'}</h2>
      {order && <div role="status" className="receipt">
        <strong>{order.status}</strong>
        <p>{money(order.total)} · {order.deliveryType} · Cash on {order.deliveryType === 'pickup' ? 'pickup' : 'delivery'}</p>
        <p>Order reference <code>{order.orderNumber}</code></p>
      </div>}
      <form action={lookup} className="track-form">
        <label>Order reference<input name="reference" required maxLength={36} defaultValue={reference} /></label>
        <Submit className="button secondary">Check status</Submit>
      </form>
      <Feedback state={result} />
    </section>
  );
}

export default function Cart({ products, config, slug, checkoutId }) {
  const [items, setItems] = useState({});
  const [search, setSearch] = useState('');
  const [type, setType] = useState(config?.deliveryEnabled ? 'delivery' : 'pickup');
  const [contact, setContact] = useState({ name: '', phone: '', address: '', city: '' });
  const [result, placeOrder] = useActionState(checkout.bind(null, slug), null);
  const currency = config?.defaultCurrency || 'PKR';
  const language = config?.defaultLanguage || 'en';
  const money = (amount, code = currency) => new Intl.NumberFormat(language, {
    style: 'currency', currency: code,
  }).format(amount);
  const quantity = product => Number(items[product._id] || 0);
  const subtotal = products.reduce((sum, product) => sum + Math.round(product.basePrice * 100) * quantity(product), 0) / 100;
  const totalCount = products.reduce((sum, product) => sum + quantity(product), 0);
  const deliveryFee = type === 'delivery' ? config?.deliveryFee || 0 : 0;
  const updateContact = event => setContact({ ...contact, [event.target.name]: event.target.value });
  const canCheckout = Boolean(config?.deliveryEnabled || config?.pickupEnabled);
  const query = search.trim().toLocaleLowerCase();
  const catalog = products.map(product => ({
    ...product,
    displayName: product.name[language] || product.name.en || Object.values(product.name)[0],
    displayDescription: product.description?.[language] || product.description?.en,
  }));
  const matches = product => (product.displayName + ' ' + (product.displayDescription || '')).toLocaleLowerCase().includes(query);

  return (
    <>
      {!result?.order && <form action={placeOrder} className="shop-layout">
        <input type="hidden" name="checkoutId" value={checkoutId} />
        <section aria-labelledby="catalog-title">
          <div className="retail-catalog-header">
            <div><h2 id="catalog-title">Shop the collection</h2><p>{catalog.filter(matches).length} products</p></div>
            {products.length > 0 && <label className="retail-search">Find a product
              <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search products" />
            </label>}
          </div>
          {!products.length && <p>No products available yet.</p>}
          {query && !catalog.some(matches) && <p>No products match your search.</p>}
          <ul className="catalog">
            {catalog.map(product => (
              <li key={product._id} hidden={!matches(product)}>
                {product.images?.[0]
                  ? <img className="product-image" src={product.images[0]} alt={product.displayName} loading="lazy" referrerPolicy="no-referrer" />
                  : <div className="product-image retail-product-placeholder" aria-hidden="true">{product.displayName.slice(0, 1)}</div>}
                <div className="product-content">
                  <h3>{product.displayName}</h3>
                  {product.displayDescription && <p>{product.displayDescription}</p>}
                  <strong>{money(product.basePrice, product.currency)}</strong>
                  {product.stock > 0 && canCheckout ? (
                    <div className="retail-product-actions">
                      <button type="button" className="retail-add" disabled={quantity(product) >= Math.min(product.stock, 99)}
                        aria-label={'Add ' + product.displayName + ' to bag'}
                        onClick={() => setItems(current => ({
                          ...current, [product._id]: Math.min(Number(current[product._id] || 0) + 1, product.stock, 99),
                        }))}>Add to bag</button>
                      <label>Quantity <span className="sr-only">for {product.displayName}</span>
                        <input name={'qty-' + product._id} type="number" min="0" max={Math.min(product.stock, 99)} step="1"
                          value={items[product._id] ?? '0'} onChange={event => setItems({ ...items, [product._id]: event.target.value })} />
                      </label>
                    </div>
                  ) : product.stock === 0 && <p>Out of stock</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
        {canCheckout && products.some(product => product.stock > 0) && <section className="panel checkout form-stack">
          <h2>Shopping bag</h2>
          <p className="retail-total" aria-live="polite">{totalCount} items · {money(subtotal + (totalCount ? deliveryFee : 0))}</p>
          {totalCount > 0 && <ul className="retail-bag-lines">{catalog.filter(product => quantity(product) > 0)
            .map(product => <li key={product._id}>{quantity(product)} × {product.displayName}</li>)}</ul>}
          <label>Fulfillment<select name="deliveryType" value={type} onChange={event => setType(event.target.value)}>
            {config.deliveryEnabled && <option value="delivery">Delivery ({money(config.deliveryFee || 0)})</option>}
            {config.pickupEnabled && <option value="pickup">Pickup</option>}
          </select></label>
          {type === 'pickup' && <p>{config.pickupAddress}</p>}
          <label>Full name<input name="name" autoComplete="name" value={contact.name} onChange={updateContact} maxLength={180} required /></label>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" value={contact.phone} onChange={updateContact} maxLength={25} required /></label>
          {type === 'delivery' && <>
            <label>Street address<input name="address" autoComplete="address-line1" value={contact.address} onChange={updateContact} maxLength={180} required /></label>
            <label>City<input name="city" autoComplete="address-level2" value={contact.city} onChange={updateContact} maxLength={180} required /></label>
          </>}
          <Submit>Place cash order</Submit>
          <Feedback state={result} />
        </section>}
      </form>}
      <Tracking key={result?.order?.orderNumber} slug={slug} initialOrder={result?.order} money={money} />
    </>
  );
}
