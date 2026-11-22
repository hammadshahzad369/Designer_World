import { signIn } from '../lib/actions';
import { ActionForm, Submit } from './forms';

export default function AuthForm({ portal }) {
  return (
    <ActionForm action={signIn.bind(null, portal)} className="form-stack">
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
      <Submit>Sign in</Submit>
    </ActionForm>
  );
}
