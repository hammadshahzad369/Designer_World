import Link from 'next/link';
import { notFound } from 'next/navigation';
import { examples, imagePath } from '../../../lib/examples';
import ExampleBasket from '../../../components/example-basket';
import '../../landing.css';

export function generateStaticParams() {
  return Object.keys(examples).map(slug => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: Object.hasOwn(examples, slug) ? examples[slug].name + ' storefront example' : 'Store example' };
}

export default async function ExampleStore({ params }) {
  const { slug } = await params;
  if (!Object.hasOwn(examples, slug)) notFound();
  const store = examples[slug];

  return (
    <main className="landing example-page">
      <header className="landing-header">
        <nav className="landing-width landing-nav" aria-label="Example navigation">
          <Link href="/#inspiration">← All examples</Link>
          <Link href="/register" className="landing-button">Create your store <span aria-hidden="true">→</span></Link>
        </nav>
      </header>
      <div className="landing-width example-content">
        <p className="landing-kicker">Storefront example</p>
        <article className="example-store" style={{ '--example-ink': store.accent, '--example-tint': store.background }}>
          <div className="example-masthead"><strong>{store.name}</strong><span>{store.category}</span></div>
          <div className="example-hero">
            <div><h1>{store.title}</h1><p>{store.description}</p></div>
            <img src={imagePath(store.image)} alt={store.alt} width="840" height="560" />
          </div>
          <section className="example-feature">
            <h2>Featured collection</h2>
            <div>
              {store.productImage && <img src={imagePath(store.productImage)} alt={store.product} width="520" height="346" />}
              <ExampleBasket product={store.product} price={store.price} />
            </div>
          </section>
        </article>
      </div>
    </main>
  );
}
