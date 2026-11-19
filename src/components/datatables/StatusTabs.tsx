/**
 * Allberto — atalhos visuais de status ("abas") do DataTable.
 *
 * Usam exatamente o mesmo estado `customFilter` do seletor existente
 * (Actions › custom filters) via `setCustomFilterIfChanged`: nenhuma
 * contagem é exibida e filtros de outros dropdowns (dropdownKey ≠ '0') são
 * preservados. Seleções múltiplas feitas no seletor avançado continuam
 * valendo; nesse caso nenhuma aba aparece como ativa.
 */

import { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { SelectOption } from './Actions';

export function primaryFilterOptions(customFilters: SelectOption[]) {
  return customFilters.filter((option) => (option.dropdownKey ?? '0') === '0');
}

/** Valores selecionados que pertencem ao grupo principal (dropdown '0'). */
export function selectedPrimaryValues(
  customFilters: SelectOption[],
  customFilter: string[] | undefined
) {
  const primary = new Set(
    primaryFilterOptions(customFilters).map((option) => option.value)
  );

  return (customFilter ?? []).filter((value) => primary.has(value));
}

/** Próximo estado ao escolher uma aba (`null` = Todos). */
export function nextCustomFilter(
  customFilters: SelectOption[],
  current: string[] | undefined,
  value: string | null
) {
  const primary = new Set(
    primaryFilterOptions(customFilters).map((option) => option.value)
  );

  const others = (current ?? []).filter((item) => !primary.has(item));

  return value === null ? others : [...others, value];
}

interface Props {
  customFilters: SelectOption[];
  customFilter: string[] | undefined;
  onChange: Dispatch<SetStateAction<string[] | undefined>>;
}

export function StatusTabs(props: Props) {
  const [t] = useTranslation();

  const options = primaryFilterOptions(props.customFilters);
  const selected = selectedPrimaryValues(
    props.customFilters,
    props.customFilter
  );

  if (!options.length) {
    return null;
  }

  const select = (value: string | null) =>
    props.onChange((current) =>
      nextCustomFilter(props.customFilters, current, value)
    );

  return (
    <div
      className="ab-tabs"
      role="group"
      aria-label={t('status') as string}
      data-cy="statusTabs"
    >
      <button
        type="button"
        className="ab-tab"
        aria-pressed={selected.length === 0}
        onClick={() => select(null)}
      >
        {t('all')}
      </button>

      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ab-tab"
          aria-pressed={selected.length === 1 && selected[0] === option.value}
          onClick={() => select(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
