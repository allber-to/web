import { writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { fixtureResponse, invoice } from './fixtures';

test('immediate real Continue click retains the price in the saved invoice', async ({
  page,
  context,
}, info) => {
  const origin = 'http://127.0.0.1:4178';
  const blocked: string[] = [];
  let saved: { line_items: { cost: number }[] } | undefined;
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== origin) {
      blocked.push(req.url());
      return route.abort();
    }
    if (!url.pathname.startsWith('/api/')) return route.continue();
    if (req.method() === 'POST' && url.pathname === '/api/v1/invoices') {
      saved = req.postDataJSON();
      return route.fulfill({ json: { data: { ...invoice, ...saved } } });
    }
    const response =
      req.method() === 'GET' &&
      ['/api/v1/tasks', '/api/v1/expenses'].includes(url.pathname)
        ? fixtureResponse('GET', new URL('/api/v1/products', origin))
        : fixtureResponse(req.method(), url);
    if (response === undefined) blocked.push(`${req.method()} ${url.pathname}`);
    return route.fulfill({
      status: response === undefined ? 501 : 200,
      json: response ?? {},
    });
  });
  await page.goto(
    '/tests/local/number-wizard.html?route=' +
      encodeURIComponent('/invoices/guided?client=local-client')
  );
  const price = page.locator('[id^="iw-price-"]').first();
  await expect(price).toBeVisible();
  await page
    .locator('[id^="iw-desc-"]')
    .first()
    .fill('Numeric blur regression');
  await price.evaluate((input) => {
    input.addEventListener('input', () =>
      input.setAttribute('data-input-at', String(performance.now()))
    );
    input.addEventListener('blur', () =>
      document.body.setAttribute(
        'data-price-blur-ms',
        String(performance.now() - Number(input.getAttribute('data-input-at')))
      )
    );
  });
  await price.fill('10');
  await expect(price).toBeFocused();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(price).toHaveCount(0);
  const blurDelay = Number(
    await page.locator('body').getAttribute('data-price-blur-ms')
  );
  expect(blurDelay).toBeGreaterThan(0);
  expect(blurDelay).toBeLessThan(500);
  await expect(
    page.getByRole('heading', { name: 'Payment Terms', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('[data-testid="local-surface"]')).toHaveAttribute(
    'data-path',
    '/invoices/guided/notes'
  );
  await expect(
    page.getByRole('heading', { name: 'Terms', exact: true })
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Review and Send', exact: true })
    .click();
  await expect(page.locator('[data-testid="local-surface"]')).toHaveAttribute(
    'data-path',
    '/invoices/guided/send'
  );
  await page.getByRole('button', { name: 'Save Draft', exact: true }).click();
  await expect.poll(() => saved?.line_items[0]?.cost).toBe(10);
  expect(blocked).toEqual([]);
  const evidence = info.outputPath('numeric-blur.json');
  await writeFile(
    evidence,
    JSON.stringify({ blurDelay, cost: saved?.line_items[0]?.cost, blocked })
  );
  await info.attach('numeric-blur.json', {
    path: evidence,
    contentType: 'application/json',
  });
});
