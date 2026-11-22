'use client';

import { useState } from 'react';
import Link from 'next/link';
import { imagePath } from '../lib/examples';

const priceLabel = total => 'Rs. ' + total.toLocaleString('en-PK');

export default function ExampleBasket({ products }) {
  const [basket, setBasket] = useState({});
  const quantity = Object.values(basket).reduce((sum, count) => sum + count, 0);
  const total = products.reduce((sum, [, price], index) => sum + (basket[index] || 0) * price, 0);

  return (
    <div className="demo-shop">
      <ul className="demo-product-grid">
        {products.map(([product, price, photo], index) => (
          <li key={product}>
            <img src={imagePath(photo)} alt="" loading="lazy" width="640" height="480" />
            <div className="demo-product-info">
              <h3>{product}</h3><p>{priceLabel(price)}</p>
              <button type="button" className="demo-add" aria-label={'Add ' + product + ' to demo basket'}
                onClick={() => setBasket(current => ({ ...current, [index]: (current[index] || 0) + 1 }))}>
                Add to basket {basket[index] > 0 && <span>({basket[index]})</span>}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <aside className="demo-bag" aria-label="Demo basket">
        <h3>Your demo basket</h3>
        <p role="status">{quantity === 0 ? 'Demo basket is empty' : quantity + (quantity === 1 ? ' item' : ' items') + ' · ' + priceLabel(total)}</p>
        {quantity > 0 && <button type="button" className="example-basket-clear" onClick={() => setBasket({})}>Clear basket</button>}
        <p>Practice shopping here. No orders or payments are submitted.</p>
        <Link href="/register">Build your own store →</Link>
      </aside>
    </div>
  );
}
