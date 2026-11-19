import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import {
  classifyHttpError,
  HANDLED_HTTP_ERROR,
  requireResponseData,
  shouldRetryDashboardQuery,
} from '../../src/pages/dashboard/helpers/allberto-http';

vi.mock('$app/common/helpers/toast/toast', () => ({
  toast: { error: vi.fn(), processing: vi.fn(), success: vi.fn() },
}));

const calls: string[] = [];
let nextStatus = 200;

// Adapter real do axios substituído ANTES de request.ts criar seus clientes.
axios.defaults.adapter = (config: InternalAxiosRequestConfig) => {
  calls.push(config.url ?? '');

  if (nextStatus >= 400) {
    return Promise.reject(
      new AxiosError(`HTTP ${nextStatus}`, 'ERR_BAD_REQUEST', config, null, {
        data: { message: 'x' },
        status: nextStatus,
        statusText: String(nextStatus),
        headers: {},
        config,
      })
    );
  }

  return Promise.resolve({
    data: { '1': { mrr: {}, aging: {} } },
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
};

let fetchAnalyticsTotals: (url: string, body: object) => Promise<unknown>;
let request: typeof import('../../src/common/helpers/request').request;

beforeAll(async () => {
  const storage = {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
    clear: () => undefined,
  };
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('sessionStorage', storage);
  ({ fetchAnalyticsTotals } = await import(
    '../../src/pages/dashboard/hooks/useAllbertoQueries'
  ));
  ({ request } = await import('../../src/common/helpers/request'));
});

describe('analytics_totals com request real', () => {
  test.each([
    [404, 'unsupported'],
    [403, 'forbidden'],
  ])('HTTP %i rejeita com o status preservado e não repete', async (status, kind) => {
    nextStatus = status;
    calls.length = 0;

    const error = await fetchAnalyticsTotals(
      '/api/v1/charts/analytics_totals',
      {}
    ).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AxiosError);
    expect(classifyHttpError(error)).toBe(kind);
    expect(shouldRetryDashboardQuery(0, error)).toBe(false);
    expect(calls).toHaveLength(1);
  });

  test('200 devolve os dados', async () => {
    nextStatus = 200;

    await expect(
      fetchAnalyticsTotals('/api/v1/charts/analytics_totals', {})
    ).resolves.toEqual({ '1': { mrr: {}, aging: {} } });
  });

  test('500 é transitório: até 2 novas tentativas', async () => {
    nextStatus = 500;

    const error = await fetchAnalyticsTotals('/x', {}).catch(
      (reason) => reason
    );

    expect(classifyHttpError(error)).toBe('other');
    expect(shouldRetryDashboardQuery(0, error)).toBe(true);
    expect(shouldRetryDashboardQuery(2, error)).toBe(false);
  });
});

describe('cliente interceptado (demais consultas do Painel)', () => {
  test('403 tratado pelo interceptor vira erro "handled", nunca dado vazio', async () => {
    nextStatus = 403;

    const response = await request('GET', '/api/v1/invoices');

    expect(response).toBeUndefined();

    let thrown: unknown;
    try {
      requireResponseData(response);
    } catch (error) {
      thrown = error;
    }

    expect((thrown as Error).name).toBe(HANDLED_HTTP_ERROR);
    expect(classifyHttpError(thrown)).toBe('handled');
    expect(shouldRetryDashboardQuery(0, thrown)).toBe(false);
  });
});
