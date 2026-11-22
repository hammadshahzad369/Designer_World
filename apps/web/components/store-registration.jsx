'use client';

import { useState } from 'react';
import { businessCategories } from '@storecraft/shared';
import { signUp } from '../lib/actions';
import { ActionForm, Submit } from './forms';

export default function StoreRegistration() {
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('hosted');

  return (
    <ActionForm action={signUp} className="form-stack">
      <fieldset className="registration-group">
        <legend>Business details</legend>
        <label>Business name<input name="name" autoComplete="organization" maxLength={120} required /></label>
        <label>Business category<select name="category" defaultValue="">
          <option value="">Choose a category</option>
          {businessCategories.map(category => <option key={category}>{category}</option>)}
        </select></label>
        <label>Store address<input name="slug" placeholder="your-business" autoComplete="off" pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          value={slug} onChange={event => setSlug(event.target.value.toLowerCase())} maxLength={63} required /></label>
        <p className="registration-note">Hosted link: /store/{slug || 'your-business'}</p>
      </fieldset>

      <fieldset className="registration-group domain-options">
        <legend>Choose a web address</legend>
        <label className="domain-choice"><input type="radio" name="domainPreference" value="hosted" checked={domain === 'hosted'}
          onChange={() => setDomain('hosted')} /><span><strong>Free StoreCraft link</strong><small>Use your hosted link after store approval.</small></span></label>
        <label className="domain-choice"><input type="radio" name="domainPreference" value="custom" checked={domain === 'custom'}
          onChange={() => setDomain('custom')} /><span><strong>Buy a custom domain</strong><small>Search for a name and check pricing at Domain.com.</small></span></label>
        {domain === 'custom' && <div className="registrar-link">
          <a href="https://www.domain.com/domains" target="_blank" rel="noopener noreferrer">Find a domain on Domain.com →</a>
          <p>Purchasing is separate. Your store uses the free link, and custom-domain activation is coming later.</p>
        </div>}
      </fieldset>

      <fieldset className="registration-group">
        <legend>Owner account</legend>
        <label>Email<input name="email" type="email" autoComplete="username" required /></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /></label>
        <p className="registration-note">Use at least 12 characters.</p>
      </fieldset>
      <Submit>Create account</Submit>
    </ActionForm>
  );
}
