import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createInstance } from 'i18next';
import { describe, expect, test } from 'vitest';
import en from '../../src/resources/lang/en/en.json';
import { pluralKey } from '../../src/pages/dashboard/helpers/allberto-i18n';
import pt from '../../src/resources/lang/pt_BR/pt_BR.json';

const allberto = (dict: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(dict).filter(([key]) => key.startsWith('allberto_'))
  );

const vars = (text: string) =>
  [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);

    if (path.includes('resources/lang')) return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);

    return /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe('traduções allberto_*', () => {
  const ptKeys = allberto(pt as Record<string, string>);
  const enKeys = allberto(en as Record<string, string>);

  test('pt_BR e en têm o mesmo conjunto de chaves e variáveis', () => {
    expect(Object.keys(ptKeys).sort()).toEqual(Object.keys(enKeys).sort());

    for (const key of Object.keys(ptKeys)) {
      expect(vars(ptKeys[key]), key).toEqual(vars(enKeys[key]));
    }
  });

  test('toda chave usada no código existe (base ou plural _one/_other)', () => {
    const used = new Set<string>();
    const plurals = new Set<string>();

    for (const file of sourceFiles('src')) {
      for (const match of readFileSync(file, 'utf8').matchAll(
        /t\(\s*'(allberto_[a-z0-9_]+)'/g
      )) {
        used.add(match[1]);
      }

      for (const match of readFileSync(file, 'utf8').matchAll(
        /pluralKey\(\s*'(allberto_[a-z0-9_]+)'/g
      )) {
        plurals.add(match[1]);
      }
    }

    expect(plurals.size).toBe(4);

    for (const key of plurals) {
      expect(`${key}_one` in ptKeys && `${key}_other` in ptKeys, key).toBe(
        true
      );
      expect(`${key}_one` in enKeys && `${key}_other` in enKeys, key).toBe(
        true
      );
    }

    expect(used.size).toBeGreaterThan(40);

    for (const key of used) {
      const exists =
        key in ptKeys || (`${key}_one` in ptKeys && `${key}_other` in ptKeys);

      expect(exists, key).toBe(true);
    }
  });

  test('interpolação e plural reais nos dois idiomas; outros idiomas caem no inglês', async () => {
    const i18n = createInstance();

    await i18n.init({
      lng: 'pt_BR',
      fallbackLng: 'en',
      resources: {
        en: { translation: en },
        pt_BR: { translation: pt },
        de: { translation: { dashboard: 'Dashboard' } },
      },
      interpolation: { escapeValue: false },
    });

    const lng = () => i18n.language;

    expect(i18n.t(pluralKey('allberto_days_late', 1, lng()), { n: 1 })).toBe(
      'Em atraso há 1 dia'
    );
    expect(i18n.t(pluralKey('allberto_days_late', 13, lng()), { n: 13 })).toBe(
      'Em atraso há 13 dias'
    );
    expect(
      i18n.t(pluralKey('allberto_receivable_hint', 8, lng()), {
        n: 8,
        overdue: 'R$ 1,00',
      })
    ).toBe('8 faturas em aberto · R$ 1,00 já vencido');
    expect(i18n.t('allberto_partial_list', { n: 50 })).toContain('50');
    expect(i18n.t('allberto_paid_in_month', { month: 'novembro' })).toBe(
      'Recebido em novembro'
    );

    await i18n.changeLanguage('en');
    expect(
      i18n.t(pluralKey('allberto_overdue_clients', 1, lng()), { n: 1 })
    ).toBe('1 client');
    expect(
      i18n.t(pluralKey('allberto_overdue_clients', 2, lng()), { n: 2 })
    ).toBe('2 clients');

    await i18n.changeLanguage('de');
    expect(i18n.t('allberto_retry')).toBe('Try again');
  });
});

describe('pluralKey', () => {
  test('normaliza pt_BR, usa plural para zero e tolera código inválido', () => {
    expect(pluralKey('k', 1, 'pt_BR')).toBe('k_one');
    expect(pluralKey('k', 2, 'pt_BR')).toBe('k_other');
    expect(pluralKey('k', 0, 'pt_BR')).toBe('k_other');
    expect(pluralKey('k', 1, 'xx_INVALID_@')).toBe('k_one');
  });
});
