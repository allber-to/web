/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useTranslation } from 'react-i18next';
import { useFormatMoney } from '$app/common/hooks/money/useFormatMoney';
import { Client } from '$app/common/interfaces/client';

interface Props {
  client: Client;
}

export function Standing(props: Props) {
  const { client } = props;

  const [t] = useTranslation();

  const formatMoney = useFormatMoney();

  return (
    <section aria-label={t('standing') as string}>
      <dl className="allberto-entity-metrics">
        {(
          [
            ['paid_to_date', client.paid_to_date],
            ['outstanding', client.balance],
            ['credit_balance', client.credit_balance],
            ['payment_balance', client.payment_balance],
          ] as const
        ).map(([label, value]) => (
          <div className="allberto-entity-metric" key={label}>
            <dt>{t(label)}</dt>
            <dd>
              {Number.isFinite(value)
                ? formatMoney(
                    value,
                    client.country_id,
                    client.settings.currency_id
                  )
                : '—'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
