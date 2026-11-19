/**
 * Allberto — consultas reais do Painel. Mesmas chaves em todos os
 * consumidores para o React Query deduplicar requisições.
 */

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { Invoice } from '$app/common/interfaces/invoice';
import { RecurringInvoice } from '$app/common/interfaces/recurring-invoice';
import type { AnalyticsTotalsResponse } from '../helpers/allberto-dashboard';
import {
  requireResponseData,
  shouldRetryDashboardQuery,
} from '../helpers/allberto-http';

export const OVERDUE_PAGE_SIZE = 50;
export const UPCOMING_PAGE_SIZE = 50;
export const TOP_CONTRACTS_SIZE = 5;

const FIVE_MINUTES = 5 * 60 * 1000;

function currentMonthBody() {
  return {
    start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
    end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
    date_range: 'this_month',
  };
}

interface Paginated<T> {
  data: T[];
  meta?: { pagination?: { total?: number } };
}

/** MRR + aging (posição atual, sem filtro de período). */
export function fetchAnalyticsTotals(url: string, body: object) {
  // skipIntercept: preserva o status HTTP (403/404) para classificar o erro.
  return request('POST', url, body, { skipIntercept: true }).then(
    (response) => response.data as AnalyticsTotalsResponse
  );
}

export function useAnalyticsTotals() {
  const body = currentMonthBody();

  return useQuery({
    queryKey: ['/api/v1/charts/analytics_totals', body],
    queryFn: () =>
      fetchAnalyticsTotals(endpoint('/api/v1/charts/analytics_totals'), body),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
  });
}

/** Recebido no mês corrente (totals_v2 com o mês fixo, não o do histórico). */
export function useMonthTotals() {
  const body = currentMonthBody();

  return useQuery({
    queryKey: ['/api/v1/charts/totals_v2', body, false],
    queryFn: () =>
      request(
        'POST',
        endpoint('/api/v1/charts/totals_v2?include_drafts=:includeDrafts', {
          includeDrafts: false,
        }),
        body
      ).then(
        (response) => requireResponseData(response) as Record<string, unknown>
      ),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
  });
}

export function useOverdueInvoices(enabled = true) {
  return useQuery({
    queryKey: ['/api/v1/invoices', 'allberto-overdue', OVERDUE_PAGE_SIZE],
    queryFn: () =>
      request(
        'GET',
        endpoint(
          '/api/v1/invoices?include=client&overdue=true&without_deleted_clients=true&per_page=:perPage&page=1&sort=due_date|asc',
          { perPage: OVERDUE_PAGE_SIZE }
        )
      ).then((response) => requireResponseData(response) as Paginated<Invoice>),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
    enabled,
  });
}

export function useUpcomingRecurring(enabled = true) {
  return useQuery({
    queryKey: [
      '/api/v1/recurring_invoices',
      'allberto-upcoming',
      UPCOMING_PAGE_SIZE,
    ],
    queryFn: () =>
      request(
        'GET',
        endpoint(
          '/api/v1/recurring_invoices?include=client&client_status=active&without_deleted_clients=true&per_page=:perPage&page=1&sort=next_send_date_client|asc',
          { perPage: UPCOMING_PAGE_SIZE }
        )
      ).then(
        (response) =>
          requireResponseData(response) as Paginated<RecurringInvoice>
      ),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
    enabled,
  });
}

export function useTopContracts(enabled = true) {
  return useQuery({
    queryKey: [
      '/api/v1/recurring_invoices',
      'allberto-top',
      TOP_CONTRACTS_SIZE,
    ],
    queryFn: () =>
      request(
        'GET',
        endpoint(
          '/api/v1/recurring_invoices?include=client&client_status=active&without_deleted_clients=true&per_page=:perPage&page=1&sort=amount|desc',
          { perPage: TOP_CONTRACTS_SIZE }
        )
      ).then(
        (response) =>
          requireResponseData(response) as Paginated<RecurringInvoice>
      ),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
    enabled,
  });
}

/** Total real (paginação) de registros não excluídos — 1 item por página. */
export function useEntityTotal(
  resource: 'clients' | 'recurring_invoices',
  enabled: boolean
) {
  return useQuery({
    queryKey: [`/api/v1/${resource}`, 'allberto-total'],
    queryFn: () =>
      request(
        'GET',
        endpoint(`/api/v1/${resource}?status=active,archived&per_page=1&page=1`)
      ).then((response) => requireResponseData(response) as unknown),
    staleTime: FIVE_MINUTES,
    retry: shouldRetryDashboardQuery,
    enabled,
  });
}
