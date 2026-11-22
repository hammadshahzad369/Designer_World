'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

export function Submit({ children, className = 'button' }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? 'Working…' : children}</button>;
}

export function Feedback({ state }) {
  if (state?.error) return <p className="feedback error" role="alert">{state.error}</p>;
  if (state?.message) return <p className="feedback" role="status">{state.message}</p>;
  return null;
}

export function ActionForm({ action, children, className }) {
  const [state, submit] = useActionState(action, null);
  return <form action={submit} className={className}>{children}<Feedback state={state} /></form>;
}
