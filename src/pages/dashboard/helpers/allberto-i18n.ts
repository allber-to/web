/**
 * Plural local das chaves allberto_*.
 *
 * O app usa códigos com sublinhado (`pt_BR`), que o resolvedor de plural do
 * i18next não reconhece — ele cai no idioma de fallback. Aqui a categoria
 * vem de Intl.PluralRules com o código normalizado (`pt-BR`), e a chave
 * recebe `{{n}}` em vez de `{{count}}` para não acionar o plural do i18next.
 */
export function pluralKey(base: string, count: number, language: string) {
  // CLDR trata 0 como "one" em pt; no produto, zero usa a forma plural.
  if (count === 0) {
    return `${base}_other`;
  }

  let category: string;

  try {
    category = new Intl.PluralRules(language.replace('_', '-')).select(count);
  } catch {
    category = count === 1 ? 'one' : 'other';
  }

  return `${base}_${category === 'one' ? 'one' : 'other'}`;
}
