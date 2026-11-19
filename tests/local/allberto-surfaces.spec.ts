import { test, expect, Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { fixtureResponse } from './fixtures';

const origin = 'http://127.0.0.1:4178';
const apiRequests: { method: string; url: string }[] = [];
const blocked: string[] = [];
const errors: string[] = [];

test.beforeEach(async ({ context, page }) => {
  apiRequests.length = 0;
  blocked.length = 0;
  errors.length = 0;
  await page.clock.setFixedTime(new Date('2026-11-19T12:00:00Z'));
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.origin !== origin) {
      blocked.push(req.url());
      return route.abort('blockedbyclient');
    }
    if (url.pathname.startsWith('/api/')) {
      apiRequests.push({ method: req.method(), url: req.url() });
      const data = fixtureResponse(req.method(), url);
      if (data === undefined) {
        blocked.push(`${req.method()} ${url.pathname}`);
        return route.fulfill({
          status: 501,
          json: { error: 'Unmapped local fixture' },
        });
      }
      return route.fulfill({ json: data });
    }
    await route.continue();
  });
});

test.afterEach(async ({ page }, info) => {
  const auditPath = info.outputPath('network-audit.json');
  await writeFile(
    auditPath,
    JSON.stringify({ apiRequests, blocked, errors }, null, 2)
  );
  await info.attach('network-audit.json', {
    path: auditPath,
    contentType: 'application/json',
  });
  expect(blocked, 'No external or unmapped API requests').toEqual([]);
  expect(errors, 'No uncaught browser errors').toEqual([]);
  await expect(page.getByTestId('render-error')).toHaveCount(0);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
});
async function open(
  page: Page,
  path: string,
  theme: string = 'light',
  lang: string = 'en'
) {
  await page.goto(
    `/tests/local/index.html?route=${encodeURIComponent(path)}&theme=${theme}&lang=${lang}`
  );
  await expect(page.locator('.ab-shell')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-ab-theme', theme);
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('render-error')).toHaveCount(0);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('Invalid Date');
  await expect(page.locator('main')).not.toContainText('allberto_');
}
async function noPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    outside: Array.from(document.querySelectorAll('body *'))
      .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
      .map((el) => ({
        tag: el.tagName,
        cls: el.className,
        right: el.getBoundingClientRect().right,
        text: el.textContent?.slice(0, 30),
      }))
      .slice(-15),
  }));
  expect(widths.html, JSON.stringify(widths)).toBeLessThanOrEqual(
    widths.viewport + 1
  );
  expect(widths.body, JSON.stringify(widths)).toBeLessThanOrEqual(
    widths.viewport + 1
  );
}
for (const width of [1440, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`integrated surfaces ${width}px ${theme}`, async ({ page }, info) => {
      test.setTimeout(120000);
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const [name, path, content] of [
        ['dashboard', '/dashboard', 'Monthly recurring revenue'],
        ['clients', '/clients', 'Acme — fixture local'],
        ['client-detail', '/clients/local-client', 'C-LOCAL'],
        ['invoices', '/invoices', 'INV-LOCAL-001'],
        ['recurring', '/recurring_invoices', 'REC-LOCAL-001'],
        ['payments', '/payments', 'PAY-LOCAL-001'],
        [
          'invoice-overview',
          '/invoices/local-invoice',
          'Serviço de teste local',
        ],
      ]) {
        await open(page, path, theme);
        await expect(
          page.getByText(content, { exact: false }).first()
        ).toBeVisible();
        if (name === 'dashboard') {
          await expect(page.locator('.ab-dashboard')).not.toContainText(
            'allberto_'
          );
          await expect(page.locator('.ab-kpi-val').first()).toContainText(
            /1,200\.00/
          );
        }
        if (['clients', 'invoices', 'recurring', 'payments'].includes(name)) {
          const list = page.locator('.allberto-entity-list');
          const row = list.locator('tbody tr').first();
          await expect(row).toHaveCSS(
            'display',
            width === 390 ? 'grid' : 'table-row'
          );
          await expect(
            list.locator('thead').getByRole('checkbox')
          ).toBeVisible();
          await expect(
            row
              .locator('[data-ab-cell="actions"]')
              .getByRole('button', { name: 'Actions', exact: true })
          ).toBeVisible();
          if (width === 390) {
            const columns = await row.evaluate(
              (el) => getComputedStyle(el).gridTemplateColumns
            );
            expect(columns.split(' ')).toHaveLength(2);
            await expect(
              list.locator('th.ab-datatable-actions-heading')
            ).toBeHidden();
          } else {
            await expect(
              list.locator('th.ab-datatable-actions-heading')
            ).toBeVisible();
          }
        }
        if (name === 'invoice-overview') {
          await expect(page.locator('.allberto-entity-activity')).toContainText(
            'No records found'
          );
          await expect(
            page.locator('.allberto-entity-activity')
          ).not.toContainText('404');
        }
        await noPageOverflow(page);
        const screenshot = info.outputPath(`${name}-${width}-${theme}.png`);
        await page.screenshot({ path: screenshot, fullPage: true });
        await info.attach(`${name}-${width}-${theme}`, {
          path: screenshot,
          contentType: 'image/png',
        });
      }
    });
  }
}

test('mobile drawer contains focus, closes on Escape, restores opener, and navigates', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/dashboard');
  const opener = page.getByRole('button', { name: 'Menu', exact: true });
  await opener.click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await expect(
    drawer.getByRole('button', { name: 'Close', exact: true })
  ).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(
    await drawer.evaluate((el) => el.contains(document.activeElement))
  ).toBe(true);
  await page.keyboard.press('Escape');
  await expect(drawer).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await drawer.getByRole('link', { name: 'Clients', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByTestId('local-surface')).toHaveAttribute(
    'data-path',
    '/clients'
  );
  await expect(page.getByText('Acme — fixture local').first()).toBeVisible();
});

test('invoice overview loads persisted values without write requests', async ({
  page,
}) => {
  await open(page, '/invoices/local-invoice');
  await expect(page.getByText('Serviço de teste local')).toBeVisible();
  await expect(
    page.getByText(/\$\s*1,200\.00/, { exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByText(/\$\s*600\.00/, { exact: true }).first()
  ).toBeVisible();
  await page.keyboard.press('Control+s');
  const writes = apiRequests.filter(
    (req) =>
      req.method !== 'GET' &&
      !['/api/v1/activities/entity', '/api/v1/search'].includes(
        new URL(req.url).pathname
      )
  );
  expect(writes).toEqual([]);
});

test('status tab changes the real DataTable API query and results', async ({
  page,
}) => {
  await open(page, '/invoices');
  const tabs = page.locator('[data-cy="statusTabs"]');
  await expect(tabs).toBeVisible();
  await expect(page.getByText('INV-LOCAL-001', { exact: true })).toBeVisible();
  const requested = page.waitForRequest((req) => {
    const url = new URL(req.url());
    return (
      url.pathname === '/api/v1/invoices' &&
      url.searchParams.get('client_status') === 'paid'
    );
  });
  await tabs.getByRole('button', { name: 'Paid', exact: true }).click();
  const request = await requested;
  expect(new URL(request.url()).searchParams.get('page')).toBe('1');
  await expect(
    tabs.getByRole('button', { name: 'Paid', exact: true })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('INV-LOCAL-001', { exact: true })).toHaveCount(0);
  await tabs.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByText('INV-LOCAL-001', { exact: true })).toBeVisible();
});

test('invoice loading and failed reads are named and can retry', async ({
  page,
}) => {
  let reads = 0;
  let releaseFirst: () => void = () => {};
  const firstRead = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  await page.route('**/api/v1/invoices/local-invoice?*', async (route) => {
    const request = route.request();
    apiRequests.push({ method: request.method(), url: request.url() });
    reads++;
    if (reads === 1) {
      await firstRead;
      return route.fulfill({
        status: 500,
        json: { message: 'Synthetic local read failure' },
      });
    }
    return route.fulfill({
      json: fixtureResponse(request.method(), new URL(request.url())),
    });
  });
  await page.goto('/tests/local/index.html?route=%2Finvoices%2Flocal-invoice');
  await expect(
    page.locator('.allberto-entity-loading[role="status"]')
  ).toContainText(/loading/i);
  releaseFirst();
  const error = page.locator('.allberto-entity-error[role="alert"]');
  await expect(error).toBeVisible();
  await error.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByText('Serviço de teste local')).toBeVisible();
  expect(reads).toBe(2);
});

for (const width of [1440, 390]) {
  test(`dashboard Portuguese labels and plural ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await open(page, '/dashboard', 'light', 'pt_BR');
    const dashboard = page.locator('.ab-dashboard');
    for (const label of [
      'Receita recorrente mensal',
      'Posição hoje',
      'Precisa de ação 1',
      'Próximas cobranças',
      'Maiores valores por emissão',
      'Histórico',
    ]) {
      await expect(
        dashboard.getByRole('heading', { name: label, exact: true })
      ).toBeVisible();
    }
    await expect(dashboard).toContainText('1 fatura em aberto');
    await expect(dashboard).not.toContainText('allberto_');
    await expect(dashboard).not.toContainText('{{');
    await noPageOverflow(page);
    const screenshot = info.outputPath(`dashboard-${width}-pt-BR-light.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
    await info.attach(`dashboard-${width}-pt-BR`, {
      path: screenshot,
      contentType: 'image/png',
    });

    // A second current (not overdue) invoice changes only the aggregate count.
    // Validate the rendered plural through the actual refresh/query/i18n path.
    await page.route('**/api/v1/charts/analytics_totals', async (route) => {
      apiRequests.push({
        method: route.request().method(),
        url: route.request().url(),
      });
      await route.fulfill({
        json: {
          currencies: { '1': 'USD' },
          '1': {
            mrr: { mrr: 1200, arr: 14400 },
            aging: { total: 900, current_amount: 300, outstanding_count: 2 },
          },
        },
      });
    });
    await page
      .getByRole('region', { name: 'Posição hoje', exact: true })
      .getByRole('button', { name: 'Atualizar', exact: true })
      .click();
    await expect(dashboard).toContainText('2 faturas em aberto');
    await expect(dashboard).not.toContainText('allberto_');
    await expect(dashboard).not.toContainText('{{');
  });
}

test('local shell combobox options remain clickable outside a short sheet', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, '/local-shell-checks');
  await page.getByPlaceholder('Choose fixture option').click();
  const geometry = await page
    .locator('[data-testid="shell-checks"] ul')
    .evaluate((menu) => {
      const sheet = document.querySelector('.ab-sheet')!;
      const boundary = sheet.getBoundingClientRect();
      const option = [...menu.querySelectorAll('li')].find((item) => {
        const r = item.getBoundingClientRect();
        return r.top + r.height / 2 > boundary.bottom && r.bottom < innerHeight;
      });
      const rect = option?.getBoundingClientRect();
      const hit = rect
        ? document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          )
        : null;
      return {
        menu: menu.getBoundingClientRect().toJSON(),
        sheet: boundary.toJSON(),
        overflow: getComputedStyle(sheet).overflow,
        externalOption: option?.textContent,
        externalOptionHit: Boolean(option && hit && option.contains(hit)),
      };
    });
  const geometryPath = info.outputPath('combobox-geometry.json');
  await writeFile(geometryPath, JSON.stringify(geometry, null, 2));
  await info.attach('combobox-geometry.json', {
    path: geometryPath,
    contentType: 'application/json',
  });
  await page.screenshot({
    path: info.outputPath('combobox-outside-sheet.png'),
    fullPage: true,
  });
  expect(geometry.externalOption, JSON.stringify(geometry)).toBeTruthy();
  expect(geometry.externalOptionHit, JSON.stringify(geometry)).toBe(true);
  await page
    .getByText('Fixture option 8', { exact: true })
    .click({ timeout: 3000 });
  await expect(page.getByTestId('selected-option')).toHaveText('8');
});

test('local shell unsaved navigation closes drawer before confirmation', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/local-shell-checks');
  await page
    .getByLabel('Fixture draft', { exact: true })
    .fill('Unsaved local draft');
  await page.getByLabel('Fixture draft', { exact: true }).press('Tab');
  await expect(page.getByTestId('draft-state')).toHaveText('dirty');
  const opener = page.getByRole('button', { name: 'Menu', exact: true });
  await opener.click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Clients', exact: true })
    .click();
  await expect(page.locator('.ab-drawer-root')).toHaveCount(0);
  const confirmation = page.getByRole('dialog');
  await expect(
    confirmation.getByRole('button', { name: 'Continue Editing', exact: true })
  ).toBeVisible();
  await expect
    .poll(() =>
      confirmation.evaluate((el) => el.contains(document.activeElement))
    )
    .toBe(true);
  await page.screenshot({
    path: info.outputPath('unsaved-confirmation-390.png'),
    fullPage: true,
  });
  await confirmation
    .getByRole('button', { name: 'Continue Editing', exact: true })
    .click();
  await expect(confirmation).not.toBeVisible();
  await expect(page.getByTestId('local-surface')).toHaveAttribute(
    'data-path',
    '/local-shell-checks'
  );
  await expect(page.getByLabel('Fixture draft', { exact: true })).toHaveValue(
    'Unsaved local draft'
  );
  await opener.click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Clients', exact: true })
    .click();
  await expect(page.locator('.ab-drawer-root')).toHaveCount(0);
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Discard Changes', exact: true })
    .click();
  await expect(page.getByTestId('local-surface')).toHaveAttribute(
    'data-path',
    '/clients'
  );
  await expect(page.getByText('Acme — fixture local').first()).toBeVisible();
});


test('mobile invoice tabs track overview and activity routes', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '/invoices/local-invoice', 'dark');
  const tabs = page.locator('[data-cy="tabs"] > div').first();
  const selectedOverview = tabs.getByText('Overview', { exact: true });
  await expect(selectedOverview).toBeVisible();
  await expect(tabs).not.toContainText('Select...');
  await tabs.getByRole('combobox').press('ArrowDown');
  await page.getByRole('option', { name: 'Activity', exact: true }).click({ timeout: 5000 });
  await expect(page.getByTestId('local-surface')).toHaveAttribute(
    'data-path', '/invoices/local-invoice/activity'
  );
  await expect(tabs.getByText('Activity', { exact: true })).toBeVisible();
  await tabs.getByRole('combobox').press('ArrowDown');
  await page.getByRole('option', { name: 'Overview', exact: true }).click({ timeout: 5000 });
  await expect(page.getByTestId('local-surface')).toHaveAttribute(
    'data-path', '/invoices/local-invoice'
  );
  await expect(selectedOverview).toBeVisible();
  await expect(page.getByText('Serviço de teste local')).toBeVisible();
  await noPageOverflow(page);
  await page.screenshot({ path: info.outputPath('invoice-overview-390-dark.png'), fullPage: true });
});
