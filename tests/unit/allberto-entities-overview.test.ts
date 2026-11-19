import { createElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Invoice } from '$app/common/interfaces/invoice';
import { cloneDeep } from 'lodash';
import { InvoiceSum } from '$app/common/helpers/invoices/invoice-sum';
import baseInvoice from '../helpers/data/invoice';
import currencies from '../helpers/data/currencies';
import type { Client } from '$app/common/interfaces/client';

const state = vi.hoisted(() => ({
  invoice: undefined as Invoice | undefined,
  editableInvoice: undefined as Invoice | undefined,
  money: vi.fn(
    (value: number, _country: string, currency: string) =>
      `${currency}:${value}`
  ),
  sanitize: vi.fn(() => '<p>sanitized notes</p>'),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => [(key: string) => key],
}));
vi.mock('react-router-dom', () => ({
  useOutletContext: () => ({
    invoice: state.editableInvoice ?? state.invoice,
    persistedInvoice: state.invoice,
  }),
}));
vi.mock('$app/common/hooks/money/useFormatMoney', () => ({
  useFormatMoney: () => state.money,
}));
vi.mock('$app/common/hooks/useCurrentCompanyDateFormats', () => ({
  useCurrentCompanyDateFormats: () => ({ dateFormat: 'YYYY-MM-DD' }),
}));
vi.mock('$app/common/hooks/useDisableNavigation', () => ({
  useDisableNavigation: () => () => false,
}));
vi.mock('$app/common/helpers', () => ({ date: (value: string) => value }));
vi.mock('$app/common/helpers/html-string', () => ({
  sanitizeHTML: state.sanitize,
}));
vi.mock('$app/components/cards', () => ({
  Card: ({ title, children }: { title: ReactNode; children: ReactNode }) =>
    createElement('section', {}, title, children),
}));
vi.mock('$app/components/DynamicLink', () => ({
  DynamicLink: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
}));
vi.mock('$app/components/forms', () => ({
  Button: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
  Link: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement('a', { href: to }, children),
}));
vi.mock('$app/pages/invoices/common/components/InvoiceStatus', () => ({
  InvoiceStatus: () => 'status',
}));
vi.mock('$app/pages/invoices/edit/components/Activities', () => ({
  default: () => 'activity',
}));
vi.mock('$app/pages/invoices/edit/components/Payments', () => ({
  default: () => 'payments',
}));

import Overview from '$app/pages/invoices/overview/Overview';
import { Standing } from '$app/pages/clients/show/components/Standing';

const baseClient: Client = {
  id: 'client-a',
  user_id: '',
  assigned_user_id: '',
  name: 'Test client',
  website: '',
  private_notes: '',
  balance: 0,
  group_settings_id: '',
  paid_to_date: 0,
  credit_balance: 0,
  payment_balance: 0,
  last_login: 0,
  size_id: '',
  public_notes: '',
  client_hash: '',
  address1: '',
  address2: '',
  phone: '',
  city: '',
  state: '',
  postal_code: '',
  country_id: 'country-a',
  industry_id: '',
  custom_value1: '',
  custom_value2: '',
  custom_value3: '',
  custom_value4: '',
  shipping_address1: '',
  shipping_address2: '',
  shipping_city: '',
  shipping_state: '',
  shipping_postal_code: '',
  shipping_country_id: '',
  settings: { currency_id: 'currency-a' },
  is_deleted: false,
  vat_number: '',
  id_number: '',
  display_name: 'Test client',
  number: '',
  contacts: [],
  documents: [],
  gateway_tokens: [],
  has_valid_vat_number: false,
  is_tax_exempt: false,
  routing_id: '',
  classification: '',
  e_invoice: {},
  locations: [],
  created_at: 0,
  archived_at: 0,
  updated_at: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  state.editableInvoice = undefined;
  state.invoice = {
    ...cloneDeep(baseInvoice),
    id: 'invoice-a',
    number: 'INV-42',
    client_id: 'client-a',
    amount: 100,
    balance: 20,
    paid_to_date: 55,
    date: '2026-11-01',
    due_date: '2026-11-30',
    last_sent_date: '',
    auto_bill_enabled: false,
    recurring_id: '',
    client: {
      ...cloneDeep(baseClient),
      display_name: 'Test client',
      country_id: 'country-a',
      settings: { currency_id: 'currency-a' },
    },
    line_items: [
      {
        ...baseInvoice.line_items[0],
        product_key: 'Service',
        quantity: 2,
        cost: 40,
        line_total: 72,
        notes: '<img src=x onerror=alert(1)>',
      },
    ],
  };
});

describe('Allberto invoice overview', () => {
  test('keeps server amounts after the real editor calculator mutates its separate draft', () => {
    state.invoice = {
      ...cloneDeep(baseInvoice),
      ...state.invoice,
      tax_name1: '',
      tax_name2: '',
      tax_name3: '',
      tax_rate1: 0,
      tax_rate2: 0,
      tax_rate3: 0,
      line_items: [
        {
          ...baseInvoice.line_items[0],
          ...state.invoice!.line_items[0],
          tax_name1: '',
          tax_rate1: 0,
          tax_name2: '',
          tax_rate2: 0,
          tax_name3: '',
          tax_rate3: 0,
        },
      ],
    };
    state.editableInvoice = cloneDeep(state.invoice);
    new InvoiceSum(state.editableInvoice, currencies[0]).build();
    expect(state.editableInvoice.amount).toBe(80);
    expect(state.editableInvoice.balance).toBe(25);
    expect(state.editableInvoice.line_items[0].line_total).toBe(80);
    state.editableInvoice.number = 'UNSAVED-DRAFT';
    state.editableInvoice.date = '2099-01-01';
    state.editableInvoice.line_items[0].product_key = 'UNSAVED-ITEM';
    const html = renderToStaticMarkup(createElement(Overview));
    for (const amount of [100, 20, 72])
      expect(html).toContain(`currency-a:${amount}`);
    expect(html).not.toContain('currency-a:80');
    expect(html).not.toContain('UNSAVED');
    expect(html).not.toContain('2099-01-01');
    expect(state.invoice.amount).toBe(100);
  });

  test('uses persisted line total and paid amount, with the invoice client currency', () => {
    const html = renderToStaticMarkup(createElement(Overview));
    expect(html).toContain('currency-a:72');
    expect(html).toContain('currency-a:55');
    expect(html).toContain('currency-a:20');
    expect(html).not.toContain('currency-a:80');
    expect(
      state.money.mock.calls.every(
        ([, country, currency]) =>
          country === 'country-a' && currency === 'currency-a'
      )
    ).toBe(true);
    expect(html).toContain('/invoices/invoice-a/pdf');
  });

  test('passes rich notes through the existing sanitizer and never renders raw notes', () => {
    const html = renderToStaticMarkup(createElement(Overview));
    expect(state.sanitize).toHaveBeenCalledWith('<img src=x onerror=alert(1)>');
    expect(html).toContain('sanitized notes');
    expect(html).not.toContain('onerror');
  });

  test('shows persisted taxes and percentage or amount discounts without calculation', () => {
    state.invoice!.total_taxes = 9;
    state.invoice!.discount = 5;
    state.invoice!.is_amount_discount = false;
    let html = renderToStaticMarkup(createElement(Overview));
    expect(html).toContain('currency-a:9');
    expect(html).toContain('5%');
    state.invoice!.is_amount_discount = true;
    html = renderToStaticMarkup(createElement(Overview));
    expect(html).toContain('currency-a:5');
    expect(html).not.toContain('5%');
  });

  test('does not turn unavailable totals into zero or invent a recurring contract', () => {
    state.invoice!.amount = Number.NaN;
    state.invoice!.line_items = [];
    const html = renderToStaticMarkup(createElement(Overview));
    expect(html).toContain('—');
    expect(html).toContain('no_records_found');
    expect(html).not.toContain('/recurring_invoices/');
    expect(
      state.money.mock.calls.some(([value]) => !Number.isFinite(value))
    ).toBe(false);
  });

  test('does not render another invoice while the parent has no matching record', () => {
    state.editableInvoice = state.invoice;
    state.invoice = undefined;
    expect(renderToStaticMarkup(createElement(Overview))).toBe('');
  });
});

test('client standing retains four distinct server balances and the client currency', () => {
  const client: Client = {
    ...cloneDeep(baseClient),
    paid_to_date: 81,
    balance: 13,
    credit_balance: 7,
    payment_balance: Number.NaN,
    country_id: 'country-b',
    settings: { currency_id: 'currency-b' },
  };
  const html = renderToStaticMarkup(createElement(Standing, { client }));
  for (const value of [81, 13, 7])
    expect(html).toContain(`currency-b:${value}`);
  expect(html).toContain('—');
  expect(html).toContain('payment_balance');
  expect(html).not.toContain('currency-b:0');
});
