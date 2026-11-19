/**
 * Allberto — "Precisa de ação", "Próximas cobranças" e "Maiores contratos".
 *
 * Ações usam somente fluxos reais e protegidos do Ninja (abrir fatura,
 * tela de envio de e-mail com pré-visualização). Nada é enviado ou cobrado
 * a partir do Painel e não há "desfazer" fictício.
 */

import classNames from 'classnames';
import dayjs from 'dayjs';
import { AlertTriangle, Mail } from 'react-feather';
import { useTranslation } from 'react-i18next';
import frequencies from '$app/common/constants/recurring-invoices-frequency';
import { route } from '$app/common/helpers/route';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { useDisableNavigation } from '$app/common/hooks/useDisableNavigation';
import { useInvoiceEditorPaths } from '$app/common/hooks/useInvoiceEditor';
import { Invoice } from '$app/common/interfaces/invoice';
import { RecurringInvoice } from '$app/common/interfaces/recurring-invoice';
import { DynamicLink } from '$app/components/DynamicLink';
import { NavLink } from '$app/components/layouts/components/SidebarItem';
import {
  daysOverdue,
  effectiveDueDate,
  isPartialOnlyOverdue,
  nextDays,
  withinWindow,
} from '../../helpers/allberto-dashboard';
import { pluralKey } from '../../helpers/allberto-i18n';
import {
  OVERDUE_PAGE_SIZE,
  UPCOMING_PAGE_SIZE,
  useOverdueInvoices,
  useTopContracts,
  useUpcomingRecurring,
} from '../../hooks/useAllbertoQueries';
import { useDashboardFormatMoney } from '../../hooks/useDashboardFormatMoney';
import {
  DashboardSection,
  EmptyState,
  ErrorState,
  LoadingRows,
} from './States';

type Money = ReturnType<typeof useDashboardFormatMoney>;

function clientMoney(
  formatMoney: Money,
  value: number,
  record: {
    client?: { country_id?: string; settings?: { currency_id?: string } };
  }
) {
  return formatMoney(
    value,
    record.client?.country_id,
    record.client?.settings?.currency_id
  );
}

export function NeedsAction() {
  const [t, i18n] = useTranslation();
  const formatMoney = useDashboardFormatMoney();
  const hasPermission = useHasPermission();
  const disableNavigation = useDisableNavigation();
  const invoicePaths = useInvoiceEditorPaths();
  const { dateFormat } = useCurrentCompanyDateFormats();

  const overdue = useOverdueInvoices();

  const invoices: Invoice[] = overdue.data?.data ?? [];
  const total = overdue.data?.meta?.pagination?.total ?? invoices.length;

  return (
    <DashboardSection
      id="ab-needs-action"
      title={
        <>
          {t('allberto_needs_action')}
          {overdue.isSuccess && total > 0 && (
            <span className="ab-pill ab-pill--danger ab-num">{total}</span>
          )}
        </>
      }
      description={t('allberto_needs_action_hint')}
      action={
        <NavLink to="/invoices" className="ab-btn ab-btn--secondary">
          {t('allberto_view_invoices')}
        </NavLink>
      }
    >
      {overdue.isLoading && <LoadingRows label={t('loading')} />}

      {overdue.isError && (
        <ErrorState
          error={overdue.error}
          onRetry={() => overdue.refetch()}
          isRetrying={overdue.isFetching}
        />
      )}

      {overdue.isSuccess && invoices.length === 0 && (
        <EmptyState>{t('allberto_nothing_pending')}</EmptyState>
      )}

      {overdue.isSuccess && invoices.length > 0 && (
        <div className="ab-scroll-y" style={{ maxHeight: 520 }}>
          <table className="ab-table">
            <thead>
              <tr>
                <th scope="col">{t('client')}</th>
                <th scope="col" className="ab-r">
                  {t('balance')}
                </th>
                <th scope="col">{t('due_date')}</th>
                <th scope="col">
                  <span className="sr-only">{t('actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const due = effectiveDueDate(invoice);
                const late = daysOverdue(due);
                const partialOnly = isPartialOnlyOverdue(invoice);

                return (
                  <tr key={invoice.id}>
                    <td>
                      <DynamicLink
                        to={route('/clients/:id', { id: invoice.client_id })}
                        renderSpan={disableNavigation('client', invoice.client)}
                        className="ab-lnk"
                      >
                        {invoice.client?.display_name}
                      </DynamicLink>
                      <div className="ab-sub">
                        <DynamicLink
                          to={route(invoicePaths.edit, { id: invoice.id })}
                          renderSpan={disableNavigation('invoice', invoice)}
                        >
                          {t('invoice')} {invoice.number}
                        </DynamicLink>
                      </div>
                    </td>
                    <td className="ab-r ab-num font-semibold">
                      {clientMoney(formatMoney, invoice.balance, invoice)}
                      {partialOnly && (
                        <div className="ab-sub font-normal">
                          {t('allberto_partial_amount', {
                            amount: clientMoney(
                              formatMoney,
                              invoice.partial,
                              invoice
                            ),
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      {partialOnly && (
                        <span className="ab-pill ab-pill--warn">
                          {t('allberto_partial_overdue')}
                        </span>
                      )}
                      <div className="ab-num">
                        {due ? dayjs(due).format(dateFormat) : '—'}
                      </div>
                      {late !== null && late > 0 && (
                        <div
                          className="ab-sub inline-flex items-center gap-1"
                          style={{ color: 'var(--ab-danger)' }}
                        >
                          <AlertTriangle size={12} aria-hidden="true" />
                          {t(
                            pluralKey(
                              'allberto_days_late',
                              late,
                              i18n.language
                            ),
                            { n: late }
                          )}
                        </div>
                      )}
                    </td>
                    <td className="ab-r">
                      {hasPermission('edit_invoice') &&
                        !disableNavigation('invoice', invoice) && (
                          <NavLink
                            to={route('/invoices/:id/email', {
                              id: invoice.id,
                            })}
                            className="ab-btn ab-btn--secondary ab-btn--sm"
                            label={`${t('email_invoice')} ${invoice.number}`}
                          >
                            <Mail size={14} aria-hidden="true" />
                            {t('allberto_notify_client')}
                          </NavLink>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {total > invoices.length && (
            <p className="ab-sub px-[18px] py-3">
              {t('allberto_showing_of', {
                shown: Math.min(invoices.length, OVERDUE_PAGE_SIZE),
                total,
              })}
            </p>
          )}
        </div>
      )}
    </DashboardSection>
  );
}

export function UpcomingCharges() {
  const [t, i18n] = useTranslation();
  const formatMoney = useDashboardFormatMoney();
  const disableNavigation = useDisableNavigation();
  const { dateFormat } = useCurrentCompanyDateFormats();

  const upcoming = useUpcomingRecurring();

  const today = dayjs();
  const days = nextDays(today);
  const { items, possiblyPartial } = withinWindow(
    upcoming.data?.data ?? [],
    today,
    UPCOMING_PAGE_SIZE
  );

  return (
    <DashboardSection
      id="ab-upcoming"
      title={t('allberto_upcoming_charges')}
      description={t('allberto_upcoming_hint')}
      action={
        <NavLink to="/recurring_invoices" className="ab-btn ab-btn--secondary">
          {t('recurring_invoices')}
        </NavLink>
      }
    >
      {upcoming.isLoading && <LoadingRows label={t('loading')} />}

      {upcoming.isError && (
        <ErrorState
          error={upcoming.error}
          onRetry={() => upcoming.refetch()}
          isRetrying={upcoming.isFetching}
        />
      )}

      {upcoming.isSuccess && (
        <>
          <ol
            className="ab-cal"
            aria-label={t('allberto_next_7_days') as string}
          >
            {days.map((day) => {
              const count = items.filter(
                (item) => item.next_send_date === day.date
              ).length;

              return (
                <li
                  key={day.date}
                  className={classNames('ab-cal-day', {
                    'ab-cal-day--today': day.isToday,
                  })}
                >
                  <span className="ab-lab">
                    {dayjs(day.date).format('ddd')}
                  </span>
                  <span className="ab-num font-semibold">
                    {dayjs(day.date).format('DD/MM')}
                  </span>
                  <span className="ab-sub">
                    {t(
                      pluralKey('allberto_charges_count', count, i18n.language),
                      { n: count }
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          {items.length === 0 ? (
            <EmptyState>{t('allberto_no_upcoming')}</EmptyState>
          ) : (
            <table className="ab-table">
              <thead>
                <tr>
                  <th scope="col">{t('date')}</th>
                  <th scope="col">{t('client')}</th>
                  <th scope="col" className="ab-dk">
                    {t('frequency')}
                  </th>
                  <th scope="col" className="ab-r">
                    {t('amount')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((record: RecurringInvoice) => (
                  <tr key={record.id}>
                    <td className="ab-num">
                      {dayjs(record.next_send_date).format(dateFormat)}
                    </td>
                    <td>
                      <DynamicLink
                        to={route('/recurring_invoices/:id/edit', {
                          id: record.id,
                        })}
                        renderSpan={disableNavigation(
                          'recurring_invoice',
                          record
                        )}
                        className="ab-lnk"
                      >
                        {record.client?.display_name}
                      </DynamicLink>
                      <div className="ab-sub">{record.number}</div>
                    </td>
                    <td className="ab-dk ab-sub">
                      {t(
                        frequencies[
                          record.frequency_id as keyof typeof frequencies
                        ] ?? ''
                      )}
                    </td>
                    <td className="ab-r ab-num font-semibold">
                      {clientMoney(formatMoney, record.amount, record)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {possiblyPartial && (
            <p className="ab-sub px-[18px] py-3">
              {t('allberto_partial_list', {
                n: UPCOMING_PAGE_SIZE,
              })}
            </p>
          )}
        </>
      )}
    </DashboardSection>
  );
}

export function TopContracts() {
  const [t, i18n] = useTranslation();
  const formatMoney = useDashboardFormatMoney();
  const disableNavigation = useDisableNavigation();

  const top = useTopContracts();
  const records: RecurringInvoice[] = top.data?.data ?? [];

  return (
    <DashboardSection
      id="ab-top-contracts"
      title={t('allberto_top_contracts')}
      description={t('allberto_top_contracts_hint')}
      action={
        <NavLink to="/clients" className="ab-btn ab-btn--secondary">
          {t('clients')}
        </NavLink>
      }
    >
      {top.isLoading && <LoadingRows label={t('loading')} rows={5} />}

      {top.isError && (
        <ErrorState
          error={top.error}
          onRetry={() => top.refetch()}
          isRetrying={top.isFetching}
        />
      )}

      {top.isSuccess && records.length === 0 && (
        <EmptyState>{t('allberto_no_contracts')}</EmptyState>
      )}

      {top.isSuccess && records.length > 0 && (
        <ul className="ab-rank">
          {records.map((record) => (
            <li key={record.id}>
              <div className="min-w-0">
                <DynamicLink
                  to={route('/clients/:id', { id: record.client_id })}
                  renderSpan={disableNavigation('client', record.client)}
                  className="ab-lnk"
                >
                  {record.client?.display_name}
                </DynamicLink>
                <div className="ab-sub">
                  {record.number} ·{' '}
                  {t(
                    frequencies[
                      record.frequency_id as keyof typeof frequencies
                    ] ?? ''
                  )}
                </div>
              </div>
              <span className="ab-num font-semibold">
                {clientMoney(formatMoney, record.amount, record)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
