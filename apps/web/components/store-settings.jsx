'use client';

import { useState } from 'react';
import { storefrontThemes } from '@storecraft/shared';
import { saveSettings } from '../lib/actions';
import { ActionForm, Submit } from './forms';

export default function StoreSettings({ store, config }) {
  const recommended = store.category === 'Fashion & accessories' ? 'boutique'
    : store.category === 'Food & drink' ? 'market' : 'classic';
  const [theme, setTheme] = useState({
    primary: config?.primaryColor || '#254438',
    secondary: config?.secondaryColor || '#f5f1e8',
    template: config?.templateId || recommended,
    description: config?.seoDescription || '',
  });
  const change = event => setTheme({ ...theme, [event.target.name]: event.target.value });
  return (
    <div className="settings-grid">
      <ActionForm action={saveSettings} className="form-stack">
        <div className="fields">
          <label>Template<select name="template" value={theme.template} onChange={change}>{Object.entries(storefrontThemes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label>Language<select name="language" defaultValue={config?.defaultLanguage || 'en'}><option value="en">English</option><option value="ur">Urdu</option><option value="ar">Arabic</option></select></label>
          <label>Currency<select name={config ? undefined : 'currency'} defaultValue={config?.defaultCurrency || 'PKR'} disabled={Boolean(config)}>
            {['PKR', 'USD', 'GBP', 'EUR', 'AED', 'SAR'].map(code => <option key={code}>{code}</option>)}
          </select></label>
          {config && <input type="hidden" name="currency" value={config.defaultCurrency} />}
          <label>Brand color<input type="color" name="primary" value={theme.primary} onChange={change} /></label>
          <label>Background<input type="color" name="secondary" value={theme.secondary} onChange={change} /></label>
        </div>
        <label>Store description<textarea name="description" maxLength={200} value={theme.description} onChange={change} /></label>
        <label>Cover image URL<input name="hero" type="url" defaultValue={config?.heroImages?.[0]} placeholder="https://" /></label>
        <fieldset>
          <legend>Fulfillment</legend>
          <label className="check"><input type="checkbox" name="delivery" defaultChecked={config?.deliveryEnabled ?? true} />Offer delivery</label>
          <label>Delivery fee<input type="number" name="deliveryFee" min="0" step=".01" defaultValue={config?.deliveryFee ?? 0} required /></label>
          <label className="check"><input type="checkbox" name="pickup" defaultChecked={config?.pickupEnabled ?? false} />Offer pickup</label>
          <label>Pickup address<input name="pickupAddress" maxLength={240} defaultValue={config?.pickupAddress} /></label>
        </fieldset>
        <Submit>{config ? 'Save settings' : 'Complete setup'}</Submit>
      </ActionForm>
      <aside aria-label="Live store preview" className={'theme-preview ' + theme.template} style={{ background: theme.secondary }}>
        <p className="eyebrow">Live preview</p>
        <h3 style={{ color: theme.primary }}>{store.name}</h3>
        {theme.description && <p>{theme.description}</p>}
      </aside>
    </div>
  );
}
