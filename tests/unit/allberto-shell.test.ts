import { describe, expect, test, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => [(key: string) => key],
}));

import {
  isNavigationItemActive,
  organizeNavigation,
} from '../../src/components/layouts/common/allberto-navigation';
import {
  MASKED_VALUE,
  maskValue,
} from '../../src/components/layouts/common/privacy';
import {
  nextCustomFilter,
  selectedPrimaryValues,
} from '../../src/components/datatables/StatusTabs';

const icon = () => null;

const item = (href: string, visible = true) => ({
  name: href,
  href,
  icon,
  visible,
});

describe('organizeNavigation', () => {
  test('reordena segundo a proposta e manda o resto para "Mais" sem perder módulos', () => {
    const ninjaOrder = [
      '/dashboard',
      '/clients',
      '/products',
      '/invoices',
      '/recurring_invoices',
      '/payments',
      '/quotes',
      '/credits',
      '/projects',
      '/tasks',
      '/vendors',
      '/purchase_orders',
      '/expenses',
      '/recurring_expenses',
      '/transactions',
      '/reports',
      '/docuninja',
      '/settings/company_details',
      '/novo_modulo_upstream',
    ].map((href) => item(href));

    const { primary, more } = organizeNavigation(ninjaOrder);

    expect(primary.map((entry) => entry.href)).toEqual([
      '/dashboard',
      '/clients',
      '/recurring_invoices',
      '/invoices',
      '/payments',
      '/quotes',
      '/products',
      '/reports',
      '/settings/company_details',
    ]);

    expect(more.map((entry) => entry.href)).toEqual([
      '/credits',
      '/projects',
      '/tasks',
      '/vendors',
      '/purchase_orders',
      '/expenses',
      '/recurring_expenses',
      '/transactions',
      '/docuninja',
      '/novo_modulo_upstream',
    ]);

    expect(primary.length + more.length).toBe(ninjaOrder.length);
  });

  test('respeita visibilidade (permissões/módulos) já calculada pelo Ninja', () => {
    const { primary, more } = organizeNavigation([
      item('/dashboard', false),
      item('/clients'),
      item('/credits', false),
    ]);

    expect(primary.map((entry) => entry.href)).toEqual(['/clients']);
    expect(more).toHaveLength(0);
  });

  test('item ativo não confunde /invoices com /recurring_invoices', () => {
    expect(
      isNavigationItemActive('/recurring_invoices/1/edit', '/invoices')
    ).toBe(false);
    expect(isNavigationItemActive('/invoices/1/edit', '/invoices')).toBe(true);
    expect(
      isNavigationItemActive(
        '/settings/user_details',
        '/settings/company_details'
      )
    ).toBe(true);
  });
});

describe('máscara de valores', () => {
  test('substitui o texto inteiro, sem deixar dígitos', () => {
    expect(maskValue(true, 'R$ 47.000,00')).toBe(MASKED_VALUE);
    expect(MASKED_VALUE).not.toMatch(/\d/);
    expect(maskValue(false, 'R$ 47.000,00')).toBe('R$ 47.000,00');
  });
});

describe('abas de status do DataTable', () => {
  const filters = [
    { label: 'Draft', value: 'draft', color: '', backgroundColor: '' },
    { label: 'Paid', value: 'paid', color: '', backgroundColor: '' },
    {
      label: 'Archived',
      value: 'archived',
      color: '',
      backgroundColor: '',
      dropdownKey: '1' as const,
    },
  ];

  test('trocar de aba preserva filtros de outro dropdown', () => {
    expect(nextCustomFilter(filters, ['draft', 'archived'], 'paid')).toEqual([
      'archived',
      'paid',
    ]);
    expect(nextCustomFilter(filters, ['draft', 'archived'], null)).toEqual([
      'archived',
    ]);
    expect(nextCustomFilter(filters, undefined, 'draft')).toEqual(['draft']);
  });

  test('multiseleção do filtro avançado é preservada e reconhecida', () => {
    expect(
      selectedPrimaryValues(filters, ['draft', 'paid', 'archived'])
    ).toEqual(['draft', 'paid']);
  });
});
