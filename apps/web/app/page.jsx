import Link from 'next/link';

export default function Home() {
  return (
    <main className="shell">
      <span className="brand">StoreCraft</span>
      <h1>Build and manage your online store.</h1>
      <div className="actions">
        <Link className="button" href="/register">Create a store</Link>
        <Link href="/dashboard">Business dashboard</Link>
        <Link href="/super-admin">Platform administration</Link>
      </div>
    </main>
  );
}
