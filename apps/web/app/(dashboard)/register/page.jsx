import Link from 'next/link';
import AuthForm from '../../../components/auth-form';

export const metadata = { title: 'Create a store' };

export default function Register() {
  return (
    <main className="shell auth-shell">
      <Link className="brand" href="/">StoreCraft</Link>
      <div className="panel">
        <h1>Create your store</h1>
        <AuthForm register />
        <p>Already registered? <Link href="/dashboard">Sign in</Link></p>
      </div>
    </main>
  );
}
