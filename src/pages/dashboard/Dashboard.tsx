/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import dayjs from 'dayjs';
import { useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ModuleBitmask } from '$app/common/enums/module-bitmask';
import { useEnabled } from '$app/common/guards/guards/enabled';
import { useOpenFeedbackSlider } from '$app/common/hooks/useOpenFeedbackSlider';
import { reactSettingsAtom } from '$app/common/hooks/useReactSettings';
import { useCurrentCompanyDateFormats } from '$app/common/hooks/useCurrentCompanyDateFormats';
import { usePreferences } from '$app/common/hooks/usePreferences';
import { useTitle } from '$app/common/hooks/useTitle';
import { usePrivacySupport } from '$app/components/layouts/common/privacy';
import { Onboarding } from '$app/pages/dashboard/components/allberto/Onboarding';
import { PositionToday } from '$app/pages/dashboard/components/allberto/PositionToday';
import {
  NeedsAction,
  TopContracts,
  UpcomingCharges,
} from '$app/pages/dashboard/components/allberto/Sections';
import { Activity } from '$app/pages/dashboard/components/Activity';
import { PastDueInvoices } from '$app/pages/dashboard/components/PastDueInvoices';
import { RecentPayments } from '$app/pages/dashboard/components/RecentPayments';
import { Totals } from '$app/pages/dashboard/components/Totals';
import { UpcomingInvoices } from '$app/pages/dashboard/components/UpcomingInvoices';
import { Default } from '../../components/layouts/Default';
import { ExpiredQuotes } from './components/ExpiredQuotes';
import { UpcomingQuotes } from './components/UpcomingQuotes';
import { UpcomingRecurringInvoices } from './components/UpcomingRecurringInvoices';

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function Dashboard() {
  useTitle('dashboard');
  usePrivacySupport();

  const [t] = useTranslation();
  const enabled = useEnabled();
  const { preferences } = usePreferences();
  const { dateFormat } = useCurrentCompanyDateFormats();

  // Moeda compartilhada com o histórico (preferência existente do Ninja).
  const currency = preferences.dashboard_charts?.currency || 1;
  const openFeedbackSlider = useOpenFeedbackSlider();
  // Try opening feedback once after settings hydrate.
  const isReactSettingsHydrated = useAtomValue(reactSettingsAtom) !== null;
  const feedbackTriedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isReactSettingsHydrated || feedbackTriedRef.current) return;
    feedbackTriedRef.current = true;
    openFeedbackSlider();
  }, [isReactSettingsHydrated, openFeedbackSlider]);

  const today = dayjs();

  return (
    <Default
      title={t('dashboard')}
      breadcrumbs={[]}
      withoutPageTitle
      contentVariant="dashboard"
    >
      <div className="ab-dashboard">
        <header>
          <p className="ab-eyebrow">{t('allberto_overview')}</p>
          <h1 className="ab-h1">{t('dashboard')}</h1>
          <p className="ab-sub mt-2" style={{ fontSize: 14 }}>
            <time dateTime={today.format('YYYY-MM-DD')}>
              {capitalize(today.format('dddd'))}, {today.format(dateFormat)}
            </time>
          </p>
        </header>

        <Onboarding />

        <PositionToday currencyId={currency} />

        {enabled(ModuleBitmask.Invoices) && <NeedsAction />}

        {enabled(ModuleBitmask.RecurringInvoices) && (
          <div className="ab-duo">
            <UpcomingCharges />
            <TopContracts />
          </div>
        )}

        <section aria-labelledby="ab-history" className="flex flex-col gap-3">
          <div>
            <h2 id="ab-history" className="ab-h2">
              {t('allberto_history')}
            </h2>
            <p className="ab-sub mt-1">{t('allberto_history_hint')}</p>
          </div>

          <Totals />
        </section>

        <div className="ab-duo ab-duo--even">
          <Activity />
          <RecentPayments />
        </div>

        <section aria-labelledby="ab-more" className="flex flex-col gap-3">
          <h2 id="ab-more" className="ab-h2">
            {t('allberto_more_lists')}
          </h2>

          <div className="ab-duo ab-duo--even">
            {enabled(ModuleBitmask.Invoices) && <UpcomingInvoices />}

            {enabled(ModuleBitmask.Invoices) && <PastDueInvoices />}

            {enabled(ModuleBitmask.RecurringInvoices) && (
              <UpcomingRecurringInvoices />
            )}

            {enabled(ModuleBitmask.Quotes) && <ExpiredQuotes />}

            {enabled(ModuleBitmask.Quotes) && <UpcomingQuotes />}
          </div>
        </section>
      </div>
    </Default>
  );
}
