/**
 * Fixture LOCAL de testes — nenhuma requisição sai do navegador.
 *
 * Substitui o adapter do axios antes de `src/common/helpers/request.ts`
 * criar o cliente (este módulo é importado primeiro por main.tsx). Os dados
 * abaixo são FICTÍCIOS, servem só para comparação visual com a proposta e
 * não existem em nenhum caminho da aplicação de produção.
 *
 * ?state=data|empty|loading|error
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import dayjs from 'dayjs';

const params = new URLSearchParams(window.location.search);
export const fixtureState = params.get('state') ?? 'data';

const today = dayjs();
const d = (offset: number) => today.add(offset, 'day').format('YYYY-MM-DD');

const BRL = '12';

const client = (id: string, name: string) => ({
  id,
  display_name: name,
  name,
  country_id: '76',
  settings: { currency_id: BRL },
  is_deleted: false,
  archived_at: 0,
});

const paginated = (data: unknown[], total = data.length) => ({
  data,
  meta: {
    pagination: {
      total,
      count: data.length,
      per_page: 50,
      current_page: 1,
      total_pages: 1,
    },
  },
});

const empty = fixtureState === 'empty';

const overdue = empty
  ? []
  : [
      {
        id: 'inv1',
        number: '2026-0124',
        client_id: 'c1',
        client: client('c1', 'Transportes Exemplo Sul (fictício)'),
        balance: 6800,
        amount: 6800,
        due_date: d(-13),
        partial_due_date: '',
        is_deleted: false,
        archived_at: 0,
      },
      {
        id: 'inv2',
        number: '2026-0127',
        client_id: 'c2',
        client: client('c2', 'Mercado Exemplo (fictício)'),
        balance: 3500,
        amount: 3500,
        due_date: d(-8),
        partial_due_date: '',
        is_deleted: false,
        archived_at: 0,
      },
    ];

const recurring = (
  id: string,
  name: string,
  amount: number,
  offset: number,
  frequency = '5'
) => ({
  id,
  number: `R-${id}`,
  client_id: `c-${id}`,
  client: client(`c-${id}`, name),
  amount,
  balance: amount,
  frequency_id: frequency,
  next_send_date: d(offset),
  next_send_datetime: `${d(offset)}T09:00:00Z`,
  is_deleted: false,
  archived_at: 0,
});

const upcoming = empty
  ? []
  : [
      recurring('1', 'Clínica Exemplo Verde (fictício)', 4200, 0),
      recurring('2', 'Padaria Exemplo (fictício)', 1800, 1),
      recurring('3', 'Escritório Exemplo Lima (fictício)', 2500, 3),
      recurring('4', 'Oficina Exemplo (fictício)', 900, 5, '2'),
      recurring('5', 'Loja Exemplo Norte (fictício)', 5500, 9),
    ];

const top = empty
  ? []
  : [
      recurring('6', 'Transportes Exemplo Sul (fictício)', 6800, 12),
      recurring('5', 'Loja Exemplo Norte (fictício)', 5500, 9),
      recurring('1', 'Clínica Exemplo Verde (fictício)', 4200, 0),
      recurring('7', 'Mercado Exemplo (fictício)', 3500, 20),
      recurring('3', 'Escritório Exemplo Lima (fictício)', 2500, 3),
    ];

const position = empty
  ? { mrr: {}, aging: {} }
  : {
      mrr: { mrr: '47000.00', arr: '564000.00', currency_id: 12 },
      aging: {
        total: '36900.00',
        current_amount: '26600.00',
        outstanding_count: 8,
        currency_id: 12,
      },
    };

const monthTotals = {
  revenue: empty ? {} : { paid_to_date: '10100.00', code: 'BRL' },
  invoices: empty ? {} : { invoiced_amount: '47000.00', code: 'BRL' },
  outstanding: empty
    ? {}
    : { amount: '36900.00', outstanding_count: 8, code: 'BRL' },
  expenses: {},
};

const series = (base: number) =>
  Array.from({ length: 6 }, (_, index) => ({
    date: today
      .subtract(5 - index, 'month')
      .startOf('month')
      .format('YYYY-MM-DD'),
    total: String(empty ? 0 : base + index * 1500),
    currency: BRL,
  }));

function payload(url: string): unknown {
  const path = url.replace(/^https?:\/\/[^/]+/, '');

  if (path.includes('/charts/analytics_totals')) {
    return { currencies: { [BRL]: 'BRL' }, [BRL]: position, 999: position };
  }

  if (path.includes('/charts/totals_v2')) {
    return {
      currencies: { [BRL]: 'BRL' },
      start_date: d(-30),
      end_date: d(0),
      [BRL]: monthTotals,
      999: monthTotals,
    };
  }

  if (path.includes('/charts/chart_summary_v2')) {
    const data = {
      invoices: series(30000),
      payments: series(26000),
      outstanding: series(8000),
      expenses: series(0),
    };

    return {
      start_date: today.subtract(5, 'month').format('YYYY-MM-DD'),
      end_date: d(0),
      [BRL]: data,
      999: data,
    };
  }

  if (path.includes('/invoices') && path.includes('overdue=true')) {
    return paginated(overdue);
  }

  if (path.includes('/recurring_invoices') && path.includes('sort=amount')) {
    return paginated(top);
  }

  if (path.includes('/recurring_invoices')) {
    return paginated(upcoming);
  }

  if (path.includes('/company_gateways')) {
    return paginated(empty ? [] : [{ id: 'gw1' }], empty ? 0 : 1);
  }

  if (path.includes('allberto') || path.includes('per_page=1&page=1')) {
    // Contagens de "Primeiros passos" (clients / recurring_invoices).
    return paginated(empty ? [] : [{ id: 'x' }], empty ? 0 : 12);
  }

  if (path.includes('/clients?') && !path.includes('per_page=1&')) {
    return paginated(
      empty
        ? []
        : [
            {
              ...client('c1', 'Transportes Exemplo Sul (fictício)'),
              number: '0001',
              balance: 6800,
              paid_to_date: 40800,
              contacts: [
                {
                  first_name: 'Ana',
                  last_name: 'Exemplo',
                  email: 'ana@example.test',
                },
              ],
              created_at: 1700000000,
              updated_at: 1700000000,
            },
            {
              ...client('c2', 'Mercado Exemplo (fictício)'),
              number: '0002',
              balance: 0,
              paid_to_date: 21000,
              contacts: [],
              created_at: 1700000000,
              updated_at: 1700000000,
            },
          ]
    );
  }

  if (path.includes('/activities')) {
    return { data: [] };
  }

  return paginated([]);
}

const isDashboardData = (url: string) =>
  /charts\/|invoices|recurring_invoices|activities|payments|quotes|clients|company_gateways/.test(
    url
  );

axios.defaults.adapter = (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';

  if (fixtureState === 'loading' && isDashboardData(url)) {
    return new Promise(() => undefined);
  }

  const analyticsStatus = Number(params.get('analytics'));
  const forced =
    analyticsStatus && url.includes('/charts/analytics_totals')
      ? analyticsStatus
      : 0;

  if (forced || (fixtureState === 'error' && isDashboardData(url))) {
    const response = {
      data: { message: 'fixture error' },
      status: forced || 500,
      statusText: 'Fixture error',
      headers: {},
      config,
    };

    return Promise.reject(
      new AxiosError(
        'Fixture error',
        'ERR_BAD_RESPONSE',
        config,
        null,
        response
      )
    );
  }

  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          data: payload(url),
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
      60
    )
  );
};
