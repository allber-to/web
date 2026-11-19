/**
 * Allberto — regras puras do Painel.
 *
 * Contratos reais usados (Invoice Ninja v5):
 * - POST /api/v1/charts/analytics_totals → por moeda: `mrr` (faturas
 *   recorrentes ativas normalizadas por mês) e `aging` (saldo de faturas
 *   enviadas/parciais: `total`, `current_amount`, faixas vencidas e
 *   `outstanding_count`). Independe do período do histórico.
 * - POST /api/v1/charts/totals_v2 (mês corrente) → `revenue.paid_to_date`.
 * - GET /api/v1/invoices?overdue=true / GET /api/v1/recurring_invoices.
 *
 * Nada aqui inventa dado: ausência/erro vira `null` (indisponível), nunca 0.
 */

import dayjs from 'dayjs';

type Numeric = string | number | null | undefined;

export function toAmount(value: Numeric): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

interface MrrRecord {
  mrr?: Numeric;
  arr?: Numeric;
}

interface AgingRecord {
  total?: Numeric;
  current_amount?: Numeric;
  outstanding_count?: Numeric;
}

export interface AnalyticsTotalsResponse {
  currencies?: Record<string, string>;
  [currencyId: string]:
    | { mrr?: MrrRecord; aging?: AgingRecord }
    | Record<string, string>
    | string
    | undefined;
}

export interface CurrentPosition {
  mrr: number;
  receivable: number;
  overdue: number;
  openInvoices: number;
}

/** Resposta 200 sem registro para a moeda pedida: neutro, nem erro nem zero. */
export const MISSING = 'missing' as const;

export type Read<T> = T | typeof MISSING | null;

function hasCurrencyEntry(response: unknown, key: string) {
  if (!response || typeof response !== 'object' || key === 'currencies') {
    return false;
  }

  const entry = (response as Record<string, unknown>)[key];

  return Boolean(entry) && typeof entry === 'object';
}

/**
 * Moeda da "Posição hoje", na ordem:
 * 1. 999 (todas, convertidas pelo backend) quando escolhida;
 * 2. a preferência, se a resposta tiver essa moeda (escolha explícita válida);
 * 3. a moeda da empresa, se presente — cobre o padrão `1` injetado pelas
 *    preferências em empresas que não usam a moeda 1 (ex.: BRL);
 * 4. `null`: nenhuma das duas existe na resposta.
 * Nunca soma nem converte moedas no cliente.
 */
export function resolvePositionCurrency(
  response: unknown,
  preferred: string | number | null | undefined,
  companyCurrency: string | number | null | undefined
): string | null {
  const wanted =
    preferred === null || preferred === undefined ? '' : String(preferred);

  if (wanted === '999') {
    return '999';
  }

  if (wanted && hasCurrencyEntry(response, wanted)) {
    return wanted;
  }

  const company =
    companyCurrency === null || companyCurrency === undefined
      ? ''
      : String(companyCurrency);

  if (company && hasCurrencyEntry(response, company)) {
    return company;
  }

  return null;
}

/** Código da moeda (ex.: "BRL") anunciado pela própria resposta. */
export function currencyCodeOf(response: unknown, key: string | null) {
  const map = (response as { currencies?: Record<string, string> } | undefined)
    ?.currencies;

  return key && map && typeof map[key] === 'string' ? map[key] : null;
}

/**
 * Posição atual para a moeda escolhida (999 = consolidado convertido pelo
 * backend). A consulta bem-sucedida sem linhas (objeto vazio) significa
 * zero legítimo; resposta ausente ou malformada retorna `null`.
 */
export function readCurrentPosition(
  response: AnalyticsTotalsResponse | undefined,
  currencyId: string | number | null
): Read<CurrentPosition> {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (currencyId === null || !hasCurrencyEntry(response, String(currencyId))) {
    return MISSING;
  }

  const entry = response[String(currencyId)];

  const { mrr, aging } = entry as { mrr?: MrrRecord; aging?: AgingRecord };

  if (!mrr || !aging) {
    return null;
  }

  const total = Object.keys(aging).length ? toAmount(aging.total) : 0;
  const current = Object.keys(aging).length
    ? toAmount(aging.current_amount)
    : 0;
  const monthly = Object.keys(mrr).length ? toAmount(mrr.mrr) : 0;
  const count = Object.keys(aging).length
    ? toAmount(aging.outstanding_count)
    : 0;

  if (total === null || current === null || monthly === null) {
    return null;
  }

  return {
    mrr: monthly,
    receivable: total,
    // Vencido = saldo em aberto cujo vencimento já passou.
    overdue: Math.max(0, roundCents(total - current)),
    openInvoices: count ?? 0,
  };
}

/**
 * Recebido no mês (totals_v2). Moeda presente sem pagamentos → zero
 * legítimo; moeda ausente da resposta → MISSING (neutro).
 */
export function readPaidToDate(
  response: Record<string, unknown> | undefined,
  currencyId: string | number | null
): Read<number> {
  if (!response || typeof response !== 'object') {
    return null;
  }

  if (currencyId === null || !hasCurrencyEntry(response, String(currencyId))) {
    return MISSING;
  }

  const entry = response[String(currencyId)] as {
    revenue?: { paid_to_date?: Numeric };
  };

  if (!entry.revenue || !('paid_to_date' in entry.revenue)) {
    return 0;
  }

  return toAmount(entry.revenue.paid_to_date);
}

function roundCents(value: number) {
  return Math.round(value * 100) / 100;
}

export function percentOf(part: number, whole: number) {
  if (whole <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (part / whole) * 100));
}

interface OverdueInvoiceLike {
  due_date?: string;
  partial_due_date?: string;
  partial?: number;
}

/** Mesmo critério do card original: vencimento da parcela quando houver. */
export function effectiveDueDate(invoice: OverdueInvoiceLike) {
  return invoice.partial_due_date && invoice.partial_due_date.length > 2
    ? invoice.partial_due_date
    : invoice.due_date || '';
}

export function daysOverdue(dueDate: string, today: dayjs.Dayjs = dayjs()) {
  if (!dueDate) {
    return null;
  }

  const diff = today.startOf('day').diff(dayjs(dueDate).startOf('day'), 'day');

  return diff > 0 ? diff : 0;
}

export interface WindowDay {
  date: string;
  isToday: boolean;
}

export function nextDays(today: dayjs.Dayjs, days = 7): WindowDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = today.startOf('day').add(index, 'day');

    return { date: date.format('YYYY-MM-DD'), isToday: index === 0 };
  });
}

interface RecurringLike {
  next_send_date?: string;
}

/**
 * Recorrentes com próxima emissão na janela [hoje, hoje + days).
 * `possiblyPartial` indica que a página buscada acabou ainda dentro da
 * janela — pode haver mais registros além do limite da consulta.
 */
export function withinWindow<T extends RecurringLike>(
  records: T[],
  today: dayjs.Dayjs,
  pageSize: number,
  days = 7
) {
  const start = today.startOf('day');
  const end = start.add(days, 'day');

  const items = records.filter((record) => {
    if (!record.next_send_date) {
      return false;
    }

    const date = dayjs(record.next_send_date);

    return !date.isBefore(start) && date.isBefore(end);
  });

  const last = records[records.length - 1];

  const possiblyPartial =
    records.length >= pageSize &&
    Boolean(last?.next_send_date) &&
    dayjs(last.next_send_date).isBefore(end);

  return { items, possiblyPartial };
}

export type StepStatus = 'done' | 'pending' | 'unknown';

/**
 * Etapa de "Primeiros passos" a partir do total real da paginação.
 * `null`/`undefined` (sem permissão para ver tudo, erro ou consulta não
 * executada) nunca vira "pendente" nem "concluída".
 */
export function stepFromTotal(total: number | null | undefined): StepStatus {
  if (total === null || total === undefined || !Number.isFinite(total)) {
    return 'unknown';
  }

  return total > 0 ? 'done' : 'pending';
}

/** Só mostra o início quando ao menos uma etapa está comprovadamente pendente. */
export function shouldShowOnboarding(steps: StepStatus[]) {
  return steps.includes('pending');
}

export function paginationTotal(payload: unknown): number | null {
  const response = payload as
    | { data?: unknown[]; meta?: { pagination?: { total?: number } } }
    | undefined;

  if (!response || !Array.isArray(response.data)) {
    return null;
  }

  const total = response.meta?.pagination?.total;

  return typeof total === 'number' ? total : response.data.length;
}

interface OverdueRowLike {
  client_id?: string;
  due_date?: string;
  client?: { settings?: { currency_id?: string } };
}

/**
 * Linhas da lista de vencidas que correspondem ao KPI "Em atraso" do
 * backend (aging): mesma moeda (exceto 999) e `due_date` já vencido.
 * Faturas só com a parcela vencida ficam fora, como no aging.
 */
export function overdueRowsForPosition<T extends OverdueRowLike>(
  rows: T[],
  currencyKey: string | null,
  companyCurrency: string | number | undefined,
  today: dayjs.Dayjs = dayjs()
) {
  const start = today.startOf('day');

  return rows.filter((row) => {
    const currency = String(
      row.client?.settings?.currency_id || companyCurrency || ''
    );

    const sameCurrency = currencyKey === '999' || currency === currencyKey;

    return (
      sameCurrency &&
      Boolean(row.due_date) &&
      dayjs(row.due_date).isBefore(start)
    );
  });
}

/** A parcela (partial_due_date) venceu, mas o vencimento final ainda não. */
export function isPartialOnlyOverdue(
  row: { due_date?: string; partial_due_date?: string; partial?: number },
  today: dayjs.Dayjs = dayjs()
) {
  const start = today.startOf('day');
  const partialDue =
    row.partial_due_date && row.partial_due_date.length > 2
      ? dayjs(row.partial_due_date)
      : null;

  return Boolean(
    partialDue &&
      partialDue.isBefore(start) &&
      Number(row.partial) > 0 &&
      (!row.due_date || !dayjs(row.due_date).isBefore(start))
  );
}
