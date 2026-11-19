import { createElement } from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  analytics: {} as Record<string, unknown>,
  month: {} as Record<string, unknown>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => [
    (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
    { language: 'pt_BR' },
  ],
}));

vi.mock('$app/common/hooks/useCurrentCompany', () => ({
  useCurrentCompany: () => ({
    settings: { country_id: '76', currency_id: '12' },
  }),
}));

vi.mock('$app/common/hooks/useCurrentCompanyDateFormats', () => ({
  useCurrentCompanyDateFormats: () => ({ dateFormat: 'DD/MM/YYYY' }),
}));

vi.mock('$app/common/hooks/useCompanyTimeFormat', () => ({
  useCompanyTimeFormat: () => ({ timeFormat: 'HH:mm' }),
}));

vi.mock('$app/components/layouts/common/privacy', () => ({
  useHideValues: () => false,
}));

vi.mock('$app/pages/dashboard/hooks/useDashboardFormatMoney', () => ({
  useDashboardFormatMoney:
    () => (value: number, _c: string, currency: string) =>
      `${currency}:${value}`,
}));

vi.mock('$app/pages/dashboard/hooks/useAllbertoQueries', () => ({
  OVERDUE_PAGE_SIZE: 50,
  useAnalyticsTotals: () => state.analytics,
  useMonthTotals: () => state.month,
  useOverdueInvoices: () => ({
    data: { data: [], meta: {} },
    refetch: vi.fn(),
  }),
}));

vi.mock('$app/pages/dashboard/components/allberto/States', () => ({
  Skeleton: () => null,
  ErrorState: () => createElement('div', { role: 'alert' }, 'erro'),
}));

import { PositionToday } from '../../src/pages/dashboard/components/allberto/PositionToday';

const query = (data: unknown, extra: Record<string, unknown> = {}) => ({
  data,
  isLoading: false,
  isSuccess: data !== undefined,
  isFetching: false,
  dataUpdatedAt: 1,
  error: undefined,
  refetch: vi.fn(),
  ...extra,
});

const brlAnalytics = {
  currencies: { '12': 'BRL' },
  '12': {
    mrr: { mrr: '47000' },
    aging: { total: '36900', current_amount: '26600', outstanding_count: 8 },
  },
  '999': {
    mrr: { mrr: '47000' },
    aging: { total: '36900', current_amount: '26600' },
  },
};

function render(currencyId: number) {
  let renderer: ReactTestRenderer;

  act(() => {
    renderer = create(createElement(PositionToday, { currencyId }));
  });

  const root = renderer!.root;
  const text = JSON.stringify(renderer!.toJSON());
  const alerts = root.findAll((node) => node.props.role === 'alert');

  act(() => renderer.unmount());

  return { text, alerts: alerts.length };
}

describe('PositionToday: moeda', () => {
  beforeEach(() => {
    state.analytics = query(brlAnalytics);
    state.month = query(undefined, {
      isError: true,
      error: new Error('histórico/totais indisponível'),
    });
  });

  test('empresa BRL com padrão 1 e totais do mês indisponíveis: KPIs prontos em BRL', () => {
    const { text, alerts } = render(1);

    expect(text).toContain('12:47000');
    expect(text).toContain('12:10300');
    expect(text).toContain('BRL');
    // Só o cartão "Recebido" (consulta que falhou) mostra erro.
    expect(alerts).toBe(1);
  });

  test('moeda explícita válida é respeitada', () => {
    state.analytics = query({
      ...brlAnalytics,
      currencies: { '12': 'BRL', '2': 'USD' },
      '2': { mrr: { mrr: '500' }, aging: { total: '0', current_amount: '0' } },
    });

    expect(render(2).text).toContain('2:500');
  });

  test('moeda ausente na resposta 200: neutro, sem alerta e sem zero', () => {
    state.analytics = query({
      currencies: { '2': 'USD' },
      '2': { mrr: { mrr: '500' }, aging: { total: '0', current_amount: '0' } },
    });
    state.month = query({ currencies: { '2': 'USD' }, '2': { revenue: {} } });

    const { text, alerts } = render(1);

    expect(alerts).toBe(0);
    expect(text).toContain('allberto_currency_no_data');
    expect(text).not.toMatch(/"[0-9]+:0"/);
  });
});
