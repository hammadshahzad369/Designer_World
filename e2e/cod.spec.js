import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

test('merchant publishes a store after approval and fulfills a COD order', async ({ page, browser, request }) => {
  const id = randomUUID().slice(0, 8);
  const slug = 'merchant-' + id;
  const password = randomUUID();
  const adminContext = await browser.newContext();
  const shopperContext = await browser.newContext();
  try {
    await page.goto('/register');
    await page.getByLabel('Business name').fill('Kabab Ji ' + id);
    await page.getByLabel('Store address').fill(slug);
    await page.getByLabel('Email').fill(slug + '@example.test');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByRole('heading', { name: 'Set up your store' })).toBeVisible();
    await page.getByLabel('Store description').fill('Fresh grill and platters');
    await page.getByLabel('Delivery fee').fill('150');
    await page.getByRole('button', { name: 'Complete setup' }).click();
    await expect(page.getByRole('heading', { name: 'Store builder' })).toBeVisible();
    await expect(page.getByText('Live preview')).toBeVisible();

    await page.getByText('Add a product', { exact: true }).click();
    await page.getByLabel('Product name').fill('Family Platter');
    await page.getByLabel('Price').fill('1900');
    await page.getByLabel('Stock').fill('3');
    await page.getByRole('button', { name: 'Add product' }).click();
    await expect(page.getByText('Family Platter · 3 in stock')).toBeVisible();

    const shopper = await shopperContext.newPage();
    expect((await shopper.goto('/store/' + slug)).status()).toBe(404);
    const admin = await adminContext.newPage();
    await admin.goto('/super-admin');
    await admin.getByLabel('Email').fill(process.env.STORECRAFT_ADMIN_EMAIL);
    await admin.getByLabel('Password').fill(process.env.STORECRAFT_ADMIN_PASSWORD);
    await admin.getByRole('button', { name: 'Sign in' }).click();
    const business = admin.getByRole('listitem').filter({ hasText: slug });
    await business.getByRole('button', { name: 'Approve store' }).click();
    await expect(business.getByRole('link', { name: 'View storefront' })).toBeVisible();

    if (process.env.STORECRAFT_ROOT_DOMAIN) {
      const host = slug + '.' + process.env.STORECRAFT_ROOT_DOMAIN;
      const response = await request.get('/', { headers: { Host: host } });
      expect(response.status()).toBe(200);
      expect(await response.text()).toContain('Family Platter');
      expect((await request.get('/super-admin', { headers: { Host: host } })).status()).toBe(404);
    }
    await shopper.goto('/store/' + slug);
    await expect(shopper.getByRole('heading', { name: 'Family Platter' })).toBeVisible();
    await shopper.getByLabel('Quantity for Family Platter').fill('2');
    await shopper.getByLabel('Full name').fill('Test Customer');
    await shopper.getByLabel('Phone').fill('03001234567');
    await shopper.getByLabel('Street address').fill('22 Test Road');
    await shopper.getByLabel('City').fill('Lahore');
    await shopper.getByRole('button', { name: 'Place cash order' }).click();
    await expect(shopper.getByRole('heading', { name: 'Order placed' })).toBeVisible();
    await expect(shopper.getByText(/3,950.*delivery/)).toBeVisible();
    await expect(shopper.getByText('pending', { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText('Family Platter · 1 in stock')).toBeVisible();
    await expect(page.getByText('Test Customer')).toBeVisible();
    await page.getByRole('button', { name: 'Mark confirmed' }).click();
    await expect(page.getByRole('button', { name: 'Mark packed' })).toBeVisible();
    await shopper.getByRole('button', { name: 'Check status' }).click();
    await expect(shopper.getByText('confirmed', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Mark packed' }).click();
    await page.getByRole('button', { name: 'Mark shipped' }).click();
    await page.getByRole('button', { name: 'Mark delivered' }).click();
    await expect(page.getByText(/delivered · delivery/)).toBeVisible();
    await shopper.getByRole('button', { name: 'Check status' }).click();
    await expect(shopper.getByText('delivered', { exact: true })).toBeVisible();
  } finally {
    await shopperContext.close();
    await adminContext.close();
  }
});
