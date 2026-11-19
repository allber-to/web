/**
 * Allberto — classificação HTTP das consultas do Painel.
 *
 * O cliente padrão de `request()` intercepta 403/404 (toast) e resolve com
 * `undefined`, perdendo o status. Consultas que precisam distinguir
 * "sem permissão" de "recurso inexistente nesta versão do servidor" usam
 * `skipIntercept: true` (mesmo padrão de project-analytics e
 * useTaskMetricFieldsSupport) e rejeitam com o AxiosError original.
 */

import type { AxiosError } from 'axios';

export type HttpErrorKind =
  | 'forbidden'
  | 'unsupported'
  | 'unauthenticated'
  | 'handled'
  | 'other';

export const HANDLED_HTTP_ERROR = 'AllbertoHandledHttpError';

export function httpStatusOf(error: unknown): number | undefined {
  return (error as AxiosError | undefined)?.response?.status;
}

export function classifyHttpError(error: unknown): HttpErrorKind {
  if ((error as Error | undefined)?.name === HANDLED_HTTP_ERROR) {
    return 'handled';
  }

  const status = httpStatusOf(error);

  if (status === 403) {
    return 'forbidden';
  }

  if (status === 404 || status === 405) {
    return 'unsupported';
  }

  if (status === 401) {
    return 'unauthenticated';
  }

  return 'other';
}

/** Repetição automática só para falhas transitórias (até 2 novas tentativas). */
export function shouldRetryDashboardQuery(
  failureCount: number,
  error: unknown
) {
  return classifyHttpError(error) === 'other' && failureCount < 2;
}

/**
 * Resposta `undefined` do cliente interceptado significa que o interceptor
 * já tratou um erro (403/404/…): nunca tratar como dado vazio.
 */
export function requireResponseData<T>(response: { data: T } | undefined): T {
  if (!response) {
    const error = new Error('Request handled by the global interceptor');
    error.name = HANDLED_HTTP_ERROR;
    throw error;
  }

  return response.data;
}
