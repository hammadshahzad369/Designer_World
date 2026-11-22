import Link from 'next/link';
import { examples, imagePath } from '../lib/examples';
import './landing.css';

const templates = ['forma-studio', 'daily-grind', 'common-thread'];

export default function Home() {
  return (
    <main className="landing">
      <header className="landing-header">
        <nav className="landing-width landing-nav" aria-label="Main navigation">
          <Link className="landing-brand" href="/"><span aria-hidden="true">S</span> StoreCraft</Link>
          <div className="landing-nav-links">
            <a href="#inspiration">Store examples</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="landing-nav-actions">
            <Link href="/dashboard">Sign in</Link>
            <Link className="landing-button nav-cta" href="/register">Start building <span aria-hidden="true">→</span></Link>
          </div>
        </nav>
      </header>

      <section className="landing-width landing-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="landing-kicker">Your online store starts here</p>
          <h1 id="hero-title">Give your business <em>a storefront.</em></h1>
          <p className="hero-description">Build a shop that feels like your brand. Add products, choose delivery or pickup, and take cash-on-delivery orders from one dashboard.</p>
          <div className="landing-actions">
            <Link href="/register" className="landing-button">Create your store <span aria-hidden="true">→</span></Link>
            <a href="#inspiration" className="landing-text-link">Explore examples <span aria-hidden="true">↓</span></a>
          </div>
        </div>

        <Link href="/examples/root-and-fern" className="hero-preview" aria-label="Explore the Root and Fern example store">
          <div className="preview-window">
            <div className="preview-chrome"><span aria-hidden="true">● ● ●</span><span>Storefront preview</span><span aria-hidden="true">→</span></div>
            <div className="preview-navigation"><strong>Root &amp; Fern</strong><span>Plants &amp; home</span></div>
            <div className="preview-scene">
              <img src={imagePath('plant-studio.jpg')} alt="Glossy green leaves of a rubber plant" fetchPriority="high" width="1200" height="901" />
              <div className="preview-scene-copy"><span>Indoor plants</span><strong>A little<br />greener.</strong></div>
            </div>
          </div>
          <div className="preview-product">
            <img src={imagePath('potted-green.jpg')} alt="" width="520" height="346" />
            <div><strong>Tabletop plant</strong><span>Rs. 1,850</span></div>
          </div>
        </Link>
      </section>

      <section className="landing-inspiration" id="inspiration" aria-labelledby="inspiration-title">
        <div className="landing-width">
          <div className="landing-section-heading">
            <div><p className="landing-kicker">Store inspiration</p><h2 id="inspiration-title">Picture what you could sell.</h2></div>
            <p>Explore sample storefronts for different businesses.</p>
          </div>
          <div className="inspiration-grid">
            {templates.map(slug => {
              const store = examples[slug];
              return (
                <Link key={slug} className="inspiration-card" href={'/examples/' + slug}>
                  <img src={imagePath(store.image)} alt={store.alt} loading="lazy" width="840" height="560" />
                  <div className="inspiration-card-info">
                    <div><span>{store.category}</span><h3>{store.name}</h3></div>
                    <span className="inspiration-arrow" aria-hidden="true">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-width landing-workflow" id="how-it-works" aria-labelledby="workflow-title">
        <div className="landing-section-heading"><h2 id="workflow-title">From setup to your first order.</h2></div>
        <ol>
          <li><h3>Make it yours</h3><p>Pick a layout and set your brand colors, cover image, and store address.</p></li>
          <li><h3>Stock your shelves</h3><p>Add photos, prices, and stock. Set delivery fees or offer pickup.</p></li>
          <li><h3>Open for orders</h3><p>Once approved, share your store link and manage orders from your dashboard.</p></li>
        </ol>
        <Link href="/register" className="landing-button">Create your store <span aria-hidden="true">→</span></Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-width"><Link className="landing-brand" href="/"><span aria-hidden="true">S</span> StoreCraft</Link><Link href="/super-admin">Platform administration</Link></div>
      </footer>
    </main>
  );
}
