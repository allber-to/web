/**
 * Allberto — "Posição hoje": quatro indicadores que NÃO mudam com o
 * período do histórico. Fontes reais documentadas em
 * helpers/allberto-dashboard.ts.
 */

import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { AlertTriangle, Info, RefreshCw } from 'react-feather';
import { useTranslation } from 'react-i18next';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { useCompanyTimeFormat } from '$app/common/hooks/useCompanyTimeFormat';
import { useHideValues } from '$app/components/layouts/common/privacy';
import {
  CurrentPosition,
  currencyCodeOf,
  MISSING,
  overdueRowsForPosition,
  percentOf,
  Read,
  readCurrentPosition,
  readPaidToDate,
  resolvePositionCurrency,
} from '../../helpers/allberto-dashboard';
import { pluralKey } from '../../helpers/allberto-i18n';
import {
  OVERDUE_PAGE_SIZE,
  useAnalyticsTotals,
  useMonthTotals,
  useOverdueInvoices,
} from '../../hooks/useAllbertoQueries';
import { useDashboardFormatMoney } from '../../hooks/useDashboardFormatMoney';
import { ErrorState, Skeleton } from './States';

interface KpiProps {
  label: string;
  value?: ReactNode;
  tone?: 'danger';
  badge?: ReactNode;
  children?: ReactNode;
  state: 'loading' | 'error' | 'ready' | 'empty';
  error?: ReactNode;
  emptyText?: ReactNode;
}

function Kpi(props: KpiProps) {
  return (
    <article
      className="ab-card ab-kpi flex flex-col gap-2 min-w-0"
      aria-busy={props.state === 'loading'}
    >
      <h3 className="ab-lab">{props.label}</h3>

      {props.state === 'loading' && (
        <>
          <Skeleton width="60%" height={28} />
          <Skeleton width="80%" />
        </>
      )}

      {props.state === 'error' && props.error}

      {props.state === 'empty' && <p className="ab-sub">{props.emptyText}</p>}

      {props.state === 'ready' && (
        <>
          {props.badge}
          <p
            className="ab-kpi-val ab-num flex items-center gap-2"
            style={{
              color: props.tone === 'danger' ? 'var(--ab-danger)' : undefined,
            }}
          >
            {props.tone === 'danger' && (
              <AlertTriangle size={20} aria-hidden="true" />
            )}
            <span className="min-w-0 break-words">{props.value}</span>
          </p>
          {props.children}
        </>
      )}
    </article>
  );
}

function Meter(props: { segments: { percent: number; color: string }[] }) {
  return (
    <div className="ab-meter" aria-hidden="true">
      {props.segments.map((segment, index) => (
        <span
          key={index}
          style={{ width: `${segment.percent}%`, background: segment.color }}
        />
      ))}
    </div>
  );
}

interface Props {
  currencyId: number;
}

export function PositionToday(props: Props) {
  const [t, i18n] = useTranslation();
  const company = useCurrentCompany();
  const formatMoney = useDashboardFormatMoney();
  const hidden = useHideValues();
  const { dateFormat } = useCurrentCompanyDateFormats();
  const { timeFormat } = useCompanyTimeFormat();

  const analytics = useAnalyticsTotals();
  const month = useMonthTotals();
  const overdue = useOverdueInvoices();

  const companyCurrency = company?.settings.currency_id;

  // Moeda resolvida a partir da própria resposta (não depende do Histórico).
  const currencyKey =
    resolvePositionCurrency(
      analytics.data,
      props.currencyId,
      companyCurrency
    ) ?? resolvePositionCurrency(month.data, props.currencyId, companyCurrency);

  const currencyCode =
    currencyKey === '999'
      ? t('all')
      : (currencyCodeOf(analytics.data, currencyKey) ??
        currencyCodeOf(month.data, currencyKey));

  const money = (value: number) =>
    formatMoney(
      value,
      company?.settings.country_id,
      currencyKey ?? undefined,
      2
    );

  const positionRead: Read<CurrentPosition> = readCurrentPosition(
    analytics.data,
    currencyKey
  );
  const paidRead: Read<number> = readPaidToDate(month.data, currencyKey);

  const position =
    positionRead && positionRead !== MISSING ? positionRead : null;
  const paid = typeof paidRead === 'number' ? paidRead : null;

  const stateOf = (isLoading: boolean, read: unknown) =>
    isLoading
      ? 'loading'
      : read === MISSING
        ? 'empty'
        : read !== null
          ? 'ready'
          : 'error';

  const analyticsState = stateOf(analytics.isLoading, positionRead);
  const paidState = stateOf(month.isLoading, paidRead);

  const emptyText = t('allberto_currency_no_data');

  const retry = () => {
    analytics.refetch();
    month.refetch();
    overdue.refetch();
  };

  const isFetching = analytics.isFetching || month.isFetching;

  const updatedAt = Math.max(analytics.dataUpdatedAt, month.dataUpdatedAt);

  const analyticsError = (
    <ErrorState
      error={analytics.error}
      onRetry={() => analytics.refetch()}
      isRetrying={analytics.isFetching}
      notSupportedMessage={t('allberto_analytics_unsupported') as string}
    />
  );

  // A lista de vencidas vem ordenada por vencimento: o primeiro item é o
  // mais antigo mesmo quando a lista é parcial.
  // Só as linhas equivalentes ao KPI: mesma moeda e vencimento final passado.
  const overdueRows = overdueRowsForPosition(
    overdue.data?.data ?? [],
    currencyKey,
    companyCurrency
  );
  const oldest = overdueRows[0];
  const overdueTotal = overdue.data?.meta?.pagination?.total;
  const overdueComplete =
    overdue.data !== undefined &&
    (overdueTotal ?? overdue.data.data.length) <= OVERDUE_PAGE_SIZE;
  const overdueClients = overdueComplete
    ? new Set(overdueRows.map((invoice) => invoice.client_id)).size
    : null;

  const monthName = dayjs().format('MMMM');

  return (
    <section aria-labelledby="ab-position" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id="ab-position" className="ab-h2">
          {t('allberto_position_today')}
        </h2>

        {updatedAt > 0 && (
          <span className="ab-sub ab-num">
            {dayjs(updatedAt).format(`${dateFormat} ${timeFormat}`)}
          </span>
        )}

        <span className="ab-sub inline-flex items-center gap-1">
          <Info size={12} aria-hidden="true" />
          {t('allberto_position_hint')}
        </span>

        {currencyCode && (
          <span className="ab-pill">
            {t('currency')}: {currencyCode}
          </span>
        )}

        <button
          type="button"
          className="ab-link-btn"
          onClick={retry}
          disabled={isFetching}
          aria-busy={isFetching}
        >
          <RefreshCw size={12} aria-hidden="true" />
          {t('refresh')}
        </button>
      </div>

      <div className="ab-kpis">
        <Kpi
          label={t('allberto_mrr')}
          state={analyticsState}
          error={analyticsError}
          emptyText={emptyText}
          badge={
            <span className="ab-pill self-start">{t('allberto_forecast')}</span>
          }
          value={position ? money(position.mrr) : null}
        >
          <p className="ab-sub">{t('allberto_mrr_hint')}</p>
        </Kpi>

        <Kpi
          label={t('allberto_paid_in_month', {
            month: monthName,
          })}
          state={paidState}
          error={
            <ErrorState
              error={month.error}
              onRetry={() => month.refetch()}
              isRetrying={month.isFetching}
            />
          }
          emptyText={emptyText}
          value={paid !== null ? money(paid) : null}
        >
          <p className="ab-sub">{t('allberto_paid_hint')}</p>
        </Kpi>

        <Kpi
          label={t('allberto_receivable')}
          state={analyticsState}
          error={analyticsError}
          emptyText={emptyText}
          value={position ? money(position.receivable) : null}
        >
          {position && (
            <>
              <p className="ab-sub">
                {t(
                  pluralKey(
                    'allberto_receivable_hint',
                    position.openInvoices,
                    i18n.language
                  ),
                  {
                    n: position.openInvoices,
                    overdue: money(position.overdue),
                  }
                )}
              </p>
              {!hidden && position.receivable > 0 && (
                <Meter
                  segments={[
                    {
                      percent: percentOf(
                        position.receivable - position.overdue,
                        position.receivable
                      ),
                      color: 'var(--ab-bar)',
                    },
                    {
                      percent: percentOf(position.overdue, position.receivable),
                      color: 'var(--ab-danger)',
                    },
                  ]}
                />
              )}
            </>
          )}
        </Kpi>

        <Kpi
          label={t('allberto_overdue')}
          state={analyticsState}
          error={analyticsError}
          emptyText={emptyText}
          tone={position && position.overdue > 0 ? 'danger' : undefined}
          value={position ? money(position.overdue) : null}
        >
          {position && position.overdue > 0 && (
            <p className="ab-sub" style={{ color: 'var(--ab-danger)' }}>
              {[
                overdueClients !== null &&
                  t(
                    pluralKey(
                      'allberto_overdue_clients',
                      overdueClients,
                      i18n.language
                    ),
                    { n: overdueClients }
                  ),
                oldest &&
                  t('allberto_oldest_due', {
                    date: dayjs(oldest.due_date).format(dateFormat),
                  }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </Kpi>
      </div>

      {analytics.isSuccess && currencyKey === '999' && position !== null && (
        <p className="ab-sub">{t('allberto_all_currencies_hint')}</p>
      )}
    </section>
  );
}
