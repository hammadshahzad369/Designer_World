import { signIn, signUp } from '../lib/actions';
import { ActionForm, Submit } from './forms';

export default function AuthForm({ portal, register = false }) {
  return (
    <ActionForm action={register ? signUp : signIn.bind(null, portal)} className="form-stack">
      {register && <>
        <label>Business name<input name="name" autoComplete="organization" maxLength={120} required /></label>
        <label>Store address<input name="slug" placeholder="your-business" autoComplete="off" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={63} required /></label>
      </>}
      <label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 12 : 1} required /></label>
      <Submit>{register ? 'Create account' : 'Sign in'}</Submit>
    </ActionForm>
  );
}
