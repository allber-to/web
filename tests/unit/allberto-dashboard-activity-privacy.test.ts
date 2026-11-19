import { createElement, Fragment } from 'react';
import { act, create } from 'react-test-renderer';
import { describe, expect, test, vi } from 'vitest';

const privacy = vi.hoisted(() => ({ hidden: false }));

vi.mock('react-i18next', () => ({
  useTranslation: () => [(key: string) => key],
}));

vi.mock('$app/common/helpers', () => ({
  // Modelo real do idioma en (activity_40) + notas.
  trans: (key: string) =>
    key === 'activity_40'
      ? ':user refunded :adjustment of a :payment_amount payment :payment :notes'
      : key,
  date: () => '',
  endpoint: (url: string) => url,
}));

vi.mock('$app/common/colors', () => ({ useColorScheme: () => ({}) }));
vi.mock('$app/common/hooks/useInvoiceEditor', () => ({
  useInvoiceEditorPaths: () => ({ edit: '/invoices/:id/edit' }),
}));
vi.mock('$app/common/helpers/request', () => ({ request: vi.fn() }));
vi.mock('$app/common/helpers/toast/toast', () => ({ toast: {} }));
vi.mock('$app/common/hooks/useCompanyTimeFormat', () => ({
  useCompanyTimeFormat: () => ({ timeFormat: 'HH:mm' }),
}));
vi.mock('$app/common/hooks/useCurrentCompanyDateFormats', () => ({
  useCurrentCompanyDateFormats: () => ({ dateFormat: 'DD/MM/YYYY' }),
}));
vi.mock('$app/common/hooks/useRefetch', () => ({ $refetch: vi.fn() }));
vi.mock('$app/components/forms', () => ({
  Button: () => null,
  InputField: () => null,
  Link: (props: { children: unknown }) =>
    createElement('a', null, props.children as never),
}));
vi.mock('$app/components/icons/ArrowRight', () => ({ ArrowRight: () => null }));
vi.mock('$app/components/icons/SquareActivityChart', () => ({
  SquareActivityChart: () => null,
}));
vi.mock('$app/components/Modal', () => ({ Modal: () => null }));
vi.mock('$app/components/layouts/common/privacy', () => ({
  MASKED_VALUE: '••••••',
  useHideValues: () => privacy.hidden,
}));

import { useGenerateActivityElement } from '../../src/pages/dashboard/hooks/useGenerateActivityElement';

const refund = {
  id: '1',
  activity_type_id: 40,
  created_at: 1700000000,
  ip: '127.0.0.1',
  user: { label: 'Ana', hashed_id: 'u1' },
  payment: { label: 'P-0001', hashed_id: 'p1' },
  payment_amount: { label: 'R$ 6.800,00', hashed_id: '' },
  adjustment: { label: 'R$ 1.200,00', hashed_id: '' },
  notes: 'Estorno combinado de R$ 1.200,00',
};

function renderActivity() {
  let html = '';

  function Probe() {
    const element = useGenerateActivityElement();

    return createElement(Fragment, null, element(refund as never));
  }

  let renderer: ReturnType<typeof create>;

  act(() => {
    renderer = create(createElement(Probe));
  });

  html = JSON.stringify(renderer!.toJSON());
  act(() => renderer.unmount());

  return html;
}

describe('atividade de estorno com "ocultar valores"', () => {
  test('desligado: valores e notas visíveis', () => {
    privacy.hidden = false;
    const html = renderActivity();

    expect(html).toContain('R$ 1.200,00');
    expect(html).toContain('R$ 6.800,00');
  });

  test('ligado: estorno, pagamento e notas livres mascarados', () => {
    privacy.hidden = true;
    const html = renderActivity();

    expect(html).not.toMatch(/\d{1,3}(\.\d{3})*,\d{2}/);
    expect(html).toContain('••••••');
    expect(html).toContain('allberto_note_hidden');
    expect(html).toContain('P-0001');
  });
});
