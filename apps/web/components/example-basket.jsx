'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ExampleBasket({ product, price }) {
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="example-basket">
      <div>
        <h3>{product}</h3>
        <p>{price}</p>
      </div>
      <button type="button" className="landing-button" onClick={() => setQuantity(quantity + 1)}>
        Add to demo basket
      </button>
      <div className="example-basket-summary">
        <p role="status">{quantity === 0 ? 'Demo basket is empty' : quantity + (quantity === 1 ? ' item' : ' items') + ' in demo basket'}</p>
        {quantity > 0 && <button type="button" className="example-basket-clear" onClick={() => setQuantity(0)}>Clear basket</button>}
      </div>
      <p>Try the shopping flow here, or <Link href="/register">start building your own store</Link>.</p>
    </div>
  );
}
