/** Synthetic, local-only data. Never import into production or send to a backend. */
import baseInvoice from '../helpers/data/invoice';

export const user = {
  id: 'local-user',
  first_name: 'Equipe',
  last_name: 'Teste',
  email: 'qa@example.invalid',
  email_verified_at: 1700000000,
  phone_verified: true,
  language_id: '1',
  oauth_user_id: '',
  custom_value1: '',
  custom_value2: '',
  custom_value3: '',
  custom_value4: '',
  oauth_provider_id: '',
  created_at: 1700000000,
  updated_at: 1700000000,
};
export const settings = {
  name: 'Empresa de teste local',
  currency_id: '1',
  country_id: '840',
  language_id: '1',
  timezone_id: '1',
  date_format_id: '1',
  military_time: true,
  show_currency_code: false,
  enable_client_portal: true,
  enable_client_portal_dashboard: true,
  company_logo: '',
  payment_terms: '30',
  auto_bill: 'off',
  invoice_number_pattern: '{$counter}',
  recurring_invoice_number_pattern: 'R-{$counter}',
};
export const client = {
  id: 'local-client',
  number: 'C-LOCAL',
  name: 'Acme — fixture local',
  display_name: 'Acme — fixture local',
  user_id: user.id,
  assigned_user_id: '',
  is_deleted: false,
  archived_at: 0,
  created_at: 1700000000,
  updated_at: 1700000000,
  balance: 600,
  paid_to_date: 600,
  credit_balance: 0,
  payment_balance: 0,
  last_login: 0,
  last_login_at: 0,
  id_number: 'FIXTURE',
  vat_number: '',
  country_id: '840',
  shipping_country_id: '840',
  address1: 'Endereço de teste',
  address2: '',
  city: 'Local',
  state: '',
  postal_code: '',
  phone: '',
  website: '',
  private_notes: '',
  public_notes: '',
  group_settings_id: '',
  settings,
  group_settings: { settings: {} },
  custom_value1: '',
  custom_value2: '',
  custom_value3: '',
  custom_value4: '',
  contacts: [
    {
      id: 'local-contact',
      first_name: 'Contato',
      last_name: 'Teste',
      email: 'contact@example.invalid',
      phone: '',
      is_primary: true,
      send_email: true,
      last_login: 0,
    },
  ],
  documents: [],
  gateway_tokens: [],
  tags: [],
  locations: [],
};
export const invoice = {
  ...baseInvoice,
  id: 'local-invoice',
  number: 'INV-LOCAL-001',
  client_id: client.id,
  client,
  user_id: user.id,
  amount: 1200,
  balance: 600,
  paid_to_date: 600,
  status_id: '3',
  date: '2026-11-01',
  due_date: '2026-11-15',
  tax_name1: '',
  tax_name2: '',
  tax_name3: '',
  tax_rate1: 0,
  tax_rate2: 0,
  tax_rate3: 0,
  total_taxes: 0,
  custom_value1: '',
  custom_value2: '',
  invitations: [],
  payments: [],
  paymentables: [],
  activities: [],
  line_items: [
    {
      ...baseInvoice.line_items[0],
      product_key: 'Serviço de teste local',
      notes: '<p>Fixture explícita para validação visual.</p>',
      cost: 1200,
      quantity: 1,
      line_total: 1200,
      gross_line_total: 1200,
      tax_rate1: 0,
      tax_name1: '',
      custom_value1: '',
      custom_value2: '',
      custom_value3: '',
      custom_value4: '',
    },
  ],
};
export const recurring = {
  ...invoice,
  id: 'local-recurring',
  number: 'REC-LOCAL-001',
  entity_type: 'recurring_invoice',
  status_id: '2',
  frequency_id: '5',
  remaining_cycles: -1,
  next_send_date: '2026-11-25',
  next_send_date_client: '2026-11-25',
  auto_bill: 'off',
  auto_bill_enabled: false,
  last_sent_date: '2026-10-25',
  start_date: '2026-01-25',
  cycle: 10,
};
export const payment = {
  id: 'local-payment',
  number: 'PAY-LOCAL-001',
  client_id: client.id,
  client,
  user_id: user.id,
  assigned_user_id: '',
  is_deleted: false,
  archived_at: 0,
  created_at: 1700000000,
  updated_at: 1700000000,
  amount: 600,
  refunded: 0,
  applied: 600,
  date: '2026-11-03',
  type_id: '1',
  transaction_reference: 'LOCAL-ONLY',
  status_id: '4',
  invoices: [{ ...invoice, pivot: { amount: 600, refunded: 0 } }],
  credits: [],
  documents: [],
  custom_value1: '',
  custom_value2: '',
  custom_value3: '',
  custom_value4: '',
};
export const company = {
  id: 'local-company',
  company_key: 'local-only',
  settings,
  enabled_modules: 4097,
  is_disabled: false,
  is_large: false,
  size_id: '1',
  custom_fields: {},
  custom_surcharge_taxes1: false,
  industries: [],
  company_gateways: [],
  users: [user],
  tax_rates: [],
  group_settings: [],
  documents: [],
  expense_categories: [],
  locations: [],
  webhooks: [],
  payment_terms: [],
  e_invoice: {},
  default_task_rate: 0,
  has_e_invoice: false,
  invoice_size: '',
  quote_size: '',
};
export const companyUser = {
  user,
  company,
  account: {
    id: 'local-account',
    plan: 'enterprise',
    plan_expires: 4102444800,
    trial_plan: '',
    trial_started: 0,
    trial_expires: 0,
    is_paid: true,
    default_url: '',
    account_sms_verified: true,
    hosted_client_count: 1,
  },
  is_admin: true,
  is_owner: true,
  is_locked: false,
  permissions: '',
  token: { token: 'LOCAL-FIXTURE-NOT-A-CREDENTIAL', id: 'local-token' },
  settings: { accent_color: '#545dff' },
  notifications: { email: [] },
  react_settings: {},
  ninja_portal_url: '',
};
export const statics = {
  banks: [],
  countries: [
    { id: '840', iso_3166_2: 'US', iso_3166_3: 'USA', name: 'United States' },
  ],
  currencies: [
    {
      id: '1',
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      precision: 2,
      decimal_separator: '.',
      thousand_separator: ',',
      exchange_rate: 1,
      swap_currency_symbol: false,
    },
  ],
  date_formats: [{ id: '1', format: 'Y-m-d', format_moment: 'YYYY-MM-DD' }],
  datetime_formats: [],
  gateways: [],
  industries: [],
  languages: [{ id: '1', name: 'English', locale: 'en' }],
  payment_types: [{ id: '1', name: 'Bank Transfer', gateway_type_id: null }],
  sizes: [],
  timezones: [{ id: '1', name: 'UTC', location: 'UTC', utc_offset: 0 }],
  templates: {},
  bulk_updates: {},
};
const collection = (data: unknown[]) => ({
  data,
  meta: {
    pagination: {
      total: data.length,
      count: data.length,
      per_page: 20,
      current_page: 1,
      total_pages: 1,
      links: {},
    },
  },
});
/** Exact read endpoints only. Unknown URLs and all writes fail closed. */
export function fixtureResponse(method: string, url: URL): unknown | undefined {
  const path = url.pathname;
  if (method === 'GET') {
    if (path === '/api/v1/health_check')
      return {
        api_version: '5.0.0-local',
        is_docker: true,
        cron_enabled: true,
      };
    if (path === '/api/v1/statics') return statics;
    if (path === '/api/v1/clients/local-client') return { data: client };
    if (path === '/api/v1/invoices/local-invoice') return { data: invoice };
    if (path === '/api/v1/invoices/create')
      return {
        data: { ...invoice, id: '', number: '', amount: 0, balance: 0, paid_to_date: 0, line_items: [] },
      };
    if (path === '/api/v1/clients') return collection([client]);
    if (path === '/api/v1/invoices') {
      const status = url.searchParams.get('client_status');
      return collection(
        status === 'paid' || status === 'draft' ? [] : [invoice]
      );
    }
    if (path === '/api/v1/recurring_invoices') return collection([recurring]);
    if (path === '/api/v1/payments/create')
      return {
        data: {
          ...payment,
          id: '',
          number: '',
          amount: 0,
          applied: 0,
          invoices: [],
        },
      };
    if (path === '/api/v1/payments') return collection([payment]);
    if (
      [
        '/api/v1/activities',
        '/api/v1/notifications',
        '/api/v1/company_gateways',
        '/api/v1/products',
        '/api/v1/bank_integrations',
        '/api/v1/tax_rates',
        '/api/v1/group_settings',
        '/api/v1/users',
        '/api/v1/designs',
        '/api/v1/quotes',
      ].includes(path)
    )
      return collection([]);
  }
  if (method === 'POST') {
    if (path === '/api/v1/charts/calculated_fields') return 0;
    if (path === '/api/v1/search') return {};
    if (path === '/api/v1/emails/clientHistory/local-client') return [];
    if (path === '/api/v1/activities/entity') return collection([]);
    if (path === '/api/v1/charts/analytics_totals')
      return {
        '1': {
          mrr: { mrr: 1200, arr: 14400 },
          aging: { total: 600, current_amount: 0, outstanding_count: 1 },
        },
        currencies: { '1': 'USD' },
      };
    if (path === '/api/v1/charts/totals_v2')
      return {
        currencies: { '1': 'USD' },
        '1': {
          revenue: { paid_to_date: '600', code: 'USD' },
          expenses: { amount: '0', code: 'USD' },
          invoices: { invoiced_amount: '1200', code: 'USD' },
          outstanding: { outstanding_count: 1, amount: '600', code: 'USD' },
        },
      };
    if (path === '/api/v1/charts/chart_summary_v2')
      return {
        start_date: '2026-11-01',
        end_date: '2026-11-30',
        '1': {
          invoices: [{ total: '1200', date: '2026-11-01', currency: '1' }],
          payments: [{ total: '600', date: '2026-11-03', currency: '1' }],
          outstanding: [{ total: '600', date: '2026-11-15', currency: '1' }],
          expenses: [],
        },
      };
  }
  return undefined;
}
