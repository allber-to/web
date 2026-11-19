import { createElement, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ nextSendDate: '' }));
vi.mock('react-i18next', () => ({
  useTranslation: () => [
    (key: string, values?: { n: number }) =>
      key.startsWith('allberto_charges_count') ? `${values?.n} cobr.` : key,
    { language: 'pt_BR' },
  ],
}));
vi.mock('$app/common/hooks/permissions/useHasPermission', () => ({
  useHasPermission: () => () => true,
}));
vi.mock('$app/common/hooks/useCurrentCompanyDateFormats', () => ({
  useCurrentCompanyDateFormats: () => ({ dateFormat: 'DD/MM/YYYY' }),
}));
vi.mock('$app/common/hooks/useDisableNavigation', () => ({
  useDisableNavigation: () => () => false,
}));
vi.mock('$app/common/hooks/useInvoiceEditor', () => ({
  useInvoiceEditorPaths: () => ({}),
}));
vi.mock('$app/components/DynamicLink', () => ({
  DynamicLink: ({ children }: { children: ReactNode }) =>
    createElement('a', {}, children),
}));
vi.mock('$app/components/layouts/components/SidebarItem', () => ({
  NavLink: ({ children }: { children: ReactNode }) =>
    createElement('a', {}, children),
}));
vi.mock('$app/pages/dashboard/hooks/useDashboardFormatMoney', () => ({
  useDashboardFormatMoney: () => (value: number) => `R$ ${value}`,
}));
vi.mock('$app/pages/dashboard/hooks/useAllbertoQueries', () => ({
  UPCOMING_PAGE_SIZE: 50,
  OVERDUE_PAGE_SIZE: 50,
  useUpcomingRecurring: () => ({
    isSuccess: true,
    data: {
      data: [
        {
          id: 'local-recurring',
          next_send_date: state.nextSendDate,
          amount: 75,
          number: 'R-1',
          client: { name: 'Local', settings: {} },
        },
      ],
    },
  }),
}));
vi.mock('$app/pages/dashboard/components/allberto/States', () => ({
  DashboardSection: ({ children }: { children: ReactNode }) =>
    createElement('section', {}, children),
}));

import { UpcomingCharges } from '$app/pages/dashboard/components/allberto/Sections';

afterEach(() => vi.useRealTimers());

test.each([
  '2026-11-22',
  '2026-11-22 00:00:00',
])('calendar counts the persisted recurring invoice date %s', (nextSendDate) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 19, 12));
  state.nextSendDate = nextSendDate;
  const html = renderToStaticMarkup(createElement(UpcomingCharges));
  const calendar = html.match(/<ol[^>]*>(.*?)<\/ol>/)?.[1];
  expect(calendar).toMatch(/22\/11<\/span><span[^>]*>1 cobr\./);
  expect(calendar?.match(/>0 cobr\./g)).toHaveLength(6);
});
