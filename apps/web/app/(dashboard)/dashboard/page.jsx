import Link from 'next/link';
import AuthForm from '../../../components/auth-form';
import StoreSettings from '../../../components/store-settings';
import { ActionForm, Submit } from '../../../components/forms';
import { saveProduct, setOrderStatus, setVisibility, signOut } from '../../../lib/actions';
import { api, session } from '../../../lib/api';

export const metadata = { title: 'Business dashboard' };

function ProductForm({ product, uploadEnabled }) {
  const id = product?._id;
  return (
    <ActionForm action={saveProduct.bind(null, id)} className="form-stack">
      {product && <input type="hidden" name="expectedStock" value={product.stock} />}
      <label>Product name<input name="name" defaultValue={product?.name.en} maxLength={120} required /></label>
      <label>Description<textarea name="description" defaultValue={product?.description?.en} maxLength={1500} /></label>
      <div className="fields">
        <label>Price<input type="number" name="price" step=".01" min="0" defaultValue={product?.basePrice} required /></label>
        <label>Stock<input type="number" name="stock" min="0" step="1" defaultValue={product?.stock ?? 0} required /></label>
      </div>
      <label>Product image URL<input type="url" name="image" defaultValue={product?.images?.[0]} placeholder="https://" /></label>
      {uploadEnabled && <label>Upload an image (up to 700 KB)<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp" /></label>}
      <Submit>{product ? 'Save product' : 'Add product'}</Submit>
    </ActionForm>
  );
}

function Orders({ orders }) {
  const nextStatus = order => ({
    pending: 'confirmed', confirmed: 'packed', packed: order.deliveryType === 'pickup' ? 'delivered' : 'shipped',
    shipped: 'delivered',
  })[order.status];

  if (!orders.length) return <p className="muted">No orders yet.</p>;
  return (
    <ul className="records">
      {orders.map(order => (
        <li key={order._id} className="record">
          <div>
            <strong>{order.contact?.name || order.orderNumber}</strong>
            <p>{order.status} · {order.deliveryType} · {order.currency} {order.total?.toFixed(2)}</p>
            {order.contact?.phone && <p>{order.contact.phone}</p>}
            {order.deliveryAddress?.line1 && <p>{order.deliveryAddress.line1}, {order.deliveryAddress.city}</p>}
            <ul>{order.items.map(item => <li key={item._id || item.productId}>{item.quantity} × {item.name}</li>)}</ul>
          </div>
          {nextStatus(order) && (
            <ActionForm action={setOrderStatus.bind(null, order._id)}>
              <input type="hidden" name="status" value={nextStatus(order)} />
              <Submit className="button secondary">Mark {nextStatus(order)}</Submit>
            </ActionForm>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function Dashboard({ searchParams }) {
  const token = await session('dashboard');
  const details = token && await api('/merchant/settings', { token }).catch(() => ({ status: 503 }));
  if (!details?.ok) {
    return (
      <main className="shell auth-shell">
        <Link className="brand" href="/">StoreCraft</Link>
        <div className="panel">
          <h1>Business dashboard</h1>
          {details?.status === 503 && <p role="alert">The API is temporarily unavailable.</p>}
          <AuthForm portal="dashboard" />
          <p>New here? <Link href="/register">Create a store</Link></p>
        </div>
      </main>
    );
  }

  const cursor = (await searchParams).ordersAfter;
  const ordersPath = '/merchant/orders' + (typeof cursor === 'string' ? '?after=' + encodeURIComponent(cursor) : '');
  const [catalog, history] = await Promise.all([
    api('/merchant/products', { token }).catch(() => ({})),
    api(ordersPath, { token }).catch(() => ({})),
  ]);
  const { store, config } = details;
  const uploadEnabled = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

  return (
    <main className="shell">
      <nav className="bar">
        <Link className="brand" href="/">StoreCraft</Link>
        <form action={signOut.bind(null, 'dashboard')}><button className="link-button">Sign out</button></form>
      </nav>
      <header className="portal-heading">
        <p className="eyebrow">Business dashboard</p>
        <h1>{store.name}</h1>
        {store.isApproved ? <Link href={'/store/' + store.slug}>Open storefront →</Link>
          : <p className="muted">Your storefront will go live after platform approval.</p>}
      </header>
      <section className="panel">
        <h2>{config ? 'Store builder' : 'Set up your store'}</h2>
        <StoreSettings key={config?.updatedAt || 'setup'} store={store} config={config} />
      </section>
      {config && <section className="panel">
        <h2>Products</h2>
        <details><summary>Add a product</summary><ProductForm uploadEnabled={uploadEnabled} /></details>
        {catalog.ok ? <ul className="records">
          {catalog.products.map(product => (
            <li key={product._id} className="product-entry">
              <details><summary>{product.name.en} · {product.stock} in stock{product.isActive ? '' : ' · Archived'}</summary>
                <ProductForm key={product.stock + ':' + product.basePrice} product={product} uploadEnabled={uploadEnabled} />
              </details>
              <ActionForm action={setVisibility.bind(null, product._id, !product.isActive)}>
                <Submit className="button secondary">{product.isActive ? 'Archive' : 'List product'}</Submit>
              </ActionForm>
            </li>
          ))}
        </ul> : <p role="alert">Products could not be loaded.</p>}
      </section>}
      <section className="panel">
        <h2>Orders</h2>
        {history.ok ? <>
          <Orders orders={history.orders} />
          <div className="actions">
            {cursor && <Link href="/dashboard">Newest orders</Link>}
            {history.orders.length === 24 && <Link href={'/dashboard?ordersAfter=' + history.orders.at(-1)._id}>Older orders →</Link>}
          </div>
        </> : <p role="alert">Orders could not be loaded.</p>}
      </section>
    </main>
  );
}
