import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, test } from 'vitest';
import {
  keys,
  type RefetchKey,
  useRefetch,
} from '../../src/common/hooks/useRefetch';

const ANALYTICS = [
  '/api/v1/charts/analytics_totals',
  {
    start_date: '2026-11-01',
    end_date: '2026-11-30',
    date_range: 'this_month',
  },
];

function invalidateWith(resource: RefetchKey) {
  const client = new QueryClient();
  client.setQueryData(ANALYTICS, { currencies: {} });
  client.setQueryData(['/api/v1/products'], []);

  let refetch: ReturnType<typeof useRefetch> | undefined;

  function Probe() {
    refetch = useRefetch();
    return null;
  }

  act(() => {
    create(
      createElement(QueryClientProvider, { client }, createElement(Probe))
    );
  });

  act(() => refetch!([resource]));

  return {
    analytics: client.getQueryState(ANALYTICS)?.isInvalidated,
    unrelated: client.getQueryState(['/api/v1/products'])?.isInvalidated,
  };
}

describe('useRefetch invalida a posição do Painel', () => {
  test.each([
    'invoices',
    'payments',
    'recurring_invoices',
    'clients',
    'credits',
  ] as RefetchKey[])('%s → analytics_totals', (resource) => {
    expect(keys[resource].dependencies).toContain(
      '/api/v1/charts/analytics_totals'
    );
    expect(invalidateWith(resource)).toEqual({
      analytics: true,
      unrelated: false,
    });
  });

  test('recurso sem relação não invalida analytics_totals', () => {
    expect(invalidateWith('tax_rates').analytics).toBe(false);
  });
});
