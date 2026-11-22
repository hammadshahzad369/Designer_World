import Link from 'next/link';
import AuthForm from '../../../components/auth-form';
import { ActionForm, Submit } from '../../../components/forms';
import { approve, signOut } from '../../../lib/actions';
import { api, session } from '../../../lib/api';

export const metadata = { title: 'Platform administration' };

export default async function SuperAdmin({ searchParams }) {
  const token = await session('super-admin');
  const cursor = (await searchParams).after;
  const path = '/admin/businesses' + (typeof cursor === 'string' ? '?after=' + encodeURIComponent(cursor) : '');
  const list = token && await api(path, { token }).catch(() => ({ status: 503 }));
  return (
    <main className={'shell' + (list?.ok ? '' : ' auth-shell')}>
      <nav className="bar">
        <Link className="brand" href="/">StoreCraft</Link>
        {list?.ok && <form action={signOut.bind(null, 'super-admin')}><button className="link-button">Sign out</button></form>}
      </nav>
      <div className="panel">
        <h1>Platform administration</h1>
        {list?.ok ? <>
          <h2>Businesses</h2>
          {!list.businesses.length && <p className="muted">No businesses to review.</p>}
          <ul className="records">
            {list.businesses.map(business => (
              <li key={business._id} className="record">
                <div><strong>{business.businessName}</strong><p>{business.subDomain} · {business.email}</p></div>
                {business.isApproved ? <Link href={'/store/' + business.subDomain}>View storefront</Link> : (
                  <ActionForm action={approve.bind(null, business._id)}>
                    <Submit className="button secondary">Approve store</Submit>
                  </ActionForm>
                )}
              </li>
            ))}
          </ul>
          <div className="actions">
            {cursor && <Link href="/super-admin">Newest businesses</Link>}
            {list.businesses.length === 24 && <Link href={'/super-admin?after=' + list.businesses.at(-1)._id}>Older businesses →</Link>}
          </div>
        </> : <>
          {list?.status === 503 && <p role="alert">The API is temporarily unavailable.</p>}
          <AuthForm portal="super-admin" />
        </>}
      </div>
    </main>
  );
}
