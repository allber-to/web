import dayjs from 'dayjs';
import { describe, expect, test } from 'vitest';
import {
  daysOverdue,
  effectiveDueDate,
  nextDays,
  percentOf,
  readCurrentPosition,
  readPaidToDate,
  resolvePositionCurrency,
  currencyCodeOf,
  MISSING,
  overdueRowsForPosition,
  isPartialOnlyOverdue,
  toAmount,
  withinWindow,
} from '../../src/pages/dashboard/helpers/allberto-dashboard';

describe('readCurrentPosition', () => {
  test('separa vencido do total pelo current_amount do aging', () => {
    const position = readCurrentPosition(
      {
        '1': {
          mrr: { mrr: '47000.00', arr: '564000.00' },
          aging: {
            total: '36900.00',
            current_amount: '26600.00',
            outstanding_count: 8,
          },
        },
      },
      1
    );

    expect(position).toEqual({
      mrr: 47000,
      receivable: 36900,
      overdue: 10300,
      openInvoices: 8,
    });
  });

  test('objeto vazio do backend é zero legítimo, não indisponível', () => {
    expect(readCurrentPosition({ '2': { mrr: {}, aging: {} } }, 2)).toEqual({
      mrr: 0,
      receivable: 0,
      overdue: 0,
      openInvoices: 0,
    });
  });

  test('moeda ausente é neutra; resposta vazia ou valor inválido ficam indisponíveis', () => {
    expect(readCurrentPosition(undefined, 1)).toBeNull();
    expect(readCurrentPosition({ '1': { mrr: {}, aging: {} } }, 3)).toBe(
      MISSING
    );
    expect(readCurrentPosition({ '1': { mrr: {}, aging: {} } }, null)).toBe(
      MISSING
    );
    expect(
      readCurrentPosition(
        {
          '1': {
            mrr: { mrr: 'abc' },
            aging: { total: '1', current_amount: '1' },
          },
        },
        1
      )
    ).toBeNull();
  });

  test('usa a chave consolidada 999 sem somar moedas no cliente', () => {
    const response = {
      '1': { mrr: { mrr: '10' }, aging: { total: '5', current_amount: '5' } },
      '2': { mrr: { mrr: '20' }, aging: { total: '7', current_amount: '2' } },
      '999': {
        mrr: { mrr: '13.5' },
        aging: { total: '9', current_amount: '6' },
      },
    };

    const position = readCurrentPosition(response, 999);
    if (position === null || position === MISSING) {
      throw new Error('Expected the consolidated position for currency 999');
    }
    expect(position.mrr).toBe(13.5);
    expect(position.overdue).toBe(3);
  });
});

describe('readPaidToDate', () => {
  test('lê revenue.paid_to_date e distingue erro de zero', () => {
    expect(
      readPaidToDate({ '1': { revenue: { paid_to_date: '10100' } } }, 1)
    ).toBe(10100);
    expect(readPaidToDate({ '1': { revenue: {} } }, 1)).toBe(0);
    expect(readPaidToDate({}, 1)).toBe(MISSING);
    expect(readPaidToDate(undefined, 1)).toBeNull();
  });
});

describe('helpers de data e proporção', () => {
  const today = dayjs('2026-11-18');

  test('vencimento da parcela tem prioridade como no card original', () => {
    expect(
      effectiveDueDate({
        due_date: '2026-11-10',
        partial_due_date: '2026-11-05',
      })
    ).toBe('2026-11-05');
    expect(
      effectiveDueDate({ due_date: '2026-11-10', partial_due_date: '' })
    ).toBe('2026-11-10');
  });

  test('dias de atraso', () => {
    expect(daysOverdue('2026-11-05', today)).toBe(13);
    expect(daysOverdue('2026-11-20', today)).toBe(0);
    expect(daysOverdue('', today)).toBeNull();
  });

  test('percentOf limita entre 0 e 100 e não divide por zero', () => {
    expect(percentOf(5, 0)).toBe(0);
    expect(percentOf(150, 100)).toBe(100);
    expect(percentOf(25, 100)).toBe(25);
    expect(toAmount('')).toBeNull();
  });

  test('janela de 7 dias e indicação de lista parcial', () => {
    expect(nextDays(today).map((day) => day.date)).toEqual([
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
    ]);

    const records = [
      { next_send_date: '2026-11-17' },
      { next_send_date: '2026-11-18' },
      { next_send_date: '2026-11-24' },
      { next_send_date: '2026-11-25' },
    ];

    const result = withinWindow(records, today, 50);
    expect(result.items).toHaveLength(2);
    expect(result.possiblyPartial).toBe(false);

    const full = withinWindow(records.slice(1, 3), today, 2);
    expect(full.possiblyPartial).toBe(true);
  });
});

describe('moeda da Posição hoje', () => {
  // Empresa em BRL (12): o backend só devolve moedas em uso + a da empresa.
  const brl = {
    currencies: { '12': 'BRL', '2': 'USD' },
    '12': {
      mrr: { mrr: '47000' },
      aging: { total: '10', current_amount: '4' },
    },
    '2': { mrr: { mrr: '100' }, aging: { total: '0', current_amount: '0' } },
    '999': {
      mrr: { mrr: '47500' },
      aging: { total: '11', current_amount: '4' },
    },
  };

  test('padrão 1 injetado pelas preferências cai na moeda da empresa (BRL)', () => {
    const key = resolvePositionCurrency(brl, 1, '12');

    expect(key).toBe('12');
    expect(currencyCodeOf(brl, key)).toBe('BRL');
    expect(readCurrentPosition(brl, key)).toMatchObject({
      mrr: 47000,
      overdue: 6,
    });
  });

  test('escolha explícita válida e 999 são preservadas', () => {
    expect(resolvePositionCurrency(brl, 2, '12')).toBe('2');
    expect(resolvePositionCurrency(brl, '999', '12')).toBe('999');
  });

  test('moeda ausente na resposta 200 fica neutra, sem zero inventado', () => {
    const onlyUsd = { currencies: { '2': 'USD' }, '2': brl['2'] };
    const key = resolvePositionCurrency(onlyUsd, 1, '12');

    expect(key).toBeNull();
    expect(readCurrentPosition(onlyUsd, key)).toBe(MISSING);
    expect(readPaidToDate(onlyUsd, key)).toBe(MISSING);
  });

  test('não usa a chave "currencies" como moeda', () => {
    expect(resolvePositionCurrency(brl, 'currencies', undefined)).toBeNull();
  });
});

describe('vencidas coerentes com o KPI', () => {
  const today = dayjs('2026-11-18');
  const rows = [
    {
      client_id: 'a',
      due_date: '2026-11-01',
      client: { settings: { currency_id: '12' } },
    },
    {
      client_id: 'b',
      due_date: '2026-11-02',
      client: { settings: { currency_id: '2' } },
    },
    { client_id: 'c', due_date: '2026-12-30', client: { settings: {} } },
    { client_id: 'd', due_date: '2026-11-03', client: { settings: {} } },
  ];

  test('filtra pela moeda resolvida (empresa como padrão) e por due_date vencido', () => {
    expect(
      overdueRowsForPosition(rows, '12', '12', today).map((r) => r.client_id)
    ).toEqual(['a', 'd']);
    expect(overdueRowsForPosition(rows, '999', '12', today)).toHaveLength(3);
  });

  test('parcela vencida com vencimento final futuro é identificada', () => {
    expect(
      isPartialOnlyOverdue(
        { due_date: '2026-12-30', partial_due_date: '2026-11-10', partial: 50 },
        today
      )
    ).toBe(true);
    expect(
      isPartialOnlyOverdue(
        { due_date: '2026-11-10', partial_due_date: '2026-11-05', partial: 50 },
        today
      )
    ).toBe(false);
    expect(
      isPartialOnlyOverdue(
        { due_date: '2026-12-30', partial_due_date: '', partial: 0 },
        today
      )
    ).toBe(false);
  });
});
