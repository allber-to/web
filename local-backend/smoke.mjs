import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
const dir = fileURLToPath(new URL('.', import.meta.url));
const env = config({ path: `${dir}.env`, quiet: true }).parsed;
const base = process.env.ALLBERTO_API_URL || env.APP_URL;
assert.equal(base, 'http://localhost:8012');
assert.match(env.IN_USER_EMAIL, /@allberto\.test$/);
const compose = ['--context', 'desktop-linux', 'compose', '-p', 'allberto-ninja-local', '-f', `${dir}compose.yml`, '--env-file', `${dir}.env`];
const running = execFileSync('docker', [...compose, 'ps', '--status', 'running', '--services'], { encoding: 'utf8' });
assert(running.split('\n').includes('app'), 'Local app must be running');
mkdirSync(`${dir}evidence`, { recursive: true });
let token;
export async function api(path, method = 'GET', body) {
  assert(path.startsWith('/api/v1/'));
  assert(!/purge|reset/.test(path));
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'X-React': 'true', ...(token ? { 'X-Api-Token': token } : {}), ...(path.startsWith('/api/v1/users/') ? { 'X-Api-Password': env.IN_PASSWORD } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${method} ${path.split('?')[0]}: HTTP ${res.status}`);
  return { body: await res.json(), version: res.headers.get('x-app-version') };
}
const precheck = await api('/api/v1/login/precheck', 'POST', { email: env.IN_USER_EMAIL });
assert.equal(precheck.body.secret_required, false);
const login = await api('/api/v1/login', 'POST', { email: env.IN_USER_EMAIL, password: env.IN_PASSWORD });
const session = login.body.data[0];
token = session.token.token;
assert(token);
assert.equal(login.version, '5.13.49');
await api('/api/v1/refresh', 'POST');
console.log('PASS login/precheck/refresh, version 5.13.49');
const statics = (await api('/api/v1/statics')).body;
const data = statics.data || statics;
const brl = data.currencies.find(x => x.code === 'BRL');
const language = data.languages.find(x => x.locale === 'pt_BR');
const brazil = data.countries.find(x => x.iso_3166_2 === 'BR');
assert(brl && language && brazil, 'BRL, pt_BR and Brazil statics required');
await api(`/api/v1/companies/${session.company.id}`, 'PUT', { settings: { ...session.company.settings, name: 'Allberto Local', country_id: String(brazil.id), currency_id: String(brl.id), language_id: String(language.id) } });
await api(`/api/v1/users/${session.user.id}`, 'PUT', { ...session.user, language_id: String(language.id) });
const list = async resource => (await api(`/api/v1/${resource}?per_page=100&status=active`)).body.data;
const clients = await list('clients');
const ownedClients = [];
for (let i = 1; i <= 3; i++) {
 const name = `ALB-LOCAL-Cliente-${i}`;
 let client = clients.find(x => x.name === name);
 if (!client) client = (await api('/api/v1/clients', 'POST', { name, country_id: String(brazil.id), contacts: [{ first_name: `Contato ${i}`, email: `cliente${i}@example.test` }], settings: { currency_id: String(brl.id), language_id: String(language.id) } })).body.data;
 if (String(client.country_id) !== String(brazil.id)) client = (await api(`/api/v1/clients/${client.id}`, 'PUT', { ...client, country_id: String(brazil.id) })).body.data;
 assert.equal((await api(`/api/v1/clients/${client.id}`)).body.data.name, name);
 ownedClients.push(client);
}
// shortcut: dated fixtures target this validation week, refresh the dedicated dataset for later calendar runs.
const day = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0,10); };
const invoices = await list('invoices');
const ownedInvoices = [];
for (const [i, label, amount, due] of [[0, 'Draft', 50, 15], [1, 'Sent', 123.45, 15], [2, 'Overdue', 200, -5]]) {
 const po = `ALB-LOCAL-${label}`;
 let invoice = invoices.find(x => x.po_number === po);
 if (!invoice) invoice = (await api('/api/v1/invoices', 'POST', { client_id: ownedClients[i].id, po_number: po, date: day(0), due_date: day(due), line_items: [{ product_key: po, notes: 'Serviço local de validação', cost: amount, quantity: 1 }] })).body.data;
 if (i > 0 && String(invoice.status_id) === '1') {
  await api('/api/v1/invoices/bulk', 'POST', { ids: [invoice.id], action: 'mark_sent' });
 }
 invoice = (await api(`/api/v1/invoices/${invoice.id}`)).body.data;
 ownedInvoices.push(invoice);
}
let recurring = (await list('recurring_invoices')).find(x => x.po_number === 'ALB-LOCAL-Monthly');
if (!recurring) recurring = (await api('/api/v1/recurring_invoices', 'POST', { client_id: ownedClients[0].id, po_number: 'ALB-LOCAL-Monthly', date: day(3), next_send_date: day(3), frequency_id: '5', remaining_cycles: -1, auto_bill: 'off', line_items: [{ product_key: 'ALB-LOCAL-Monthly', cost: 75, quantity: 1 }] })).body.data;
if (String(recurring.status_id) !== '2') recurring = (await api(`/api/v1/recurring_invoices/${recurring.id}?start=true`, 'PUT', recurring)).body.data;
assert.equal(String(recurring.status_id), '2');
assert(recurring.next_send_date.slice(0,10) >= day(0) && recurring.next_send_date.slice(0,10) <= day(6), 'Recurring next send must be inside seven days');
let payment = (await list('payments')).find(x => x.transaction_reference === 'ALB-LOCAL-Partial');
if (!payment) payment = (await api('/api/v1/payments?email_receipt=false', 'POST', { client_id: ownedClients[1].id, amount: 23.45, date: day(0), type_id: '1', transaction_reference: 'ALB-LOCAL-Partial', invoices: [{ invoice_id: ownedInvoices[1].id, amount: 23.45 }], idempotency_key: randomUUID() })).body.data;
const paid = (await api(`/api/v1/invoices/${ownedInvoices[1].id}`)).body.data;
assert.equal(Number(paid.paid_to_date), 23.45);
assert.equal(Number(paid.balance), 100);
assert.equal(String(paid.status_id), '3');
const month = new Date();
const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString().slice(0,10);
const end = new Date(month.getFullYear(), month.getMonth()+1, 0).toISOString().slice(0,10);
const body = { start_date: start, end_date: end, date_range: 'this_month' };
const analytics = (await api('/api/v1/charts/analytics_totals', 'POST', body)).body;
const totals = (await api('/api/v1/charts/totals_v2?include_drafts=false', 'POST', body)).body;
writeFileSync(`${dir}evidence/chart-values.json`, JSON.stringify({ analytics, totals }, null, 2));
assert.equal(Number(analytics[brl.id].mrr.mrr), 75);
assert.equal(Number(analytics[brl.id].aging.total), 300);
assert.equal(Number(analytics[brl.id].aging.total)-Number(analytics[brl.id].aging.current_amount), 200);
assert.equal(Number((totals.data || totals)[brl.id].revenue.paid_to_date), 23.45);
const summary = { version: login.version, company: session.company.id, currency: 'BRL', language: 'pt_BR', clients: ownedClients.map(x => x.id), invoices: ownedInvoices.map(x => x.id), recurring: recurring.id, payment: payment.id, expected: { mrr: 75, receivable: 300, overdue: 200, received: 23.45, paidBalance: 100 } };
const previous = (() => { try { return JSON.parse(readFileSync(`${dir}evidence/summary.json`)); } catch { return null; } })();
if (previous) assert.deepEqual(summary, previous, 'Idempotent runs must preserve IDs and amounts');
writeFileSync(`${dir}evidence/summary.json`, JSON.stringify(summary, null, 2));
console.log('PASS CRUD and exact KPIs: MRR 75; receivable 300; overdue 200; received 23.45');
const key = paid.invitations[0]?.key;
assert(key, 'Invoice invitation required for PDF');
const pdf = await fetch(`${base}/client/invoice/${key}/download_pdf`, { headers: { 'X-Api-Token': token, 'X-Requested-With': 'XMLHttpRequest', 'X-React': 'true' }, signal: AbortSignal.timeout(90000) });
assert.equal(pdf.status, 200, 'PDF status');
assert(pdf.headers.get('content-type')?.includes('application/pdf'));
const buffer = Buffer.from(await pdf.arrayBuffer());
assert.equal(buffer.subarray(0,4).toString(), '%PDF');
assert(buffer.length > 10000);
writeFileSync(`${dir}evidence/invoice.pdf`, buffer);
console.log(`PASS PDF (${buffer.length} bytes)`);
const subject = 'ALB-LOCAL-Mail-Smoke';
const readMailLog = () => execFileSync('docker', [...compose, 'exec', '-T', 'app', 'cat', '/var/www/html/storage/logs/laravel.log'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
if (!readMailLog().includes(subject)) {
 await api('/api/v1/emails', 'POST', { entity: 'invoice', entity_id: paid.id, subject, body: 'Validação local Allberto; nenhuma entrega externa.', template: 'email_template_invoice', cc_email: '' });
}
let mailFound = false;
for (let attempt = 0; attempt < 12; attempt++) {
 const log = readMailLog();
 if (log.includes(subject) && log.includes('cliente2@example.test')) { mailFound = true; break; }
 await new Promise(resolve => setTimeout(resolve, 2000));
}
assert(mailFound, 'Email must be recorded in local log');
const history = (await api(`/api/v1/emails/clientHistory/${ownedClients[1].id}`, 'POST')).body;
// Keep only an outcome; mail history can contain invitation links.
const sentInvoice = (await api(`/api/v1/invoices/${paid.id}`)).body.data;
assert(sentInvoice.invitations[0].sent_date, 'Invitation must record local send date');
console.log('Mail history entries:', Array.isArray(history) ? history.length : 'unknown');
writeFileSync(`${dir}evidence/mail-summary.json`, JSON.stringify({ subject, recipient: 'cliente2@example.test', transport: 'log', recorded: true, invitationSent: true, historyEntries: Array.isArray(history) ? history.length : null }, null, 2));
console.log('PASS local-only email log and invitation sent date; provider history not produced by log transport');
console.log('PASS smoke completed; IDs stored without authentication secrets');
