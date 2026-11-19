import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { config } from 'dotenv';
const env = config({ path: 'local-backend/.env', quiet: true }).parsed;
assert.equal(env.APP_URL, 'http://localhost:8012');
assert.match(env.IN_USER_EMAIL, /@allberto\.test$/);
assert(execFileSync('docker', ['--context', 'desktop-linux', 'compose', '-p', 'allberto-ninja-local', '-f', 'local-backend/compose.yml', '--env-file', 'local-backend/.env', 'ps', '--status', 'running', '--services'], { encoding: 'utf8' }).split('\n').includes('app'));
const summary = JSON.parse(readFileSync('local-backend/evidence/summary.json'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
const page = await context.newPage();
const errors = [], responses = [], failed = [];
// Only sanitized paths/statuses are retained: no headers, bodies or invitation keys.
const safePath = value => { const u = new URL(value); return u.pathname.startsWith('/client/') ? '/client/[redacted]' : u.pathname; };
page.on('pageerror', e => errors.push(e.message.replace(/https?:\/\/\S+/g, '[url]')));
page.on('response', r => { if (r.url().startsWith(env.APP_URL)) responses.push({ method: r.request().method(), path: safePath(r.url()), status: r.status() }); });
page.on('requestfailed', r => { if (!r.failure()?.errorText.includes('ERR_ABORTED')) failed.push({ path: safePath(r.url()), error: r.failure()?.errorText }); });
try {
 await page.goto('http://127.0.0.1:3100/login');
 await page.locator('input[name=email]').fill(env.IN_USER_EMAIL);
 await page.locator('form button[type=submit]').click();
 await page.locator('input[name=password]').fill(env.IN_PASSWORD);
 await page.locator('form button[type=submit]').click();
 await page.waitForURL('**/dashboard', { timeout: 90000 });
 await expect(page.locator('#ab-position')).toBeVisible();
 const welcome = page.getByRole('dialog', { name: 'Bem-vindo ao Invoice Ninja' });
 if (await welcome.isVisible()) {
  await page.keyboard.press('Escape');
  await expect(welcome).toBeHidden();
 }
 for (const [label, value] of [['Receita recorrente mensal', 'R$ 75,00'], ['Recebido em', 'R$ 23,45'], ['A receber', 'R$ 300,00'], ['Em atraso', 'R$ 200,00']]) {
  const card = page.locator('article.ab-kpi').filter({ hasText: new RegExp(label, 'i') });
  await expect(card.locator('.ab-kpi-val')).toHaveText(value, { timeout: 20000 });
  await expect(card).toHaveAttribute('aria-busy', 'false');
 }
 assert((await page.locator('body').innerText()).toLowerCase().includes('allberto'));
 await expect(page.locator('ol.ab-cal li').filter({ hasText: '1 cobr.' })).toHaveCount(1);
 await page.waitForLoadState('networkidle');
 await page.screenshot({ path: 'local-backend/evidence/dashboard.png', fullPage: true });
 const dashboardText = await page.locator('body').innerText();
 writeFileSync('local-backend/evidence/dashboard-text.txt', dashboardText);
 for (const [name, path, expected] of [
  ['clients', '/clients', 'ALB-LOCAL-Cliente-1'],
  ['client-detail', `/clients/${summary.clients[0]}`, 'ALB-LOCAL-Cliente-1'],
  ['invoices', '/invoices', 'ALB-LOCAL'],
  ['invoice-overview', `/invoices/${summary.invoices[2]}`, '200'],
  ['invoice-edit', `/invoices/${summary.invoices[2]}/edit`, '200'],
  ['invoice-return', `/invoices/${summary.invoices[2]}`, '200'],
  ['recurring', '/recurring_invoices', '75'],
  ['payments', '/payments', '23'],
 ]) {
  await page.goto(`http://127.0.0.1:3100${path}`);
  await page.waitForTimeout(2500);
  assert((await page.locator('body').innerText()).includes(expected), `${name} expected content`);
  if (name === 'invoice-overview' || name === 'invoice-return') {
   for (const [label, value] of [['Total', 'R$ 200,00'], ['Pago até a data', 'R$ 0,00'], ['Saldo', 'R$ 200,00']]) {
    const item = page.locator('dl > div').filter({ has: page.locator('dt', { hasText: new RegExp(`^${label}$`) }) });
    await expect(item.locator('dd')).toHaveText(value);
   }
  }
  await page.screenshot({ path: `local-backend/evidence/${name}.png`, fullPage: true });
  console.log(`PASS real UI ${name}`);
 }
 await page.goto(`http://127.0.0.1:3100/clients/${summary.clients[0]}/edit`);
 const website = page.locator('dt').filter({ hasText: /^Site$/ }).locator('..').getByRole('textbox');
 await expect(website).toBeVisible();
 const value = (await website.inputValue()).endsWith('/confirmed') ? 'https://allberto.example.test/rechecked' : 'https://allberto.example.test/confirmed';
 await website.fill(value);
 await website.press('Tab');
 await page.waitForTimeout(350);
 const saved = page.waitForResponse(r => r.url().includes(`/api/v1/clients/${summary.clients[0]}`) && r.request().method() === 'PUT', { timeout: 15000 });
 const [savedResponse] = await Promise.all([saved, page.getByRole('button', { name: 'Salvar', exact: true }).click()]);
 assert.equal(savedResponse.status(), 200);
 await page.waitForURL(`**/clients/${summary.clients[0]}`);
 const reloaded = page.waitForResponse(r => r.url().includes(`/api/v1/clients/${summary.clients[0]}?`) && r.request().method() === 'GET');
 await page.goto(`http://127.0.0.1:3100/clients/${summary.clients[0]}/edit`);
 assert.equal((await (await reloaded).json()).data.website, value);
 await expect(website).toHaveValue(value);
 console.log('PASS real UI client edit/save/reload');
 await page.goto('http://127.0.0.1:3100/payments');
 await page.reload();
 await page.waitForTimeout(2500);
 assert(page.url().endsWith('/payments'));
 assert(responses.some(r => r.path === '/api/v1/refresh' && r.status === 200));
 assert(responses.some(r => r.path === '/api/v1/login/precheck' && r.status === 200));
 assert(responses.some(r => r.path === '/api/v1/login' && r.status === 200));
 assert.deepEqual(errors, []);
 assert.deepEqual(failed, []);
 assert.deepEqual(responses.filter(r => r.status >= 400), []);
 console.log('PASS real browser login, lists/details, reload and clean API network');
} catch (error) {
 await page.screenshot({ path: 'local-backend/evidence/browser-failure.png', fullPage: true });
 console.log('Failure page:', new URL(page.url()).pathname);
 writeFileSync('local-backend/evidence/browser-failure-text.txt', (await page.locator('body').innerText()).replaceAll(env.IN_PASSWORD, '[redacted]'));
 throw error;
} finally {
 writeFileSync('local-backend/evidence/browser-report.json', JSON.stringify({ errors, failed, responses }, null, 2));
 await browser.close();
}
