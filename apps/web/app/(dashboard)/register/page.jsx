import Link from 'next/link';
import StoreRegistration from '../../../components/store-registration';
import '../../landing.css';

export const metadata = { title: 'Create a store' };

export default function Register() {
  return (
    <main className="landing register-page">
      <header className="landing-header">
        <nav className="landing-width landing-nav" aria-label="Registration navigation">
          <Link className="landing-brand" href="/"><span aria-hidden="true">S</span> StoreCraft</Link>
          <Link href="/dashboard">Sign in</Link>
        </nav>
      </header>
      <div className="landing-width register-grid">
        <div className="register-form">
          <h1>Create your store.</h1>
          <p>Set up your business profile and choose a web address. Then customize your storefront and add products.</p>
          <StoreRegistration />
        </div>
        <aside className="register-preview">
          <img src="/inspiration/plant-studio.jpg" alt="A rubber plant with deep green leaves" width="1200" height="901" />
          <Link href="/examples/root-and-fern">See a storefront example <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </main>
  );
}
