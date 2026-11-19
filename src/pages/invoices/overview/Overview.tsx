/**
 * Invoice Ninja (https://invoiceninja.com).
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';
import { date } from '$app/common/helpers';
import { sanitizeHTML } from '$app/common/helpers/html-string';
import { route } from '$app/common/helpers/route';
import { useFormatMoney } from '$app/common/hooks/money/useFormatMoney';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { useDisableNavigation } from '$app/common/hooks/useDisableNavigation';
import { Card } from '$app/components/cards';
import { DynamicLink } from '$app/components/DynamicLink';
import { Button, Link } from '$app/components/forms';
import { InvoiceStatus } from '../common/components/InvoiceStatus';
import { Context } from '../edit/Edit';
import Activities from '../edit/components/Activities';
import Payments from '../edit/components/Payments';

export default function Overview() {
  const { persistedInvoice: invoice } = useOutletContext<Context>();
  const [t] = useTranslation();
  const formatMoney = useFormatMoney();
  const { dateFormat } = useCurrentCompanyDateFormats();
  const disableNavigation = useDisableNavigation();

  if (!invoice) return null;

  const money = (value: number) =>
    Number.isFinite(value)
      ? formatMoney(
          value,
          invoice.client?.country_id,
          invoice.client?.settings.currency_id
        )
      : '—';
  const formattedDate = (value: string) =>
    value ? date(value, dateFormat) : '—';

  return (
    <section
      className="allberto-entity-detail"
      aria-label={t('overview') as string}
    >
      <div className="allberto-entity-overview-hero">
        <div>
          <div className="allberto-entity-overview-amount">
            <strong>{money(invoice.amount)}</strong>
            <InvoiceStatus entity={invoice} />
          </div>
          <p>
            {t('invoice')} {invoice.number} · {invoice.client?.display_name}
          </p>
        </div>
        <Button
          to={route('/invoices/:id/pdf', { id: invoice.id })}
          type="secondary"
        >
          {t('view_pdf')}
        </Button>
      </div>

      <div className="allberto-entity-detail-grid">
        <div className="allberto-entity-detail-main">
          <Activities />
          <Card title={t('items')} withoutBodyPadding>
            {invoice.line_items.length > 0 ? (
              <table className="allberto-entity-items">
                <caption className="sr-only">{t('items')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('description')}</th>
                    <th scope="col">{t('quantity')}</th>
                    <th scope="col">{t('line_total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, index) => (
                    <tr key={item._id ?? index}>
                      <td>
                        <span className="font-semibold">
                          {item.product_key}
                        </span>
                        <div
                          className="allberto-entity-item-notes"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHTML(item.notes),
                          }}
                        />
                      </td>
                      <td>{item.quantity}</td>
                      <td>{money(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="allberto-entity-empty">{t('no_records_found')}</p>
            )}
            <dl className="allberto-entity-summary">
              {Boolean(invoice.discount) && (
                <div>
                  <dt>{t('discount')}</dt>
                  <dd>
                    {invoice.is_amount_discount
                      ? money(invoice.discount)
                      : `${invoice.discount}%`}
                  </dd>
                </div>
              )}
              {Boolean(invoice.total_taxes) && (
                <div>
                  <dt>{t('total_taxes')}</dt>
                  <dd>{money(invoice.total_taxes)}</dd>
                </div>
              )}
              {(
                [
                  ['total', invoice.amount],
                  ['paid_to_date', invoice.paid_to_date],
                  ['balance', invoice.balance],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <dt>{t(label)}</dt>
                  <dd>{money(value)}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Payments />
        </div>

        <aside
          className="allberto-entity-sidebar"
          aria-label={t('details') as string}
        >
          <Card title={t('details')} withoutBodyPadding>
            <dl className="allberto-entity-facts">
              <div>
                <dt>{t('number')}</dt>
                <dd>{invoice.number}</dd>
              </div>
              <div>
                <dt>{t('client')}</dt>
                <dd>
                  {invoice.client ? (
                    <DynamicLink
                      to={route('/clients/:id', { id: invoice.client_id })}
                      renderSpan={disableNavigation('client', invoice.client)}
                    >
                      {invoice.client.display_name}
                    </DynamicLink>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('invoice_date')}</dt>
                <dd>{formattedDate(invoice.date)}</dd>
              </div>
              <div>
                <dt>{t('due_date')}</dt>
                <dd>{formattedDate(invoice.due_date)}</dd>
              </div>
              <div>
                <dt>{t('last_sent_date')}</dt>
                <dd>{formattedDate(invoice.last_sent_date)}</dd>
              </div>
              <div>
                <dt>{t('auto_bill')}</dt>
                <dd>{t(invoice.auto_bill_enabled ? 'enabled' : 'disabled')}</dd>
              </div>
              <div>
                <dt>{t('recurring_invoice')}</dt>
                <dd>
                  {invoice.recurring_id ? (
                    <Link
                      to={route('/recurring_invoices/:id/edit', {
                        id: invoice.recurring_id,
                      })}
                    >
                      {t('view')}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt>{t('email_history')}</dt>
                <dd>
                  <Link
                    to={route('/invoices/:id/email_history', {
                      id: invoice.id,
                    })}
                  >
                    {t('view')}
                  </Link>
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </section>
  );
}
